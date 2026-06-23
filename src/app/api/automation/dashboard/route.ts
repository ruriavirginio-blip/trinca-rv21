import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildAutomationReadiness } from "@/lib/automation/readiness";
import {
  brazilianWhatsappVariants,
  cleanText,
  normalizeBrazilianWhatsapp,
} from "@/lib/whatsapp/phone";

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

const FLOW_STEPS = [
  { key: "lead-capturado", label: "Preencheu a landing" },
  { key: "checkout-iniciado", label: "Foi para o checkout" },
  { key: "evento-kiwify", label: "Kiwify respondeu" },
  { key: "compra-confirmada", label: "Compra confirmada" },
  { key: "clique-compra-confirmada-estou-pronta", label: "Clicou em Estou pronta" },
  { key: "boas-vindas-video", label: "Boas-vindas enviado" },
  { key: "materiais-desafio", label: "Materiais e dieta enviados" },
  { key: "grupo-oficial-preparacao", label: "Mensagem do grupo enviada" },
  { key: "clique-grupo-assistir-boas-vindas", label: "Clicou no vídeo do grupo" },
  { key: "grupo-oficial-final", label: "Vídeo final enviado" },
  { key: "grupo-oficial-link", label: "Link do grupo enviado" },
];

const STEP_LABELS = Object.fromEntries(FLOW_STEPS.map((step) => [step.key, step.label]));

const MESSAGE_LABELS: Record<string, string> = {
  "lead-formulario-abandonado-5min": "Recuperação 5 min",
  "lead-formulario-abandonado-2h": "Recuperação 2 h",
  "lead-formulario-abandonado-24h": "Recuperação 24 h",
  "pagamento-recusado-5min": "Pagamento recusado 5 min",
  "pagamento-recusado-2h": "Pagamento recusado 2 h",
  "carrinho-abandonado-15min": "Carrinho abandonado 15 min",
  "carrinho-abandonado-6h": "Carrinho abandonado 6 h",
  "carrinho-abandonado-24h": "Carrinho abandonado 24 h",
  "pagamento-pendente-20min": "Pagamento pendente 20 min",
  "pagamento-pendente-2h": "Pagamento pendente 2 h",
  "pagamento-pendente-24h": "Pagamento pendente 24 h",
};

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

