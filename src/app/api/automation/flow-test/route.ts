import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cleanText } from "@/lib/whatsapp/phone";

type JsonObject = Record<string, unknown>;
type TestStep = {
  key: string;
  label: string;
  status: "ok" | "failed";
  detail: string;
};

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

const APPROVED_FLOW_STEPS = [
  "compra-confirmada",
  "clique-compra-confirmada-estou-pronta",
  "boas-vindas-video",
  "materiais-desafio",
  "grupo-oficial-preparacao",
  "clique-grupo-assistir-boas-vindas",
  "grupo-oficial-final",
  "grupo-oficial-link",
];

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

function addStep(steps: TestStep[], key: string, label: string, detail: string) {
  steps.push({ key, label, detail, status: "ok" });
}

function fail(key: string, label: string, detail: string): never {
  const error = new Error(detail);
  error.name = `${key}:${label}`;
  throw error;
}

function originFromRequest(request: Request) {
  const url = new URL(request.url);

  return url.origin;
}

function pathWithToken(pathname: string, token: string) {
  const separator = pathname.includes("?") ? "&" : "?";

  return `${pathname}${separator}token=${encodeURIComponent(token)}`;
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

async function cleanup(supabase: AppSupabaseClient, email: string, phone: string) {
  await supabase.from("automation_messages").delete().eq("email", email);
  await supabase.from("kiwify_events").delete().eq("email", email);
  await supabase.from("leads").delete().eq("email", email);

  const { error } = await supabase.from("twilio_interactions").delete().eq("from_whatsapp", phone);
  const message = error?.message || "";

  if (error && !message.includes("twilio_interactions") && !message.includes("schema cache")) {
    throw new Error(error.message);
  }
}

async function messagesForLead(supabase: AppSupabaseClient, email: string) {
  const { data, error } = await supabase
    .from("automation_messages")
    .select("id,email,etapa,status,metadata,created_at")
    .eq("email", email)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as JsonObject[];
}

function hasMessage(messages: JsonObject[], etapa: string) {
  return messages.some((message) => cleanText(message.etapa) === etapa);
}

function messageStatus(messages: JsonObject[], etapa: string) {
  return cleanText(messages.find((message) => cleanText(message.etapa) === etapa)?.status);
}

function messageMetadata(messages: JsonObject[], etapa: string) {
  const metadata = messages.find((message) => cleanText(message.etapa) === etapa)?.metadata;

  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as JsonObject)
    : {};
}

function messageAssetUrls(messages: JsonObject[], etapa: string) {
  const metadata = messageMetadata(messages, etapa);
  const urls = metadata.asset_urls;

  return Array.isArray(urls) ? urls.map(cleanText).filter(Boolean) : [];
}

