import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cockpitUrl, sendInternalRuriaNotification } from "@/lib/internal-notifications";
import { createServerEventId, sendServerEvent } from "@/lib/meta-capi";
import { sendTwilioMessage } from "@/lib/whatsapp/twilio";

type JsonObject = Record<string, unknown>;
type SupabaseTable = {
  Row: JsonObject;
  Insert: JsonObject;
  Update: JsonObject;
  Relationships: [];
};
type LeadTable = {
  Row: { id: string } & JsonObject;
  Insert: JsonObject;
  Update: JsonObject;
  Relationships: [];
};

type Database = {
  public: {
    Tables: {
      automation_messages: SupabaseTable;
      kiwify_events: SupabaseTable;
      leads: LeadTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

type AppSupabaseClient = SupabaseClient<Database>;

const RECOVERY_STEPS = [
  "pagamento-recusado-5min",
  "pagamento-recusado-2h",
  "carrinho-abandonado-15min",
  "carrinho-abandonado-6h",
  "carrinho-abandonado-24h",
  "pagamento-pendente-20min",
  "pagamento-pendente-2h",
  "pagamento-pendente-24h",
];

const LEAD_RECOVERY_STEPS = [
  "lead-formulario-abandonado-5min",
  "lead-formulario-abandonado-2h",
  "lead-formulario-abandonado-24h",
];

const CANCEL_ON_APPROVAL_STEPS = [...RECOVERY_STEPS, ...LEAD_RECOVERY_STEPS];

type NormalizedEvent = {
  evento: string;
  orderId: string;
  orderStatus: string;
  paymentMethod: string;
  installments: unknown;
  chargeAmount: unknown;
  productName: string;
  nome: string;
  email: string;
  whatsapp: string;
  status: string;
  etapaFunil: string;
  tracking: JsonObject;
  receivedAt: string;
};

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeObjective(value: unknown) {
  const text = cleanText(value).toLowerCase();

  if (text.includes("gluteo") || text.includes("glúteo") || text.includes("firmeza")) {
    return "gluteos";
  }

  if (text.includes("autoestima") || text.includes("confianca") || text.includes("confiança")) {
    return "autoestima";
  }

  if (text.includes("roupa") || text.includes("antiga")) {
    return "roupas";
  }

  if (text.includes("emagrec") || text.includes("medida") || text.includes("reduzir")) {
    return "emagrecimento";
  }

  return cleanText(value);
}

function publicAssetUrl(path: string) {
  const siteUrl = cleanText(process.env.NEXT_PUBLIC_SITE_URL) || "https://trinca-rv21.vercel.app";
  return `${siteUrl.replace(/\/+$/, "")}${path}`;
}

function dietUrlForObjective(objective: unknown) {
  const normalizedObjective = normalizeObjective(objective);

  if (normalizedObjective === "gluteos") {
    return (
      cleanText(process.env.TRINCA_DIET_GLUTEOS_URL) ||
      publicAssetUrl("/materials/dieta-gluteos-firmeza.pdf")
    );
  }

  if (normalizedObjective === "autoestima") {
    return (
      cleanText(process.env.TRINCA_DIET_AUTOESTIMA_URL) ||
      publicAssetUrl("/materials/dieta-autoestima.pdf")
    );
  }

  if (normalizedObjective === "roupas") {
    return (
      cleanText(process.env.TRINCA_DIET_ROUPAS_URL) ||
      publicAssetUrl("/materials/dieta-roupas-antigas.pdf")
    );
  }

  if (normalizedObjective === "emagrecimento") {
    return (
      cleanText(process.env.TRINCA_DIET_EMAGRECIMENTO_URL) ||
      publicAssetUrl("/materials/dieta-emagrecimento.pdf")
    );
  }

  return "";
}

function ebookRvUrl() {
  return (
    cleanText(process.env.TRINCA_EBOOK_RV_URL) ||
    publicAssetUrl("/materials/ebook-rv-trinca-rv21.pdf")
  );
}

function ebookNutritionUrl() {
  return (
    cleanText(process.env.TRINCA_EBOOK_NUTRITION_URL) ||
    publicAssetUrl("/materials/ebook-nutricional-julia-macena.pdf")
  );
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) {
      return text;
    }
  }

  return "";
}

function readWebhookToken(request: Request, payload: JsonObject) {
  const url = new URL(request.url);
  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.replace(/^Bearer\s+/i, "").trim();

  return [
    url.searchParams.get("token"),
    request.headers.get("x-kiwify-token"),
    request.headers.get("x-webhook-token"),
    request.headers.get("x-token"),
    bearerToken,
    payload.token,
    payload.webhook_token,
  ]
    .map(cleanText)
    .filter(Boolean);
}

function normalizeFunnel(eventType: string, orderStatus: string) {
  const event = `${eventType} ${orderStatus}`.toLowerCase();

  if (
    event.includes("approved") ||
    event.includes("aprovada") ||
    event.includes("paid") ||
    event.includes("pago")
  ) {
    return { status: "compra-aprovada", etapaFunil: "comprou" };
  }

  if (
    event.includes("refused") ||
    event.includes("recusada") ||
    event.includes("rejected") ||
    event.includes("cancel")
  ) {
    return { status: "compra-recusada", etapaFunil: "pagamento-recusado" };
  }

  if (event.includes("abandon")) {
    return { status: "carrinho-abandonado", etapaFunil: "recuperacao" };
  }

  if (
    event.includes("pix") ||
    event.includes("boleto") ||
    event.includes("pending") ||
    event.includes("waiting")
  ) {
    return { status: "pagamento-pendente", etapaFunil: "checkout" };
  }

  return { status: "evento-kiwify", etapaFunil: "checkout" };
}

async function forwardToAutomation(payload: JsonObject) {
  const automationWebhookUrl = process.env.AUTOMATION_WEBHOOK_URL;

  if (!automationWebhookUrl) {
    return;
  }

  try {
    await fetch(automationWebhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("Erro ao encaminhar webhook para automacao", error);
  }
}

function firstName(nome: string) {
  return nome.split(" ").filter(Boolean)[0] || "Oi";
}

function paymentMethodLabel(paymentMethod: string) {
  const method = paymentMethod.toLowerCase();

  if (method.includes("pix")) {
    return "Pix";
  }

  if (method.includes("boleto") || method.includes("billet")) {
    return "boleto";
  }

  if (method.includes("card") || method.includes("cartao") || method.includes("cartão")) {
    return "cartao";
  }

  return "pagamento";
}

function templateForStep(etapa: string) {
  if (etapa.startsWith("pagamento-pendente")) {
    return {
      name: "trinca_pagamento_pendente",
      category: "UTILITY",
    };
  }

  if (etapa.startsWith("pagamento-recusado")) {
    return {
      name: "trinca_pagamento_recusado",
      category: "UTILITY",
    };
  }

  if (etapa.startsWith("carrinho-abandonado")) {
    return {
      name: "trinca_retomada_inscricao",
      category: "MARKETING",
    };
  }

  if (etapa === "compra-confirmada") {
    return {
      name: "trinca_rv21_compra_confirmada",
      category: "UTILITY",
    };
  }

  if (etapa === "boas-vindas-video") {
    return {
      name: "trinca_boas_vindas_video",
      category: "UTILITY",
    };
  }

  if (etapa === "grupo-oficial-final") {
    return {
      name: "trinca_rv21_video_grupo_oficial",
      category: "UTILITY",
    };
  }

  if (etapa === "orientacoes-iniciais") {
    return {
      name: "trinca_rv21_orientacoes_iniciais",
      category: "UTILITY",
    };
  }

  if (etapa === "materiais-desafio") {
    return {
      name: "trinca_rv21_materiais_desafio",
      category: "UTILITY",
    };
  }

  if (etapa === "dieta-ebooks") {
    return {
      name: "trinca_rv21_dieta_treino",
      category: "UTILITY",
    };
  }

  if (etapa === "grupo-oficial-preparacao") {
    return {
      name: "trinca_rv21_video_grupo_oficial",
      category: "UTILITY",
    };
  }

  if (etapa === "grupo-oficial-link") {
    return {
      name: "trinca_grupo_oficial_link",
      category: "UTILITY",
    };
  }

  return {
    name: "trinca_aviso_oficial",
    category: "UTILITY",
  };
}

function withTemplateMetadata(
  message: Record<string, unknown>,
  normalizedEvent: NormalizedEvent,
  values: {
    nome: string;
    checkoutUrl: string;
    whatsappGroupUrl: string;
    paymentLabel: string;
    productName: string;
  }
) {
  const etapa = cleanText(message.etapa);
  const template = templateForStep(etapa);
  const metadata = asObject(message.metadata);
  const links = asObject(metadata.links);
  const hasBodyVariableOrder = Array.isArray(metadata.body_variable_order);

  return {
    ...message,
    metadata: {
      ...metadata,
      whatsapp_api: {
        template_name: template.name,
        template_category: template.category,
        language: "pt_BR",
        body_variables: {
          nome: values.nome,
          metodo_pagamento: values.paymentLabel,
          produto: values.productName,
        },
        buttons: {
          checkout_url: values.checkoutUrl,
          group_url: values.whatsappGroupUrl,
          asset_url: metadata.asset_url || null,
          diet_url: links.dieta || null,
          ebook_rv_url: links.ebook_rv || null,
          ebook_nutrition_url: links.ebook_nutricional || null,
        },
        ...(hasBodyVariableOrder
          ? { body_variable_order: metadata.body_variable_order }
          : {}),
      },
      original_event_status: normalizedEvent.status,
    },
  };
}

function buildMessageQueue(normalizedEvent: NormalizedEvent, leadObjective?: unknown) {
  const checkoutUrl =
    process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL || "https://pay.kiwify.com.br/mEhmYNt";
  const whatsappGroupUrl = process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL || "";
  const welcomeVideoUrl = cleanText(process.env.TRINCA_WELCOME_VIDEO_URL);
  const abandonmentVideoUrl = cleanText(process.env.TRINCA_ABANDONMENT_VIDEO_URL);
  const groupWelcomeVideoUrl = cleanText(process.env.TRINCA_GROUP_WELCOME_VIDEO_URL);
  const dietUrl = dietUrlForObjective(leadObjective) || cleanText(process.env.TRINCA_DIET_URL);
  const ebookRvUrlValue = ebookRvUrl();
  const ebookNutritionUrlValue = ebookNutritionUrl();
  const nome = firstName(normalizedEvent.nome);
  const paymentLabel = paymentMethodLabel(normalizedEvent.paymentMethod);
  const productName = normalizedEvent.productName || "TRINCA RV21";
  const base = {
    email: normalizedEvent.email,
    whatsapp: normalizedEvent.whatsapp,
    nome: normalizedEvent.nome || "Cliente Kiwify",
    order_id: normalizedEvent.orderId || null,
    payment_method: normalizedEvent.paymentMethod || null,
    trigger_event: normalizedEvent.evento,
    status: "pendente",
    canal: "whatsapp",
    metadata: {
      orderStatus: normalizedEvent.orderStatus,
      etapaFunil: normalizedEvent.etapaFunil,
      source: "kiwify",
    },
  };

  if (normalizedEvent.status === "compra-aprovada") {
    return [
      {
        ...base,
        etapa: "compra-confirmada",
        delay_minutos: 0,
        metadata: {
          ...base.metadata,
          sequence: "pos-compra",
          sequence_order: 1,
          required_previous_steps: [],
          body_variable_order: [],
          button_payload: "compra_confirmada_estou_pronta",
          button_text: "Estou pronta",
        },
        mensagem:
          "Sua inscricao no TRINCA RV21 foi confirmada com sucesso pela equipe RV.\n\n" +
          "Para continuar, toque no botao abaixo e receba o video de boas-vindas.",
      },
      {
        ...base,
        etapa: "clique-compra-confirmada-estou-pronta",
        delay_minutos: 0,
        status: "aguardando-clique",
        metadata: {
          ...base.metadata,
          sequence: "pos-compra",
          sequence_order: 1.1,
          gate: true,
          expected_button_payload: "compra_confirmada_estou_pronta",
          unlocks_step: "boas-vindas-video",
        },
        mensagem: "Gate interno: clique em Estou pronta na compra confirmada.",
      },
      {
        ...base,
        etapa: "boas-vindas-video",
        delay_minutos: 0,
        metadata: {
          ...base.metadata,
          sequence: "pos-compra",
          sequence_order: 2,
          required_previous_steps: ["compra-confirmada", "clique-compra-confirmada-estou-pronta"],
          body_variable_order: [],
          asset_url: welcomeVideoUrl || null,
        },
        mensagem:
          `${nome}, seja bem-vinda ao ${productName}.\n\n` +
          "Assista primeiro ao video de boas-vindas do criador e idealizador do TRINCA RV21, Ruria Virginio." +
          (welcomeVideoUrl ? `\n\nVideo: ${welcomeVideoUrl}` : ""),
      },
      {
        ...base,
        etapa: "materiais-desafio",
        delay_minutos: 2,
        metadata: {
          ...base.metadata,
          sequence: "pos-compra",
          sequence_order: 3,
          required_previous_steps: ["boas-vindas-video"],
          delay_after_previous_minutes: 2,
          body_variable_order: [],
          asset_url: dietUrl || null,
          asset_urls: [dietUrl, ebookRvUrlValue, ebookNutritionUrlValue].filter(Boolean),
          links: {
            dieta: dietUrl || null,
            ebook_rv: ebookRvUrlValue || null,
            ebook_nutricional: ebookNutritionUrlValue || null,
          },
        },
        mensagem:
          `${nome}, agora seguem seus materiais principais do TRINCA RV21.\n\n` +
          "Voce recebera sua dieta de acordo com o objetivo selecionado, o Ebook RV e o Ebook Nutricional.\n\n" +
          "Guarde esses materiais e siga a sequencia com calma.",
      },
      {
        ...base,
        etapa: "grupo-oficial-preparacao",
        delay_minutos: 4,
        metadata: {
          ...base.metadata,
          sequence: "pos-compra",
          sequence_order: 4,
          required_previous_steps: ["materiais-desafio"],
          delay_after_previous_minutes: 2,
          body_variable_order: [],
          button_payload: "assistir_boas_vindas_grupo",
          button_text: "Assistir boas-vindas",
        },
        mensagem:
          "Agora vamos liberar sua entrada no Grupo Oficial TRINCA RV21.\n\n" +
          "Antes de receber o link, toque no botao abaixo para assistir ao video de boas-vindas do grupo.",
      },
      {
        ...base,
        etapa: "clique-grupo-assistir-boas-vindas",
        delay_minutos: 0,
        status: "aguardando-clique",
        metadata: {
          ...base.metadata,
          sequence: "pos-compra",
          sequence_order: 4.1,
          gate: true,
          expected_button_payload: "assistir_boas_vindas_grupo",
          unlocks_step: "grupo-oficial-final",
        },
        mensagem: "Gate interno: clique em Assistir boas-vindas antes do video do grupo.",
      },
      {
        ...base,
        etapa: "grupo-oficial-final",
        delay_minutos: 0,
        metadata: {
          ...base.metadata,
          sequence: "pos-compra",
          sequence_order: 5,
          required_previous_steps: ["clique-grupo-assistir-boas-vindas"],
          body_variable_order: [],
          asset_url: groupWelcomeVideoUrl || null,
        },
        mensagem:
          `${nome}, assista ao video oficial de boas-vindas ao Grupo Oficial TRINCA RV21.` +
          (groupWelcomeVideoUrl ? `\n\nVideo: ${groupWelcomeVideoUrl}` : ""),
      },
      {
        ...base,
        etapa: "grupo-oficial-link",
        delay_minutos: 1,
        metadata: {
          ...base.metadata,
          sequence: "pos-compra",
          sequence_order: 6,
          required_previous_steps: ["grupo-oficial-final"],
          delay_after_previous_minutes: 1,
          body_variable_order: [],
        },
        mensagem:
          `${nome}, entre agora no Grupo Oficial TRINCA RV21 pelo link abaixo.\n\n` +
          `${whatsappGroupUrl || "[link_grupo]"}\n\n` +
          "De verdade, agora comeca a nossa jornada do TRINCA RV21.",
      },
    ].map((message) =>
      withTemplateMetadata(message, normalizedEvent, {
        nome,
        checkoutUrl,
        whatsappGroupUrl,
        paymentLabel,
        productName,
      })
    );
  }

  if (normalizedEvent.status === "compra-recusada") {
    return [
      {
        ...base,
        etapa: "pagamento-recusado-5min",
        delay_minutos: 5,
        metadata: {
          ...base.metadata,
          asset_url: abandonmentVideoUrl || null,
        },
        mensagem:
          `${nome}, vi que sua tentativa de entrada no ${productName} nao foi aprovada pela forma de pagamento.\n\n` +
          "Isso costuma acontecer por limite, validacao do banco ou dados do cartao. Sua vaga ainda pode ser concluida pelo checkout seguro:\n" +
          checkoutUrl,
      },
      {
        ...base,
        etapa: "pagamento-recusado-2h",
        delay_minutos: 120,
        mensagem:
          `${nome}, passando para te ajudar a nao perder sua decisao de entrar no ${productName}.\n\n` +
          "Se o cartao nao aprovou, voce pode tentar novamente ou escolher Pix/boleto no checkout. Assim que confirmar, voce recebe os proximos passos do desafio.\n" +
          checkoutUrl,
      },
    ].map((message) =>
      withTemplateMetadata(message, normalizedEvent, {
        nome,
        checkoutUrl,
        whatsappGroupUrl,
        paymentLabel,
        productName,
      })
    );
  }

  if (normalizedEvent.status === "carrinho-abandonado") {
    return [
      {
        ...base,
        etapa: "carrinho-abandonado-15min",
        delay_minutos: 15,
        metadata: {
          ...base.metadata,
          asset_url: abandonmentVideoUrl || null,
        },
        mensagem:
          `${nome}, sua inscricao no ${productName} ficou quase pronta, mas ainda nao foi finalizada.\n\n` +
          "O desafio foi criado para mulheres que querem direcao por 21 dias, com treino, alimentacao, suporte e grupo oficial. Voce pode retomar por aqui:\n" +
          checkoutUrl,
      },
      {
        ...base,
        etapa: "carrinho-abandonado-6h",
        delay_minutos: 360,
        mensagem:
          `${nome}, sua entrada no ${productName} continua pendente.\n\n` +
          "Se essa decisao ainda faz sentido para voce, finalize agora e garanta acesso ao grupo oficial, dieta por objetivo e materiais do desafio.\n" +
          checkoutUrl,
      },
      {
        ...base,
        etapa: "carrinho-abandonado-24h",
        delay_minutos: 1440,
        mensagem:
          `${nome}, talvez essa seja exatamente a hora de parar de adiar voce.\n\n` +
          "O TRINCA RV21 nao e sobre perfeicao. E sobre entrar em movimento com estrutura, suporte e compromisso por 21 dias.\n" +
          checkoutUrl,
      },
    ].map((message) =>
      withTemplateMetadata(message, normalizedEvent, {
        nome,
        checkoutUrl,
        whatsappGroupUrl,
        paymentLabel,
        productName,
      })
    );
  }

  if (normalizedEvent.status === "pagamento-pendente") {
    const pendingAction =
      paymentLabel === "Pix"
        ? "o Pix ainda nao foi confirmado"
        : paymentLabel === "boleto"
          ? "o boleto ainda nao foi confirmado"
          : "o pagamento ainda nao foi confirmado";

    return [
      {
        ...base,
        etapa: "pagamento-pendente-20min",
        delay_minutos: 20,
        metadata: {
          ...base.metadata,
          asset_url: abandonmentVideoUrl || null,
        },
        mensagem:
          `${nome}, vi que sua inscricao no ${productName} ficou quase finalizada, mas ${pendingAction}.\n\n` +
          "Sua vaga ainda pode ser concluida para liberar o grupo oficial, a dieta por objetivo e os materiais dos 21 dias.\n" +
          checkoutUrl,
      },
      {
        ...base,
        etapa: "pagamento-pendente-2h",
        delay_minutos: 120,
        mensagem:
          `${nome}, passando para te lembrar que sua inscricao no ${productName} segue pendente.\n\n` +
          "Esse desafio foi pensado para mulheres que querem sair do improviso e voltar a se sentir firmes, confiantes e em movimento.\n" +
          checkoutUrl,
      },
      {
        ...base,
        etapa: "pagamento-pendente-24h",
        delay_minutos: 1440,
        mensagem:
          `${nome}, sua decisao de entrar no ${productName} ainda pode ser retomada.\n\n` +
          "Se voce quer viver os proximos 21 dias com direcao, constancia e suporte, finalize sua entrada por aqui:\n" +
          checkoutUrl,
      },
    ].map((message) =>
      withTemplateMetadata(message, normalizedEvent, {
        nome,
        checkoutUrl,
        whatsappGroupUrl,
        paymentLabel,
        productName,
      })
    );
  }

  return [];
}

async function enqueueMessages(
  supabase: AppSupabaseClient,
  normalizedEvent: NormalizedEvent,
  leadObjective?: unknown,
) {
  const messages = buildMessageQueue(normalizedEvent, leadObjective);

  if (!messages.length) {
    return;
  }

  const now = Date.now();
  const rows = messages.map((rawMessage) => {
    const message = rawMessage as Record<string, unknown>;
    const delayMinutos = Number(message.delay_minutos) || 0;

    return {
      ...message,
      enviar_em: new Date(now + delayMinutos * 60 * 1000).toISOString(),
      dedupe_key: [
        normalizedEvent.orderId || normalizedEvent.email,
        normalizedEvent.evento,
        cleanText(message.etapa),
      ].join(":"),
    };
  });

  const { error } = await supabase
    .from("automation_messages")
    .upsert(rows, { onConflict: "dedupe_key", ignoreDuplicates: true });

  if (error) {
    console.error("Erro ao montar fila de mensagens", error.message);
  }
}

function requiredPreviousSteps(message: JsonObject) {
  const metadata = asObject(message.metadata);
  const required = metadata.required_previous_steps;

  return Array.isArray(required) ? required.map(cleanText).filter(Boolean) : [];
}

async function hasCompletedPreviousSteps(
  supabase: AppSupabaseClient,
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
    .select("etapa,status")
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

  const rows = (data || []) as Array<{ etapa?: unknown }>;
  const completed = new Set(rows.map((row) => cleanText(row.etapa)));

  return required.every((step) => completed.has(step));
}

async function claimPendingMessage(supabase: AppSupabaseClient, message: JsonObject) {
  const metadata = asObject(message.metadata);
  const { data, error } = await supabase
    .from("automation_messages")
    .update({
      status: "processando",
      metadata: {
        ...metadata,
        processing: {
          started_at: new Date().toISOString(),
          worker: "kiwify_webhook_immediate",
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

async function dispatchImmediateDueMessages(
  supabase: AppSupabaseClient,
  normalizedEvent: NormalizedEvent
) {
  const now = new Date().toISOString();
  const orderId = cleanText(normalizedEvent.orderId);
  const email = cleanText(normalizedEvent.email);

  let query = supabase
    .from("automation_messages")
    .select(
      "id,email,whatsapp,nome,order_id,payment_method,trigger_event,etapa,canal,mensagem,enviar_em,status,metadata"
    )
    .eq("status", "pendente")
    .lte("enviar_em", now)
    .order("enviar_em", { ascending: true })
    .limit(5);

  if (orderId) {
    query = query.eq("order_id", orderId);
  } else if (email) {
    query = query.eq("email", email);
  } else {
    return { sent: [], skipped: [], failed: [] };
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const sent: JsonObject[] = [];
  const skipped: JsonObject[] = [];
  const failed: JsonObject[] = [];

  for (const message of (data || []) as JsonObject[]) {
    const messageId = cleanText(message.id);

    try {
      const previousStepsCompleted = await hasCompletedPreviousSteps(supabase, message);

      if (!previousStepsCompleted) {
        skipped.push({
          id: message.id,
          etapa: message.etapa,
          reason: "required_previous_steps_pending",
        });
        continue;
      }

      if (!(await claimPendingMessage(supabase, message))) {
        skipped.push({
          id: message.id,
          etapa: message.etapa,
          reason: "message_already_claimed",
        });
        continue;
      }

      const result = await sendTwilioMessage({
        id: messageId,
        whatsapp: message.whatsapp,
        mensagem: message.mensagem,
        etapa: message.etapa,
        metadata: message.metadata,
      });
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
              triggered_by: "kiwify_webhook_immediate_dispatch",
            },
          },
        })
        .eq("id", messageId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      sent.push({
        id: message.id,
        etapa: message.etapa,
        message_ids: result.messageIds,
      });

      break;
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
              provider: "twilio",
              failed_at: new Date().toISOString(),
              message: errorMessage,
              triggered_by: "kiwify_webhook_immediate_dispatch",
            },
          },
        })
        .eq("id", messageId);

      failed.push({
        id: message.id,
        etapa: message.etapa,
        error: errorMessage,
      });
    }
  }

  return { sent, skipped, failed };
}

export async function POST(request: Request) {
  let payload: JsonObject;
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry_run") === "true";

  try {
    payload = (await request.json()) as JsonObject;
  } catch {
    return NextResponse.json({ error: "JSON invalido." }, { status: 400 });
  }

  const secret = cleanText(process.env.KIWIFY_WEBHOOK_SECRET);
  const receivedTokens = readWebhookToken(request, payload);

  if (secret && !receivedTokens.includes(secret)) {
    return NextResponse.json({ error: "Token invalido." }, { status: 401 });
  }

  const customer = asObject(payload.Customer ?? payload.customer);
  const product = asObject(payload.Product ?? payload.product);
  const tracking = asObject(payload.TrackingParameters ?? payload.tracking);
  const commissions = asObject(payload.Commissions ?? payload.commissions);

  const nome = firstText(
    customer.full_name,
    customer.name,
    customer.first_name,
    payload.customer_name,
    payload.name
  );
  const email = firstText(customer.email, payload.customer_email, payload.email).toLowerCase();
  const whatsapp = firstText(
    customer.mobile,
    customer.phone,
    customer.whatsapp,
    payload.customer_phone,
    payload.phone,
    payload.whatsapp
  );
  const orderStatus = firstText(payload.order_status, payload.status);
  const eventType = firstText(payload.webhook_event_type, payload.event, payload.event_type);
  const orderId = firstText(payload.order_id, payload.order_ref);
  const paymentMethod = firstText(payload.payment_method);
  const productName = firstText(product.product_name, product.name);
  const { status, etapaFunil } = normalizeFunnel(eventType, orderStatus);

  const normalizedEvent = {
    evento: eventType || orderStatus || "kiwify_webhook",
    orderId,
    orderStatus,
    paymentMethod,
    installments: payload.installments,
    chargeAmount: commissions.charge_amount,
    productName,
    nome,
    email,
    whatsapp,
    status,
    etapaFunil,
    tracking,
    receivedAt: new Date().toISOString(),
  };

  await forwardToAutomation({
    source: "kiwify",
    ...normalizedEvent,
    raw: payload,
  });

  if (!email) {
    return NextResponse.json({
      ok: true,
      ignored: "Webhook recebido sem email do cliente.",
    });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Supabase ainda nao configurado no ambiente." },
      { status: 503 }
    );
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  if (status === "compra-aprovada") {
    const pendingQuery = supabase
      .from("automation_messages")
      .update({
        status: "cancelada",
        metadata: {
          motivo: "Compra aprovada antes do envio de recuperacao.",
          orderId,
        },
      })
      .eq("status", "pendente")
      .in("etapa", CANCEL_ON_APPROVAL_STEPS);

    const { error: cancelError } = orderId
      ? await pendingQuery.eq("order_id", orderId)
      : await pendingQuery.eq("email", email);

    if (cancelError) {
      console.error("Erro ao cancelar recuperacoes pendentes", cancelError.message);
    }

    const { count: salesTodayCount } = await supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("status", "compra-aprovada")
      .gte("updated_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());
    const totalToday = salesTodayCount || 1;

    await sendInternalRuriaNotification({
      type: "sale_confirmed",
      dedupeKey: `sale_confirmed:${orderId || email}`,
      message: `💰 *TRINCA RV21 — Venda confirmada!*

${nome || "Uma compradora"} acabou de comprar.
Total hoje: ${totalToday} vendas | R$${(totalToday * 37.89).toFixed(2).replace(".", ",")}

👉 Acompanhe ao vivo:
${cockpitUrl()}`,
    });
  }

  const { error: eventError } = await supabase.from("kiwify_events").insert({
    email,
    whatsapp,
    nome: nome || "Cliente Kiwify",
    evento: normalizedEvent.evento,
    status,
    etapa_funil: etapaFunil,
    order_id: orderId || null,
    order_status: orderStatus || null,
    payment_method: paymentMethod || null,
    product_name: productName || null,
    payload,
    recebido_em: normalizedEvent.receivedAt,
  });

  if (eventError) {
    console.error("Erro ao salvar historico da Kiwify", eventError.message);
  }

  const { data: existingLead, error: findError } = await supabase
    .from("leads")
    .select("id,utm,objetivo")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  const preservedObjective =
    normalizeObjective(existingLead?.objetivo) || normalizeObjective(productName) || "Desafio TRINCA RV21";

  await enqueueMessages(supabase, normalizedEvent, preservedObjective);

  const leadUpdate = {
    nome: nome || "Cliente Kiwify",
    email,
    whatsapp,
    objetivo: preservedObjective,
    origem: "kiwify",
    status,
    etapa_funil: etapaFunil,
    utm: JSON.stringify({
      origem: "kiwify",
      evento: eventType,
      orderStatus,
      orderId,
      paymentMethod,
      tracking,
      landing_tracking: existingLead?.utm || null,
    }),
  };

  const mutation = existingLead
    ? supabase.from("leads").update(leadUpdate).eq("id", existingLead.id)
    : supabase.from("leads").insert({
        ...leadUpdate,
        capturado_em: new Date().toISOString(),
      });

  const { error } = await mutation;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let metaCapiEvent:
    | {
        ok: boolean;
        skipped?: boolean;
        event_id?: string;
      }
    | null = null;

  if (status === "compra-aprovada") {
    const metaEventId = createServerEventId("Purchase", orderId || email);

    try {
      metaCapiEvent = await sendServerEvent(
        "Purchase",
        {
          email,
          phone: whatsapp,
        },
        {
          event_id: metaEventId,
          value: 37.89,
          currency: "BRL",
          content_type: "product",
          content_ids: ["trinca-rv21"],
          content_name: productName || "TRINCA RV21",
          order_id: orderId || null,
        },
      );
    } catch (metaError) {
      console.error("Erro ao enviar Purchase para Meta CAPI", metaError);
      metaCapiEvent = {
        ok: false,
        event_id: metaEventId,
      };
    }
  }

  const immediateDispatch =
    status === "compra-aprovada" && !dryRun
      ? await dispatchImmediateDueMessages(supabase, normalizedEvent)
      : dryRun
        ? { dry_run: true, sent: [], skipped: [], failed: [] }
        : null;

  return NextResponse.json({
    ok: true,
    saved: true,
    status,
    etapaFunil,
    metaCapiEvent,
    immediateDispatch,
  });
}
