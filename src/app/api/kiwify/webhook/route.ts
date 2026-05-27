import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type JsonObject = Record<string, unknown>;

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

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

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