async function markSteps(
  supabase: AppSupabaseClient,
  email: string,
  steps: string[],
  status: string
) {
  const { error } = await supabase
    .from("automation_messages")
    .update({ status })
    .eq("email", email)
    .in("etapa", steps);

  if (error) {
    throw new Error(error.message);
  }
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

function dryRunHasSent(payload: JsonObject, etapa: string) {
  const sent = Array.isArray(payload.sent) ? payload.sent : [];

  return sent.some((item) => {
    const row = item && typeof item === "object" ? (item as JsonObject) : {};

    return cleanText(row.etapa) === etapa && Boolean(row.dry_run);
  });
}

function dryRunHasSkipped(payload: JsonObject, etapa: string) {
  const skipped = Array.isArray(payload.skipped) ? payload.skipped : [];

  return skipped.some((item) => {
    const row = item && typeof item === "object" ? (item as JsonObject) : {};

    return cleanText(row.etapa) === etapa;
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

  const automationToken = cleanText(
    process.env.AUTOMATION_API_SECRET || process.env.KIWIFY_WEBHOOK_SECRET
  );
  const kiwifyToken = cleanText(process.env.KIWIFY_WEBHOOK_SECRET || automationToken);
  const twilioToken = cleanText(process.env.TWILIO_WEBHOOK_SECRET || automationToken);
  const origin = originFromRequest(request);
  const testStamp = stamp();
  const email = `rv21-painel-teste-${testStamp}@teste.local`;
  const phone = `5584997${testStamp.slice(-6)}`;
  const orderId = `ORDER-RV21-PAINEL-${testStamp}`;
  const selectedObjective = "Voltar a usar roupas antigas";
  const expectedDietSlug = "dieta-roupas-antigas.pdf";
  const steps: TestStep[] = [];

  try {
    await cleanup(supabase, email, phone);
    addStep(steps, "cleanup", "Preparacao do teste", "Dados antigos da lead de teste foram limpos.");

    const { error: leadError } = await supabase.from("leads").insert({
      nome: "Aluna Teste Painel",
      email,
      whatsapp: phone,
      objetivo: selectedObjective,
      origem: "painel-operacional",
      status: "checkout-iniciado",
      etapa_funil: "checkout",
      utm: JSON.stringify({
        origem: "painel-operacional",
        utm_source: "instagram",
        utm_medium: "teste",
        utm_campaign: "trinca_rv21_teste_fluxo",
      }),
    });

    if (leadError) {
      throw new Error(leadError.message);
    }

    await fetchJson(origin, pathWithToken("/api/kiwify/webhook?dry_run=true", kiwifyToken), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhook_event_type: "order.paid",
        order_status: "paid",
        order_id: orderId,
        payment_method: "credit_card",
        Customer: {
          full_name: "Aluna Teste Painel",
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
          utm_medium: "teste",
          utm_campaign: "trinca_rv21_teste_fluxo",
        },
      }),
    });
    addStep(steps, "kiwify", "Compra aprovada", "Webhook Kiwify criou/atualizou a lead e iniciou a fila.");

    await makeMessagesDue(supabase, email);
    let messages = await messagesForLead(supabase, email);

    for (const etapa of APPROVED_FLOW_STEPS) {
      if (!hasMessage(messages, etapa)) {
        fail("queue", "Fila incompleta", `A etapa ${etapa} nao foi criada.`);
      }
    }

    if (messageStatus(messages, "clique-compra-confirmada-estou-pronta") !== "aguardando-clique") {
      fail("first_gate", "Gate inicial incorreto", "O clique Estou pronta nao iniciou aguardando clique.");
    }

    if (messageStatus(messages, "clique-grupo-assistir-boas-vindas") !== "aguardando-clique") {
      fail("second_gate", "Gate do grupo incorreto", "O clique do grupo nao iniciou aguardando clique.");
    }

    addStep(steps, "queue", "Fila completa criada", "Todas as etapas da compra aprovada foram enfileiradas.");

    const materialUrls = messageAssetUrls(messages, "materiais-desafio");

    if (!materialUrls.some((url) => url.includes(expectedDietSlug))) {
      fail(
        "objective_diet",
        "Dieta do objetivo incorreta",
        `O objetivo ${selectedObjective} deveria usar o arquivo ${expectedDietSlug}.`
      );
    }

    addStep(
      steps,
      "objective_diet",
      "Dieta por objetivo validada",
      `Objetivo selecionado: ${selectedObjective}. Dieta esperada: ${expectedDietSlug}.`
    );

    await markSteps(supabase, email, ["compra-confirmada"], "enviada");

    let dryRun = await fetchJson(
      origin,
      pathWithToken("/api/automation/dispatch?limit=20&dry_run=true", automationToken),
      { method: "POST" }
    );

    if (!dryRunHasSkipped(dryRun, "boas-vindas-video")) {
      fail(
        "first_gate_block",
        "Bloqueio do primeiro clique falhou",
        "O video pos-compra deveria ficar bloqueado antes do clique Estou pronta."
      );
    }

    addStep(
      steps,
      "first_gate_block",
      "Video pos-compra protegido",
      "Antes do clique Estou pronta, o dispatch nao libera o video."
    );

    const firstClick = await fetchJson(
      origin,
      pathWithToken("/api/twilio/webhook?dry_run=true", twilioToken),
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          WaId: phone,
          ButtonPayload: "compra_confirmada_estou_pronta",
          ButtonText: "Estou pronta",
          MessageSid: `SM_PAINEL_COMPRA_${testStamp}`,
        }),
      }
    );

    if (!firstClick.completed) {
      fail("first_click", "Clique Estou pronta nao concluiu", "A rota Twilio nao concluiu o gate inicial.");
    }

    messages = await messagesForLead(supabase, email);

    if (messageStatus(messages, "clique-compra-confirmada-estou-pronta") !== "concluida") {
      fail("first_click", "Clique Estou pronta nao gravou", "O gate inicial nao ficou como concluida.");
    }

    addStep(
      steps,
      "first_click",
      "Clique Estou pronta aprovado",
      "A resposta da Twilio liberou a proxima etapa corretamente."
    );

    dryRun = await fetchJson(
      origin,
      pathWithToken("/api/automation/dispatch?limit=20&dry_run=true", automationToken),
      { method: "POST" }
    );

    if (!dryRunHasSent(dryRun, "boas-vindas-video")) {
      fail(
        "welcome_release",
        "Video pos-compra nao liberou",
        "Depois do clique Estou pronta, o video pos-compra deveria aparecer no dry-run."
      );
    }

    addStep(
      steps,
      "welcome_release",
      "Video pos-compra liberado",
      "Depois do clique, o dispatch passou a liberar o video de boas-vindas."
    );

    await markSteps(
      supabase,
      email,
      [
        "boas-vindas-video",
        "materiais-desafio",
        "grupo-oficial-preparacao",
      ],
      "enviada"
    );

    dryRun = await fetchJson(
      origin,
      pathWithToken("/api/automation/dispatch?limit=20&dry_run=true", automationToken),
      { method: "POST" }
    );

    if (!dryRunHasSkipped(dryRun, "grupo-oficial-final")) {
      fail(
        "second_gate_block",
        "Bloqueio do grupo falhou",
        "O video do grupo deveria ficar bloqueado antes do clique Assistir boas-vindas."
      );
    }

    addStep(
      steps,
      "second_gate_block",
      "Video do grupo protegido",
      "Antes do segundo clique, o dispatch nao libera o video final do grupo."
    );

    const secondClick = await fetchJson(
      origin,
      pathWithToken("/api/twilio/webhook?dry_run=true", twilioToken),
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          WaId: phone,
          ButtonPayload: "assistir_boas_vindas_grupo",
          ButtonText: "Assistir boas-vindas",
          MessageSid: `SM_PAINEL_GRUPO_${testStamp}`,
        }),
      }
    );

    if (!secondClick.completed) {
      fail("second_click", "Clique do grupo nao concluiu", "A rota Twilio nao concluiu o gate do grupo.");
    }

    messages = await messagesForLead(supabase, email);

    if (messageStatus(messages, "clique-grupo-assistir-boas-vindas") !== "concluida") {
      fail("second_click", "Clique do grupo nao gravou", "O gate do grupo nao ficou como concluida.");
    }

    addStep(
      steps,
      "second_click",
      "Clique do grupo aprovado",
      "A resposta da Twilio liberou a etapa final do grupo."
    );

    dryRun = await fetchJson(
      origin,
      pathWithToken("/api/automation/dispatch?limit=20&dry_run=true", automationToken),
      { method: "POST" }
    );

    if (!dryRunHasSent(dryRun, "grupo-oficial-final")) {
      fail(
        "group_video_release",
        "Video do grupo nao liberou",
        "Depois do clique do grupo, o video final deveria aparecer no dry-run."
      );
    }

    addStep(
      steps,
      "group_video_release",
      "Video final liberado",
      "Depois do segundo clique, o dispatch passou a liberar o video do grupo."
    );

    await markSteps(supabase, email, ["grupo-oficial-final"], "enviada");

    dryRun = await fetchJson(
      origin,
      pathWithToken("/api/automation/dispatch?limit=20&dry_run=true", automationToken),
      { method: "POST" }
    );

    if (!dryRunHasSent(dryRun, "grupo-oficial-link")) {
      fail(
        "group_link_release",
        "Link do grupo nao liberou",
        "Depois do video final, o link do grupo deveria aparecer no dry-run."
      );
    }

    addStep(
      steps,
      "group_link_release",
      "Link do grupo liberado no momento certo",
      "O link final so apareceu depois do video do grupo ser considerado enviado."
    );

    messages = await messagesForLead(supabase, email);

    return NextResponse.json({
      ok: true,
      checked_at: new Date().toISOString(),
      lead: { email, phone, order_id: orderId },
      cleaned: true,
      steps,
      final_messages: messages.map((message) => ({
        etapa: cleanText(message.etapa),
        status: cleanText(message.status),
      })),
    });
  } catch (error) {
    const failedStep = error instanceof Error ? error.name.split(":") : [];

    return NextResponse.json(
      {
        ok: false,
        checked_at: new Date().toISOString(),
        lead: { email, phone, order_id: orderId },
        steps: [
          ...steps,
          {
            key: failedStep[0] || "flow_test_error",
            label: failedStep[1] || "Teste interrompido",
            status: "failed",
            detail: error instanceof Error ? error.message : "Erro desconhecido.",
          },
        ],
      },
      { status: 500 }
    );
  } finally {
    try {
      await cleanup(supabase, email, phone);
    } catch {
      // A falha de limpeza nao deve esconder o resultado principal do teste.
    }
  }
}
