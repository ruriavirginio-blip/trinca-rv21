import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildAutomationReadiness } from "@/lib/automation/readiness";

type JsonObject = Record<string, unknown>;
type SupabaseTable = {
  Row: JsonObject;
  Insert: JsonObject;
  Update: JsonObject;
  Relationships: [];
};

type Database = {
  public: {
    Tables: {
      automation_messages: SupabaseTable;
      kiwify_events: SupabaseTable;
      leads: SupabaseTable;
      twilio_interactions: SupabaseTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

type AppSupabaseClient = SupabaseClient<Database>;

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

  if (!readAutomationToken(request).includes(secret)) {
    return NextResponse.json({ error: "Token invalido." }, { status: 401 });
  }

  return null;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

async function countAutomation(
  supabase: AppSupabaseClient,
  status: string,
  options: { dueOnly?: boolean; etapa?: string; triggerEvent?: string } = {}
) {
  let query = supabase
    .from("automation_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", status);

  if (options.dueOnly) {
    query = query.lte("enviar_em", new Date().toISOString());
  }

  if (options.etapa) {
    query = query.eq("etapa", options.etapa);
  }

  if (options.triggerEvent) {
    query = query.eq("trigger_event", options.triggerEvent);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
}

async function countTable(
  supabase: AppSupabaseClient,
  table: "leads" | "kiwify_events" | "twilio_interactions",
  sinceIso?: string
) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });

  if (sinceIso) {
    const dateColumn =
      table === "leads"
        ? "created_at"
        : table === "kiwify_events"
          ? "recebido_em"
          : "received_at";

    query = query.gte(dateColumn, sinceIso);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count || 0;
}

async function optionalCountTable(
  supabase: AppSupabaseClient,
  table: "twilio_interactions",
  sinceIso?: string
) {
  try {
    return {
      available: true,
      count: await countTable(supabase, table, sinceIso),
      error: "",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido.";
    const unavailable =
      message.includes("twilio_interactions") || message.includes("schema cache");

    if (!unavailable) {
      throw error;
    }

    return {
      available: false,
      count: 0,
      error: "Tabela twilio_interactions ainda nao criada no Supabase.",
    };
  }
}

async function recentAutomationErrors(supabase: AppSupabaseClient) {
  const { data, error } = await supabase
    .from("automation_messages")
    .select("id,email,whatsapp,etapa,status,metadata,created_at")
    .eq("status", "erro")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

async function pendingClickGates(supabase: AppSupabaseClient) {
  const { data, error } = await supabase
    .from("automation_messages")
    .select("id,email,whatsapp,nome,etapa,enviar_em,created_at,metadata")
    .eq("status", "aguardando-clique")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
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

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const [
      leads24h,
      kiwifyEvents24h,
      twilioInteractions24h,
      duePending,
      pending,
      processing,
      sent,
      errors,
      waitingClicks,
      leadRecoveryQueued,
      errorSamples,
      clickGateSamples,
    ] = await Promise.all([
      countTable(supabase, "leads", since24h),
      countTable(supabase, "kiwify_events", since24h),
      optionalCountTable(supabase, "twilio_interactions", since24h),
      countAutomation(supabase, "pendente", { dueOnly: true }),
      countAutomation(supabase, "pendente"),
      countAutomation(supabase, "processando"),
      countAutomation(supabase, "enviada"),
      countAutomation(supabase, "erro"),
      countAutomation(supabase, "aguardando-clique"),
      countAutomation(supabase, "pendente", { triggerEvent: "lead_sem_evento_kiwify" }),
      recentAutomationErrors(supabase),
      pendingClickGates(supabase),
    ]);

    const warnings = [
      duePending > 0 ? `${duePending} mensagens pendentes ja vencidas.` : "",
      processing > 0 ? `${processing} mensagens em processamento.` : "",
      errors > 0 ? `${errors} mensagens com erro na automacao.` : "",
      waitingClicks > 0 ? `${waitingClicks} gates aguardando clique.` : "",
      !twilioInteractions24h.available ? twilioInteractions24h.error : "",
    ].filter(Boolean);

    const readiness = buildAutomationReadiness();

    return NextResponse.json({
      ok: true,
      checked_at: new Date().toISOString(),
      window: "24h",
      launch_readiness: {
        launch_ready: readiness.launch_ready,
        blockers_count: readiness.blockers.length,
        warnings_count: readiness.warnings.length,
        blockers: readiness.blockers,
      },
      counts: {
        leads_24h: leads24h,
        kiwify_events_24h: kiwifyEvents24h,
        twilio_interactions_24h: twilioInteractions24h.count,
        automation_due_pending: duePending,
        automation_pending_total: pending,
        automation_processing_total: processing,
        automation_sent_total: sent,
        automation_error_total: errors,
        automation_waiting_clicks: waitingClicks,
        lead_recovery_pending: leadRecoveryQueued,
      },
      warnings,
      database: {
        twilio_interactions_available: twilioInteractions24h.available,
        twilio_interactions_message: twilioInteractions24h.error || "Tabela disponivel.",
      },
      samples: {
        errors: errorSamples,
        waiting_clicks: clickGateSamples,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
