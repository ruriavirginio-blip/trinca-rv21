import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sendTwilioMessage } from "@/lib/whatsapp/twilio";

type JsonObject = Record<string, unknown>;

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
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
  // Aceita o secret geral OU o token dedicado de operação (MONITOR_TOKEN),
  // usado pelo gatilho 24/7 do Make.com que drena a fila (substitui o worker).
  const secrets = [
    process.env.AUTOMATION_API_SECRET,
    process.env.KIWIFY_WEBHOOK_SECRET,
    process.env.MONITOR_TOKEN,
  ]
    .map(cleanText)
    .filter(Boolean);

  if (!secrets.length) {
    return NextResponse.json(
      { error: "AUTOMATION_API_SECRET ainda nao configurado." },
      { status: 503 }
    );
  }

  if (!readAutomationToken(request).some((token) => secrets.includes(token))) {
    return NextResponse.json({ error: "Token invalido." }, { status: 401 });
  }

  return null;
}

function requiredPreviousSteps(message: JsonObject) {
  const metadata = asObject(message.metadata);
  const required = metadata.required_previous_steps;

  return Array.isArray(required) ? required.map(cleanText).filter(Boolean) : [];
}

function sentAtFromMetadata(message: JsonObject) {
  const metadata = asObject(message.metadata);
  const provider = asObject(metadata.whatsapp_provider);

  return cleanText(metadata.completed_at) || cleanText(provider.sent_at) || cleanText(message.created_at);
}

function delayAfterPreviousMinutes(message: JsonObject) {
  const metadata = asObject(message.metadata);
  const minutes = Number(metadata.delay_after_previous_minutes || 0);

  return Number.isFinite(minutes) ? Math.max(minutes, 0) : 0;
}

async function sendWhatsappMessage(message: JsonObject) {
  const payload = {
    id: cleanText(message.id),
    whatsapp: message.whatsapp,
    mensagem: message.mensagem,
    etapa: message.etapa,
    metadata: message.metadata,
  };

  return sendTwilioMessage(payload);
}

async function claimPendingMessage(supabase: SupabaseClient, message: JsonObject) {
  const metadata = asObject(message.metadata);
  const { data, error } = await supabase
    .from("automation_messages")
    .update({
      status: "processando",
      metadata: {
        ...metadata,
        processing: {
          started_at: new Date().toISOString(),
          worker: "automation_dispatch",
        },
      },
    })
    .eq("id", cleanText(message.id))
    .eq("status", "pendente")
    .select("id")
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data?.length);
}

async function hasCompletedPreviousSteps(
  supabase: SupabaseClient,
  message: JsonObject
) {
  const required = requiredPreviousSteps(message);

  if (!required.length) {
    return true;
  }

  const orderId = cleanText(message.order_id);
  const email = cleanText(message.email);

  let query = supabase
    .from("automation_messages")
    .select("etapa,status,metadata,created_at")
    .in("etapa", required)
    .in("status", ["enviada", "entregue", "lida", "concluida"]);

  if (orderId) {
    query = query.eq("order_id", orderId);
  } else if (email) {
    query = query.eq("email", email);
  } else {
    return false;
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data || []) as JsonObject[];
  const completed = new Set(rows.map((row) => cleanText(row.etapa)));

  if (!required.every((step) => completed.has(step))) {
    return false;
  }

  const delayMinutes = delayAfterPreviousMinutes(message);

  if (!delayMinutes) {
    return true;
  }

  const latestRequiredTime = Math.max(
    ...rows
      .filter((row) => required.includes(cleanText(row.etapa)))
      .map((row) => new Date(sentAtFromMetadata(row)).getTime())
      .filter((time) => Number.isFinite(time))
  );

  if (!Number.isFinite(latestRequiredTime)) {
    return false;
  }

  return Date.now() >= latestRequiredTime + delayMinutes * 60 * 1000;
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

  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") || 5);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 20) : 5;
  const dryRun = url.searchParams.get("dry_run") === "true";
  const provider = "twilio";
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

  const sent: JsonObject[] = [];
  const skipped: JsonObject[] = [];
  const failed: JsonObject[] = [];
  const processedFlows = new Set<string>();

  for (const message of data || []) {
    const flowKey =
      cleanText(message.order_id) || cleanText(message.email) || cleanText(message.whatsapp);

    if (flowKey && processedFlows.has(flowKey)) {
      skipped.push({
        id: message.id,
        etapa: message.etapa,
        reason: "flow_already_processed_this_cycle",
      });
      continue;
    }

    try {
      const previousStepsCompleted = await hasCompletedPreviousSteps(supabase, message);

      if (!previousStepsCompleted) {
        skipped.push({
          id: message.id,
          etapa: message.etapa,
          reason: "required_previous_steps_pending",
          required_previous_steps: requiredPreviousSteps(message),
        });
        continue;
      }

      if (!dryRun && !(await claimPendingMessage(supabase, message))) {
        skipped.push({
          id: message.id,
          etapa: message.etapa,
          reason: "message_already_claimed",
        });
        continue;
      }

      if (dryRun) {
        sent.push({
          id: message.id,
          etapa: message.etapa,
          dry_run: true,
        });

        if (flowKey) {
          processedFlows.add(flowKey);
        }

        continue;
      }

      const result = await sendWhatsappMessage(message);
      const metadata = asObject(message.metadata);

      const { error: updateError } = await supabase
        .from("automation_messages")
        .update({
          status: "enviada",
          metadata: {
            ...metadata,
            whatsapp_provider: {
              provider: result.provider,
              mode: result.mode,
              message_ids: result.messageIds,
              sent_at: new Date().toISOString(),
              responses: result.responses,
            },
          },
        })
        .eq("id", message.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      sent.push({
        id: message.id,
        etapa: message.etapa,
        provider: result.provider,
        mode: result.mode,
        message_ids: result.messageIds,
      });

      if (flowKey) {
        processedFlows.add(flowKey);
      }
    } catch (sendError) {
      const errorMessage =
        sendError instanceof Error ? sendError.message : "Erro desconhecido no envio.";
      const metadata = asObject(message.metadata);

      await supabase
        .from("automation_messages")
        .update({
          status: "erro",
          metadata: {
            ...metadata,
            whatsapp_provider_error: {
              provider,
              failed_at: new Date().toISOString(),
              message: errorMessage,
            },
          },
        })
        .eq("id", message.id);

      failed.push({
        id: message.id,
        etapa: message.etapa,
        error: errorMessage,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    provider,
    dry_run: dryRun,
    total: data?.length || 0,
    sent,
    skipped,
    failed,
  });
}
