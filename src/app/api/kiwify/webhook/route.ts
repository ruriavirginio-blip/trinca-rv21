import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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

  if (etapa === "boas-vindas") {
    return {
      name: "trinca_boas_vindas_aprovada",
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
        },
      },
      original_event_status: normalizedEvent.status,
    },
  };
}

function buildMessageQueue(normalizedEvent: NormalizedEvent) {
  const checkoutUrl =
    process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL || "https://pay.kiwify.com.br/mEhmYNt";
  const whatsappGroupUrl = process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL || "";
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
        etapa: "boas-vindas",
        delay_minutos: 0,
        mensagem:
          `${nome}, sua inscricao no ${productName} foi aprovada. Seja bem-vinda ao desafio oficial.\n\n` +
          "Agora voce entra na etapa de orientacao, grupo oficial e recebimento dos materiais dos 21 dias." +
          (whatsappGroupUrl ? `\n\nEntre no grupo oficial por aqui: ${whatsappGroupUrl}` : ""),
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

async function enqueueMessages(supabase: AppSupabaseClient, normalizedEvent: NormalizedEvent) {
  const messages = buildMessageQueue(normalizedEvent);

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

export async function POST(request: Request) {
  let payload: JsonObject;

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
      .neq("etapa", "boas-vindas");

    const { error: cancelError } = orderId
      ? await pendingQuery.eq("order_id", orderId)
      : await pendingQuery.eq("email", email);

    if (cancelError) {
      console.error("Erro ao cancelar recuperacoes pendentes", cancelError.message);
    }
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

  await enqueueMessages(supabase, normalizedEvent);

  const leadUpdate = {
    nome: nome || "Cliente Kiwify",
    email,
    whatsapp,
    objetivo: productName || "Desafio TRINCA RV21",
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
    }),
  };

  const { data: existingLead, error: findError } = await supabase
    .from("leads")
    .select("id")
    .eq("email", email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

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

  return NextResponse.json({
    ok: true,
    saved: true,
    status,
    etapaFunil,
  });
}
