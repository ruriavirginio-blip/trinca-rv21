import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getSupabaseConfig() {
  const supabaseUrl = cleanText(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseServiceRoleKey = cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY);

  return { supabaseServiceRoleKey, supabaseUrl };
}

function createSupabaseAdmin() {
  const { supabaseServiceRoleKey, supabaseUrl } = getSupabaseConfig();

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

function tableMissingMessage(message: string) {
  return message.includes("content_queue") || message.includes("schema cache");
}

export async function GET() {
  const supabase = createSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({
      configured: false,
      pendingApproval: 0,
      items: [],
      message: "Supabase server credentials nao configuradas.",
    });
  }

  const { count, error: countError } = await supabase
    .from("content_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "aguardando_aprovacao");

  if (countError) {
    const message = countError.message || "";

    if (tableMissingMessage(message)) {
      return NextResponse.json({
        configured: false,
        pendingApproval: 0,
        items: [],
        message: "Tabela content_queue ainda nao existe no Supabase.",
      });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }

  const { data: items, error: itemsError } = await supabase
    .from("content_queue")
    .select("id,titulo,url_video,tipo,status,feedback,criado_em,aprovado_em,publicado_em")
    .order("criado_em", { ascending: false })
    .limit(50);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({
    configured: true,
    pendingApproval: count || 0,
    items: items || [],
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = createSupabaseAdmin();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase server credentials nao configuradas." }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    feedback?: unknown;
    id?: unknown;
    status?: unknown;
  };
  const id = cleanText(body.id);
  const status = cleanText(body.status);
  const feedback = cleanText(body.feedback);
  const allowedStatuses = new Set(["aguardando_aprovacao", "aprovado", "rejeitado", "publicado"]);

  if (!id || !allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Informe id e status valido." }, { status: 400 });
  }

  const update: Record<string, string | null> = { status };

  if (feedback) update.feedback = feedback;
  if (status === "aprovado") update.aprovado_em = new Date().toISOString();
  if (status === "publicado") update.publicado_em = new Date().toISOString();
  if (status === "aguardando_aprovacao") {
    update.aprovado_em = null;
    update.publicado_em = null;
  }

  const { data, error } = await supabase
    .from("content_queue")
    .update(update)
    .eq("id", id)
    .select("id,titulo,url_video,tipo,status,feedback,criado_em,aprovado_em,publicado_em")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
