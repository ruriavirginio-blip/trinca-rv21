import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cleanText } from "@/lib/whatsapp/phone";

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

type SimulationStep = {
  etapa: string;
  label: string;
  at: string;
  elapsed_seconds: number;
  detail: string;
};

const SIMULATION_EMAIL_PREFIX = "rv21-simulacao-painel";
const DEFAULT_OBJECTIVE = "Voltar a usar roupas antigas";

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
    auth: { persistSession: false },
  });
}

function stamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function originFromRequest(request: Request) {
  return new URL(request.url).origin;
}

function pathWithToken(pathname: string, token: string) {
  const separator = pathname.includes("?") ? "&" : "?";

  return `${pathname}${separator}token=${encodeURIComponent(token)}`;
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function wait(seconds: number) {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function fetchJson(origin: string, pathname: string, init?: RequestInit) {
  const response = await fetch(`${origin}${pathname}`, init);
  const text = await response.text();
  let payload: JsonObject = {};

  try {
    payload = text ? (JSON.parse(text) as JsonObject) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${pathname} retornou HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

async function cleanupOldSimulations(supabase: AppSupabaseClient) {
  const emailPattern = `${SIMULATION_EMAIL_PREFIX}-%`;

  await supabase.from("automation_messages").delete().like("email", emailPattern);
  await supabase.from("kiwify_events").delete().like("email", emailPattern);
  await supabase.from("leads").delete().like("email", emailPattern);
  await supabase.from("twilio_interactions").delete().like("message_sid", "SM_SIM_%");
}

async function makeMessagesDue(supabase: AppSupabaseClient, email: string) {
  const { error } = await supabase
    .from("automation_messages")
    .update({ enviar_em: new Date(Date.now() - 60 * 1000).toISOString() })
    .eq("email", email);

  if (error) {
    throw new Error(error.message);
  }
}

async function messageByStep(supabase: AppSupabaseClient, email: string, etapa: string) {
  const { data, error } = await supabase
    .from("automation_messages")
    .select("id,metadata")
    .eq("email", email)
    .eq("etapa", etapa)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data || null) as JsonObject | null;
}

async function markMessage(
  supabase: AppSupabaseClient,
  email: string,
  etapa: string,
  status: string,
  detail: string
) {
  const message = await messageByStep(supabase, email, etapa);

  if (!message) {
    throw new Error(`Mensagem ${etapa} nao encontrada para a lead de simulacao.`);
  }

  const metadata = asObject(message.metadata);
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("automation_messages")
    .update({
      status,
      metadata: {
        ...metadata,
        simulation: {
          active: true,
          detail,
          updated_at: now,
        },
        whatsapp_provider:
          status === "enviada"
            ? {
                provider: "panel-simulation",
                mode: "dry_run",
                message_ids: [`SIM_${etapa}_${Date.now()}`],
                sent_at: now,
                responses: [],
              }
            : metadata.whatsapp_provider,
      },
    })
    .eq("id", cleanText(message.id));

  if (error) {
    throw new Error(error.message);
  }
}

function addStep(
  steps: SimulationStep[],
  startedAt: number,
  etapa: string,
  label: string,
  detail: string
) {
  steps.push({
    etapa,
    label,
    detail,
    at: new Date().toISOString(),
    elapsed_seconds: Math.round((Date.now() - startedAt) / 1000),
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

  const url = new URL(request.url);
  const rawDelay = Number(url.searchParams.get("delay_seconds") || 5);
  const delaySeconds = Number.isFinite(rawDelay) ? Math.min(Math.max(rawDelay, 3), 5) : 5;
  const selectedObjective = cleanText(url.searchParams.get("objective")) || DEFAULT_OBJECTIVE;
  const automationToken = cleanText(
    process.env.AUTOMATION_API_SECRET || process.env.KIWIFY_WEBHOOK_SECRET
  );
  const kiwifyToken = cleanText(process.env.KIWIFY_WEBHOOK_SECRET || automationToken);
  const twilioToken = cleanText(process.env.TWILIO_WEBHOOK_SECRET || automationToken);
  const origin = originFromRequest(request);
  const testStamp = stamp();
  const email = `${SIMULATION_EMAIL_PREFIX}-${testStamp}@teste.local`;
  const phone = `5584998${testStamp.slice(-6)}`;
  const orderId = `ORDER-RV21-SIM-${testStamp}`;
  const startedAt = Date.now();
  const steps: SimulationStep[] = [];

  try {
    await cleanupOldSimulations(supabase);
    addStep(steps, startedAt, "preparacao", "Base de simulacao limpa", "Removi simulacoes antigas do painel.");

    const { error: leadError } = await supabase.from("leads").insert({
      nome: "Lead Simulacao Painel",
      email,
      whatsapp: phone,
      objetivo: selectedObjective,
      origem: "painel-operacional",
      status: "checkout-iniciado",
      etapa_funil: "checkout",
      utm: JSON.stringify({
        origem: "painel-operacional",
        tracking: {
          landing_url: "/?utm_source=instagram&utm_medium=story&utm_campaign=trinca_rv21_simulacao",
          referrer: "instagram",
          utm: {
            utm_source: "instagram",
            utm_medium: "story",
            utm_campaign: "trinca_rv21_simulacao",
          },
        },
      }),
      capturado_em: new Date().toISOString(),
    });

    if (leadError) {
      throw new Error(leadError.message);
    }

    addStep(steps, startedAt, "lead-capturado", "Lead entrou pela landing", "A lead apareceu no painel como vinda do Instagram Story.");
    await wait(delaySeconds);

    await fetchJson(origin, pathWithToken("/api/kiwify/webhook?dry_run=true", kiwifyToken), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhook_event_type: "order.paid",
        order_status: "paid",
        order_id: orderId,
        payment_method: "credit_card",
        Customer: {
          full_name: "Lead Simulacao Painel",
          email,
          mobile: phone,
        },
        Product: {
          product_name: "TRINCA RV21",
        },
        Commissions: {
          charge_amount: 3789,
        },
        TrackingParameters: {
          source: "painel-operacional",
          utm_source: "instagram",
          utm_medium: "story",
          utm_campaign: "trinca_rv21_simulacao",
        },
      }),
    });

    await makeMessagesDue(supabase, email);
    addStep(steps, startedAt, "evento-kiwify", "Pagamento confirmado pela Kiwify", "A fila oficial da compra aprovada foi criada.");
    await wait(delaySeconds);

    await markMessage(
      supabase,
      email,
      "compra-confirmada",
      "enviada",
      "Mensagem com botao Estou pronta simulada como enviada."
    );
    addStep(steps, startedAt, "compra-confirmada", "Mensagem 01 enviada", "Confirmacao pos-compra com botao Estou pronta.");
    await wait(delaySeconds);

    await fetchJson(origin, pathWithToken("/api/twilio/webhook?dry_run=true", twilioToken), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        WaId: phone,
        ButtonPayload: "compra_confirmada_estou_pronta",
        ButtonText: "Estou pronta",
        MessageSid: `SM_SIM_ESTOU_PRONTA_${testStamp}`,
      }),
    });
    addStep(steps, startedAt, "clique-compra-confirmada-estou-pronta", "Lead clicou Estou pronta", "O painel registrou o primeiro clique.");
    await wait(delaySeconds);

    await markMessage(
      supabase,
      email,
      "boas-vindas-video",
      "enviada",
      "Video pos-compra liberado apenas depois do clique Estou pronta."
    );
    addStep(steps, startedAt, "boas-vindas-video", "Video pos-compra enviado", "O video nao foi liberado antes do clique.");
    await wait(delaySeconds);

    await markMessage(
      supabase,
      email,
      "materiais-desafio",
      "enviada",
      "Dieta por objetivo, Ebook RV e Ebook Nutricional simulados como enviados."
    );
    addStep(steps, startedAt, "materiais-desafio", "Materiais enviados", `Objetivo usado: ${selectedObjective}.`);
    await wait(delaySeconds);

    await markMessage(
      supabase,
      email,
      "grupo-oficial-preparacao",
      "enviada",
      "Mensagem com botao Assistir boas-vindas simulada como enviada."
    );
    addStep(steps, startedAt, "grupo-oficial-preparacao", "Mensagem do grupo enviada", "Botao Assistir boas-vindas liberado.");
    await wait(delaySeconds);

    await fetchJson(origin, pathWithToken("/api/twilio/webhook?dry_run=true", twilioToken), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        WaId: phone,
        ButtonPayload: "assistir_boas_vindas_grupo",
        ButtonText: "Assistir boas-vindas",
        MessageSid: `SM_SIM_GRUPO_${testStamp}`,
      }),
    });
    addStep(steps, startedAt, "clique-grupo-assistir-boas-vindas", "Lead clicou Assistir boas-vindas", "O painel registrou o segundo clique.");
    await wait(delaySeconds);

    await markMessage(
      supabase,
      email,
      "grupo-oficial-final",
      "enviada",
      "Video oficial do grupo liberado apenas depois do segundo clique."
    );
    addStep(steps, startedAt, "grupo-oficial-final", "Video do grupo enviado", "O video final nao foi liberado antes do clique do grupo.");
    await wait(delaySeconds);

    await markMessage(
      supabase,
      email,
      "grupo-oficial-link",
      "enviada",
      "Link final liberado apenas depois do video do grupo."
    );
    addStep(steps, startedAt, "grupo-oficial-link", "Link do grupo enviado", "Fluxo completo no painel.");

    return NextResponse.json({
      ok: true,
      mode: "panel_simulation",
      dry_run: true,
      checked_at: new Date().toISOString(),
      delay_seconds: delaySeconds,
      lead: { nome: "Lead Simulacao Painel", email, phone, order_id: orderId, objetivo: selectedObjective },
      steps,
      note: "Simulacao acompanhavel: nenhuma mensagem real foi enviada pelo Twilio.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        mode: "panel_simulation",
        checked_at: new Date().toISOString(),
        lead: { email, phone, order_id: orderId, objetivo: selectedObjective },
        steps,
        error: error instanceof Error ? error.message : "Erro desconhecido.",
      },
      { status: 500 }
    );
  }
}
