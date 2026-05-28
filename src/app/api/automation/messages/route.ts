import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type AutomationAction = "mark_sent" | "mark_failed" | "cancel";

type ActionPayload = {
  action?: AutomationAction;
  ids?: string[];
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readAutomationToken(request: Request) {
  const url = new URL(request.url);
  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.replace(/^Bearer\s+/i, "").trim();

  return [
    url.searchParams.get("token"),
    request.headers.get("x-automation-secret"),
    request.headers.get("x-token"),
    bearerToken,
  ]
    .map(cleanText)
    .filter(Boolean);
}

function unauthorized() {
  return NextResponse.json({ error: "Token invalido." }, { status: 401 });
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

function authorize(request: Request) {
  const secret = cleanText(
    process.env.AUTOMATION_API_SECRET || process.env.KIWIFY_WEBHOOK_SECRET
  );

  if (!secret) {
    return NextResponse.json(
      { error: "AUTOMATION_API_SECRET ainda nao configurado." },
      { status: 503 }
    );
  }

  const receivedTokens = readAutomationToken(request);

  if (!receivedTokens.includes(secret)) {
    return unauthorized();
  }

  return null;
}

export async function GET(request: Request) {
  const authError = authorize(request);

  if (authError) {
    return authError;
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase ainda nao configurado no ambiente." },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") || 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 10;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("automation_messages")
    .select(
      "id,email,whatsapp,nome,order_id,payment_method,trigger_event,etapa,canal,mensagem,enviar_em,status,metadata"
    )
    .eq("status", "pendente")
    .lte("enviar_em", now)
    .order("enviar_em", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    count: data?.length || 0,
    messages: data || [],
  });
}

export async function POST(request: Request) {
  const authError = authorize(request);

  if (authError) {
    return authError;
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase ainda nao configurado no ambiente." },
      { status: 503 }
    );
  }

  let payload: ActionPayload;

  try {
    payload = (await request.json()) as ActionPayload;
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const action = payload.action;
  const ids = Array.isArray(payload.ids)
    ? payload.ids.map(cleanText).filter(Boolean)
    : [];

  if (!action || !["mark_sent", "mark_failed", "cancel"].includes(action)) {
    return NextResponse.json({ error: "Acao invalida." }, { status: 400 });
  }

  if (!ids.length) {
    return NextResponse.json({ error: "Informe ao menos um id." }, { status: 400 });
  }

  const nextStatusByAction: Record<AutomationAction, string> = {
    mark_sent: "enviada",
    mark_failed: "erro",
    cancel: "cancelada",
  };

  const { data, error } = await supabase
    .from("automation_messages")
    .update({ status: nextStatusByAction[action] })
    .in("id", ids)
    .select("id,status");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    updated: data?.length || 0,
    messages: data || [],
  });
}