function authorize(request: Request) {
  // Aceita o secret geral OU o MONITOR_TOKEN dedicado (mesmo token usado no monitor/dispatch),
  // pra o Cockpit usar UM único código em Jornada, Alertas e Saúde.
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

  const provided = readAutomationToken(request);
  if (!provided.some((token) => secrets.includes(token))) {
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

function safeJsonParse(value: string): unknown {
  if (!value) {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function trackingFromLead(lead: JsonObject) {
  const rawUtm = cleanText(lead.utm);
  const parsed = asObject(safeJsonParse(rawUtm));
  const rawTracking = parsed.tracking;
  const tracking =
    typeof rawTracking === "string"
      ? asObject(safeJsonParse(rawTracking))
      : asObject(rawTracking);
  const rawLandingTracking = parsed.landing_tracking;
  const landingParsed =
    typeof rawLandingTracking === "string"
      ? asObject(safeJsonParse(rawLandingTracking))
      : asObject(rawLandingTracking);
  const landingTracking = asObject(landingParsed.tracking);
  const landingUtm = asObject(landingTracking.utm);
  const directUtm: JsonObject = {
    utm_source: tracking.utm_source || tracking.source || parsed.utm_source || parsed.source,
    utm_medium: tracking.utm_medium || tracking.medium || parsed.utm_medium || parsed.medium,
    utm_campaign:
      tracking.utm_campaign || tracking.campaign || parsed.utm_campaign || parsed.campaign,
  };
  const utm = { ...landingUtm, ...asObject(tracking.utm), ...directUtm };

  return {
    captured_at: cleanText(parsed.captured_at || landingParsed.captured_at),
    checkout_url: cleanText(parsed.checkout_url || landingParsed.checkout_url),
    landing_url: cleanText(tracking.landing_url || landingTracking.landing_url),
    referrer: cleanText(tracking.referrer || landingTracking.referrer),
    query: cleanText(tracking.query || landingTracking.query),
    utm,
  };
}

function trafficSource(lead: JsonObject) {
  // Leads da lista VIP do pré-lançamento têm rótulo próprio, claro pro Ruriá.
  const origemLead = cleanText(lead.origem).toLowerCase();
  const statusLead = cleanText(lead.status).toLowerCase();
  if (statusLead === "lista-vip" || origemLead.includes("lista-vip") || origemLead.includes("vip")) {
    return { key: "lista_vip", label: "Lista VIP", campaign: "" };
  }

  const tracking = trackingFromLead(lead);
  const utm = tracking.utm;
  const source = cleanText(utm.utm_source || utm.source || utm.src || utm.ref);
  const medium = cleanText(utm.utm_medium);
  const campaign = cleanText(utm.utm_campaign);
  const referrer = tracking.referrer.toLowerCase();
  const normalizedSource = source.toLowerCase();
  const normalizedMedium = medium.toLowerCase();

  if (normalizedSource.includes("instagram") || referrer.includes("instagram")) {
    if (normalizedMedium.includes("story")) {
      return { key: "instagram_story", label: "Instagram Story", campaign };
    }

    if (normalizedMedium.includes("direct") || normalizedMedium.includes("dm")) {
      return { key: "instagram_direct", label: "Instagram Direct", campaign };
    }

    if (normalizedMedium.includes("feed")) {
      return { key: "instagram_feed", label: "Instagram Feed", campaign };
    }

    return { key: "instagram", label: "Instagram", campaign };
  }

  if (source) {
    return {
      key: `${source || "origem"}_${medium || "sem_meio"}`.toLowerCase(),
      label: [source, medium].filter(Boolean).join(" / "),
      campaign,
    };
  }

  return { key: "sem_rastreio", label: "Sem rastreio", campaign };
}

function latestByEmail(rows: JsonObject[], dateKey: string) {
  rows.sort((a, b) => {
    const aTime = new Date(cleanText(a[dateKey]) || 0).getTime();
    const bTime = new Date(cleanText(b[dateKey]) || 0).getTime();

    return bTime - aTime;
  });

  const map = new Map<string, JsonObject>();

  for (const row of rows) {
    const email = cleanText(row.email).toLowerCase();

    if (!email || map.has(email)) {
      continue;
    }

    map.set(email, row);
  }

  return map;
}

function groupByEmail(rows: JsonObject[]) {
  const map = new Map<string, JsonObject[]>();

  for (const row of rows) {
    const email = cleanText(row.email).toLowerCase();

    if (!email) {
      continue;
    }

    map.set(email, [...(map.get(email) || []), row]);
  }

  return map;
}

function messageStatus(messages: JsonObject[], etapa: string) {
  return cleanText(messages.find((message) => cleanText(message.etapa) === etapa)?.status);
}

function completedStepCount(lead: JsonObject, event: JsonObject | undefined, messages: JsonObject[]) {
  let completed = 0;

  if (cleanText(lead.email)) completed += 1;
  if (cleanText(lead.status) === "checkout-iniciado" || event) completed += 1;
  if (event) completed += 1;

  for (const step of FLOW_STEPS.slice(3)) {
    const status = messageStatus(messages, step.key);

    if (["enviada", "entregue", "lida", "concluida"].includes(status)) {
      completed += 1;
    }
  }

  return completed;
}

function currentStage(lead: JsonObject, event: JsonObject | undefined, messages: JsonObject[]) {
  const errors = messages.filter((message) => cleanText(message.status) === "erro");
  const waitingGate = messages.find((message) => cleanText(message.status) === "aguardando-clique");
  const pending = messages.find((message) => cleanText(message.status) === "pendente");
  const groupLinkStatus = messageStatus(messages, "grupo-oficial-link");
  const recovery = messages.some(
    (message) => cleanText(message.trigger_event) === "lead_sem_evento_kiwify"
  );

  if (groupLinkStatus === "enviada") {
    return { key: "grupo-liberado", label: "Grupo liberado" };
  }

  if (errors.length) {
    return { key: "erro", label: `Erro em ${cleanText(errors[0].etapa)}` };
  }

  if (waitingGate) {
    return { key: "aguardando-clique", label: `Aguardando clique: ${cleanText(waitingGate.etapa)}` };
  }

  if (pending) {
    return { key: "proxima-mensagem", label: `Próxima mensagem: ${cleanText(pending.etapa)}` };
  }

  if (event) {
    return { key: "evento-kiwify", label: cleanText(event.status) || "Evento Kiwify recebido" };
  }

  if (recovery) {
    return { key: "recuperacao", label: "Recuperação pré-Kiwify" };
  }

  return { key: "checkout", label: cleanText(lead.etapa_funil) || "Checkout iniciado" };
}

function paymentState(event: JsonObject | undefined) {
  if (!event) {
    return {
      key: "sem-evento-kiwify",
      label: "Pagamento ainda não confirmado",
      confirmed: false,
    };
  }

  const status = cleanText(event.status);
  const orderStatus = cleanText(event.order_status);
  const normalized = `${status} ${orderStatus}`.toLowerCase();

  if (
    normalized.includes("aprov") ||
    normalized.includes("paid") ||
    normalized.includes("pago") ||
    status === "compra-aprovada"
  ) {
    return {
      key: "confirmado",
      label: "Pagamento confirmado",
      confirmed: true,
    };
  }

  if (normalized.includes("recus") || normalized.includes("refused") || normalized.includes("cancel")) {
    return {
      key: "recusado",
      label: "Pagamento recusado",
      confirmed: false,
    };
  }

  if (normalized.includes("pendente") || normalized.includes("pending") || normalized.includes("waiting")) {
    return {
      key: "pendente",
      label: "Pagamento pendente",
      confirmed: false,
    };
  }

  return {
    key: status || "evento-kiwify",
    label: status || "Evento Kiwify recebido",
    confirmed: false,
  };
}

function sentAtFromMetadata(message: JsonObject) {
  const metadata = asObject(message.metadata);
  const provider = asObject(metadata.whatsapp_provider);

  return cleanText(provider.sent_at);
}

function messageIdsFromMetadata(message: JsonObject) {
  const metadata = asObject(message.metadata);
  const provider = asObject(metadata.whatsapp_provider);
  const ids = provider.message_ids;

  return Array.isArray(ids) ? ids.map(cleanText).filter(Boolean) : [];
}

function templateFromMetadata(message: JsonObject) {
  const metadata = asObject(message.metadata);
  const whatsappApi = asObject(metadata.whatsapp_api);

  return cleanText(whatsappApi.template_name);
}

function latestInteractionFromMessages(messages: JsonObject[]) {
  const completedGates = messages
    .map((message) => {
      const metadata = asObject(message.metadata);
      const completedAt = cleanText(metadata.completed_at);

      return {
        button_payload: cleanText(metadata.received_button_payload),
        button_text: cleanText(metadata.button_text || metadata.expected_button_payload),
        message_sid: cleanText(metadata.twilio_message_sid),
        received_at: completedAt,
      };
    })
    .filter((interaction) => interaction.received_at)
    .sort((a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime());

  return completedGates[0];
}

function humanMessageStatus(status: string) {
  if (status === "enviada") return "Enviada pelo Twilio";
  if (status === "concluida") return "Confirmada pela lead";
  if (status === "aguardando-clique") return "Aguardando clique da lead";
  if (status === "processando") return "Em processamento";
  if (status === "pendente") return "Aguardando disparo";
  if (status === "erro") return "Erro no envio";
  if (status === "cancelada") return "Cancelada";
  if (status === "nao-iniciado") return "Ainda não iniciou";

  return status || "Sem status";
}

function stepTimeline(lead: JsonObject, event: JsonObject | undefined, messages: JsonObject[]) {
  const leadStatus = cleanText(lead.status);

  return FLOW_STEPS.map((step) => {
    const status =
      step.key === "lead-capturado"
        ? cleanText(lead.email)
          ? "concluida"
          : ""
        : step.key === "checkout-iniciado"
          ? leadStatus === "checkout-iniciado" || event
            ? "concluida"
            : ""
          : step.key === "evento-kiwify"
            ? event
              ? "concluida"
              : ""
            : messageStatus(messages, step.key);

    return {
      key: step.key,
      label: step.label,
      status: status || "nao-iniciado",
      status_label:
        step.key === "lead-capturado" && status
          ? "Lead registrada"
          : step.key === "checkout-iniciado" && status
            ? "Checkout iniciado"
            : step.key === "evento-kiwify" && event
          ? "Evento recebido"
          : humanMessageStatus(status || "nao-iniciado"),
      completed: ["enviada", "entregue", "lida", "concluida"].includes(status),
      waiting: ["pendente", "aguardando-clique", "processando"].includes(status),
      failed: status === "erro",
    };
  });
}

function latestActivity(lead: JsonObject, event: JsonObject | undefined, messages: JsonObject[]) {
  const dates = [
    cleanText(lead.capturado_em || lead.created_at),
    event ? cleanText(event.recebido_em) : "",
    ...messages.map((message) => sentAtFromMetadata(message) || cleanText(message.created_at)),
  ].filter(Boolean);

  return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || "";
}

function dropoffState(lead: JsonObject, event: JsonObject | undefined, messages: JsonObject[]) {
  const stage = currentStage(lead, event, messages);
  const latest = latestActivity(lead, event, messages);
  const minutesSinceActivity = latest
    ? Math.round((Date.now() - new Date(latest).getTime()) / 60000)
    : null;
  const hasRecovery = messages.some(
    (message) => cleanText(message.trigger_event) === "lead_sem_evento_kiwify"
  );

  if (messageStatus(messages, "grupo-oficial-link") === "enviada") {
    return {
      key: "concluiu-fluxo",
      label: "Concluiu o fluxo",
      needs_attention: false,
    };
  }

  if (messages.some((message) => cleanText(message.status) === "erro")) {
    return {
      key: "erro-operacional",
      label: "Precisa de atenção: houve erro de envio",
      needs_attention: true,
    };
  }

  if (!event && hasRecovery) {
    return {
      key: "desistiu-checkout",
      label: "Provável desistência antes do pagamento",
      needs_attention: true,
    };
  }

  if (!event && minutesSinceActivity !== null && minutesSinceActivity >= 30) {
    return {
      key: "sem-pagamento",
      label: "Ainda não confirmou pagamento",
      needs_attention: true,
    };
  }

  if (stage.key === "aguardando-clique" && minutesSinceActivity !== null && minutesSinceActivity >= 60) {
    return {
      key: "travou-no-clique",
      label: "Travou aguardando clique",
      needs_attention: true,
    };
  }

  return {
    key: "andamento-normal",
    label: "Fluxo em andamento",
    needs_attention: false,
  };
}

async function fetchDashboardData(supabase: AppSupabaseClient, limit: number) {
  const { data: leadsData, error: leadsError } = await supabase
    .from("leads")
    .select("id,nome,email,whatsapp,objetivo,origem,status,etapa_funil,utm,capturado_em,created_at")
    .order("capturado_em", { ascending: false })
    .limit(limit);

  if (leadsError) {
    throw new Error(leadsError.message);
  }

  // AQUECIMENTO (pré-lançamento): leads de Lista VIP NÃO entram no funil operacional
  // de compra (eles têm a aba própria "Lista VIP"). Sem isso, o dashboard os trata
  // como compradores e o Alertas acusa falso "Ainda não confirmou pagamento".
  // O funil operacional (Jornada/Alertas) mostra apenas quem entrou no fluxo de venda.
  const leads = ((leadsData || []) as JsonObject[]).filter((lead) => {
    const statusLead = cleanText(lead.status).toLowerCase();
    if (statusLead === "lista-vip") return false;
    if (cleanText((lead as { is_test?: unknown }).is_test) === "true" || (lead as { is_test?: unknown }).is_test === true) {
      return false;
    }
    return true;
  });
  const emails = leads.map((lead) => cleanText(lead.email).toLowerCase()).filter(Boolean);
  const phones = Array.from(
    new Set(
      leads.flatMap((lead) => brazilianWhatsappVariants(lead.whatsapp)).filter(Boolean)
    )
  );

  const [eventsResult, messagesResult, interactionsResult] = await Promise.all([
    emails.length
      ? supabase
          .from("kiwify_events")
          .select("email,nome,whatsapp,evento,status,etapa_funil,order_id,order_status,payment_method,product_name,recebido_em")
          .in("email", emails)
          .order("recebido_em", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    emails.length
      ? supabase
          .from("automation_messages")
          .select("email,whatsapp,etapa,status,mensagem,enviar_em,trigger_event,metadata,created_at")
          .in("email", emails)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
    phones.length
      ? supabase
          .from("twilio_interactions")
          .select("from_whatsapp,button_payload,button_text,message_sid,received_at")
          .in("from_whatsapp", phones)
          .order("received_at", { ascending: false })
          .limit(limit * 5)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (eventsResult.error) throw new Error(eventsResult.error.message);
  if (messagesResult.error) throw new Error(messagesResult.error.message);

  const interactionsErrorMessage = interactionsResult.error?.message || "";
  const interactionsUnavailable =
    interactionsErrorMessage.includes("twilio_interactions") ||
    interactionsErrorMessage.includes("schema cache");

  if (interactionsResult.error && !interactionsUnavailable) {
    throw new Error(interactionsResult.error.message);
  }

  return {
    leads,
    events: ((eventsResult.data || []) as JsonObject[]).sort((a, b) => {
      const aTime = new Date(cleanText(a.recebido_em) || 0).getTime();
      const bTime = new Date(cleanText(b.recebido_em) || 0).getTime();

      return bTime - aTime;
    }),
    messages: (messagesResult.data || []) as JsonObject[],
    interactions: interactionsUnavailable ? [] : ((interactionsResult.data || []) as JsonObject[]),
  };
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
  const rawLimit = Number(url.searchParams.get("limit") || 80);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 80;
  const since24h = Date.now() - 24 * 60 * 60 * 1000;

  try {
    const { leads, events, messages, interactions } = await fetchDashboardData(supabase, limit);
    const eventsByEmail = latestByEmail(events, "recebido_em");
    const messagesByEmail = groupByEmail(messages);
    const interactionsByPhone = new Map<string, JsonObject[]>();

    for (const interaction of interactions) {
      const phone = normalizeBrazilianWhatsapp(interaction.from_whatsapp);

      interactionsByPhone.set(phone, [...(interactionsByPhone.get(phone) || []), interaction]);
    }

    const leadRows = leads.map((lead) => {
      const email = cleanText(lead.email).toLowerCase();
      const phone = normalizeBrazilianWhatsapp(lead.whatsapp);
      const event = eventsByEmail.get(email);
      const leadMessages = messagesByEmail.get(email) || [];
      const source = trafficSource(lead);
      const completed = completedStepCount(lead, event, leadMessages);
      const stage = currentStage(lead, event, leadMessages);
      const latestInteraction =
        brazilianWhatsappVariants(phone)
          .flatMap((phoneVariant) => interactionsByPhone.get(phoneVariant) || [])
          .sort((a, b) => {
            const aTime = new Date(cleanText(a.received_at) || 0).getTime();
            const bTime = new Date(cleanText(b.received_at) || 0).getTime();

            return bTime - aTime;
          })[0] || latestInteractionFromMessages(leadMessages);
      const payment = paymentState(event);
      const timeline = stepTimeline(lead, event, leadMessages);
      const latest = latestActivity(lead, event, leadMessages);
      const dropoff = dropoffState(lead, event, leadMessages);
      const waitingClickMessages = leadMessages.filter(
        (message) => cleanText(message.status) === "aguardando-clique"
      );
      const firstWaitingClick = waitingClickMessages[0];
      const waitingClickMinutes = firstWaitingClick
        ? Math.round(
            (Date.now() -
              new Date(
                sentAtFromMetadata(firstWaitingClick) ||
                  cleanText(firstWaitingClick.enviar_em) ||
                  cleanText(firstWaitingClick.created_at)
              ).getTime()) /
              60000
          )
        : null;

      return {
        id: cleanText(lead.id),
        nome: cleanText(lead.nome),
        email,
        whatsapp: cleanText(lead.whatsapp),
        objetivo: cleanText(lead.objetivo),
        status: cleanText(lead.status),
        etapa_funil: cleanText(lead.etapa_funil),
        capturado_em: cleanText(lead.capturado_em || lead.created_at),
        source,
        progress: {
          completed,
          total: FLOW_STEPS.length,
          percent: Math.round((completed / FLOW_STEPS.length) * 100),
        },
        current_stage: stage,
        payment,
        dropoff,
        operational_alert:
          !latestInteraction && waitingClickMinutes !== null && waitingClickMinutes >= 5
            ? {
                key: "clique-nao-chegou",
                label: "Lead respondeu, mas a Twilio ainda nao entregou o clique ao sistema",
                detail:
                  "Se a lead ja tocou no botao e esta etapa continua aguardando clique, verifique o webhook inbound da Twilio ou rode a sincronizacao inbound.",
                minutes: waitingClickMinutes,
              }
            : null,
        latest_activity_at: latest,
        journey: timeline,
        latest_kiwify_event: event
          ? {
              evento: cleanText(event.evento),
              status: cleanText(event.status),
              order_id: cleanText(event.order_id),
              received_at: cleanText(event.recebido_em),
            }
          : null,
        messages: {
          total: leadMessages.length,
          sent: leadMessages.filter((message) => cleanText(message.status) === "enviada").length,
          pending: leadMessages.filter((message) => cleanText(message.status) === "pendente").length,
          waiting_click: leadMessages.filter((message) => cleanText(message.status) === "aguardando-clique").length,
          errors: leadMessages.filter((message) => cleanText(message.status) === "erro").length,
          timeline: leadMessages.map((message) => ({
            etapa: cleanText(message.etapa),
            etapa_label:
              STEP_LABELS[cleanText(message.etapa)] ||
              MESSAGE_LABELS[cleanText(message.etapa)] ||
              cleanText(message.etapa),
            status: cleanText(message.status),
            status_label: humanMessageStatus(cleanText(message.status)),
            trigger_event: cleanText(message.trigger_event),
            mensagem: cleanText(message.mensagem),
            enviar_em: cleanText(message.enviar_em),
            created_at: cleanText(message.created_at),
            sent_at: sentAtFromMetadata(message),
            twilio_message_ids: messageIdsFromMetadata(message),
            twilio_template: templateFromMetadata(message),
          })),
        },
        latest_interaction: latestInteraction
          ? {
              button_payload: cleanText(latestInteraction.button_payload),
              button_text: cleanText(latestInteraction.button_text),
              received_at: cleanText(latestInteraction.received_at),
            }
          : null,
      };
    });

    const bySource = leadRows.reduce<Record<string, { label: string; count: number }>>(
      (acc, lead) => {
        const key = lead.source.key;

        acc[key] = acc[key] || { label: lead.source.label, count: 0 };
        acc[key].count += 1;

        return acc;
      },
      {}
    );
    const sentGroupLinks = leadRows.filter((lead) =>
      lead.messages.timeline.some(
        (message) => message.etapa === "grupo-oficial-link" && message.status === "enviada"
      )
    ).length;
    const waitingClicks = leadRows.reduce((sum, lead) => sum + lead.messages.waiting_click, 0);
    const errors = leadRows.reduce((sum, lead) => sum + lead.messages.errors, 0);
    const paymentConfirmed = leadRows.filter((lead) => lead.payment.confirmed).length;
    const paymentNotConfirmed = leadRows.filter((lead) => !lead.payment.confirmed).length;
    const needsAttention = leadRows.filter((lead) => lead.dropoff.needs_attention).length;

    return NextResponse.json({
      ok: true,
      checked_at: new Date().toISOString(),
      launch_readiness: buildAutomationReadiness(),
      metrics: {
        total_leads: leadRows.length,
        leads_24h: leadRows.filter(
          (lead) => new Date(lead.capturado_em).getTime() >= since24h
        ).length,
        kiwify_events: events.length,
        messages_total: messages.length,
        waiting_clicks: waitingClicks,
        errors,
        group_links_sent: sentGroupLinks,
        payment_confirmed: paymentConfirmed,
        payment_not_confirmed: paymentNotConfirmed,
        needs_attention: needsAttention,
        by_source: Object.values(bySource).sort((a, b) => b.count - a.count),
      },
      campaign_links: [
        {
          label: "Instagram Story",
          url: "/?utm_source=instagram&utm_medium=story&utm_campaign=trinca_rv21_lancamento",
        },
        {
          label: "Instagram Direct",
          url: "/?utm_source=instagram&utm_medium=direct&utm_campaign=trinca_rv21_lancamento",
        },
        {
          label: "Instagram Feed",
          url: "/?utm_source=instagram&utm_medium=feed&utm_campaign=trinca_rv21_lancamento",
        },
      ],
      leads: leadRows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
