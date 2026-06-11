import { NextResponse } from "next/server";
import { cleanText, onlyDigits } from "@/lib/whatsapp/phone";

type JsonObject = Record<string, unknown>;

function readToken(request: Request) {
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
  const secrets = [
    process.env.AUTOMATION_API_SECRET,
    process.env.TWILIO_WEBHOOK_SECRET,
    process.env.CRON_SECRET,
    process.env.KIWIFY_WEBHOOK_SECRET,
  ]
    .map(cleanText)
    .filter(Boolean);

  if (!secrets.length) {
    return NextResponse.json({ error: "Token interno ainda nao configurado." }, { status: 503 });
  }

  if (!readToken(request).some((token) => secrets.includes(token))) {
    return NextResponse.json({ error: "Token invalido." }, { status: 401 });
  }

  return null;
}

function twilioConfig() {
  const accountSid = cleanText(process.env.TWILIO_ACCOUNT_SID);
  const authToken = cleanText(process.env.TWILIO_AUTH_TOKEN);

  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN precisam estar configurados.");
  }

  return {
    accountSid,
    authToken,
    authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    apiBaseUrl: cleanText(process.env.TWILIO_BASE_URL) || "https://api.twilio.com",
    messagingBaseUrl: "https://messaging.twilio.com",
  };
}

function webhookUrl() {
  const siteUrl =
    cleanText(process.env.NEXT_PUBLIC_SITE_URL) || "https://trinca-rv21.vercel.app";
  const token = cleanText(
    process.env.TWILIO_WEBHOOK_SECRET ||
      process.env.AUTOMATION_API_SECRET ||
      process.env.CRON_SECRET ||
      process.env.KIWIFY_WEBHOOK_SECRET
  );
  const query = token ? `?token=${encodeURIComponent(token)}` : "";

  return `${siteUrl.replace(/\/+$/, "")}/api/twilio/webhook${query}`;
}

async function twilioJson(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const text = await response.text();
  let payload: JsonObject = {};

  try {
    payload = text ? (JSON.parse(text) as JsonObject) : {};
  } catch {
    payload = { raw: text };
  }

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

async function configureWhatsAppSender(targetUrl: string) {
  const config = twilioConfig();
  const senderDigits = onlyDigits(process.env.TWILIO_WHATSAPP_FROM);
  const senderId = senderDigits ? `whatsapp:+${senderDigits}` : "";
  const listUrl = `${config.messagingBaseUrl}/v2/Channels/Senders?${new URLSearchParams({
    Channel: "whatsapp",
    PageSize: "100",
  })}`;
  const list = await twilioJson(listUrl, {
    headers: { authorization: config.authorization },
  });

  if (!list.ok) {
    return { ...list, ok: false, step: "list_senders" };
  }

  const senders = Array.isArray(list.payload.senders) ? list.payload.senders : [];
  const sender = senders
    .map((item) => (item && typeof item === "object" ? (item as JsonObject) : {}))
    .find((item) => cleanText(item.sender_id) === senderId);

  if (!sender) {
    return {
      ok: false,
      step: "sender_not_found",
      sender_id: senderId,
      available_senders: senders.map((item) => {
        const row = item && typeof item === "object" ? (item as JsonObject) : {};

        return { sid: cleanText(row.sid), sender_id: cleanText(row.sender_id) };
      }),
    };
  }

  const sid = cleanText(sender.sid);
  const update = await twilioJson(`${config.messagingBaseUrl}/v2/Channels/Senders/${sid}`, {
    method: "POST",
    headers: {
      authorization: config.authorization,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      webhook: {
        callback_url: targetUrl,
        callback_method: "POST",
        fallback_url: targetUrl,
        fallback_method: "POST",
      },
    }),
  });

  return {
    ok: update.ok,
    step: "update_sender",
    sender_sid: sid,
    sender_id: senderId,
    status: update.status,
    payload: update.payload,
  };
}

async function configureIncomingPhoneNumber(targetUrl: string) {
  const config = twilioConfig();
  const senderDigits = onlyDigits(process.env.TWILIO_WHATSAPP_FROM);

  if (!senderDigits) {
    return { ok: false, step: "phone_missing" };
  }

  const listUrl = `${config.apiBaseUrl.replace(/\/+$/, "")}/2010-04-01/Accounts/${
    config.accountSid
  }/IncomingPhoneNumbers.json?${new URLSearchParams({
    PhoneNumber: `+${senderDigits}`,
    PageSize: "20",
  })}`;
  const list = await twilioJson(listUrl, {
    headers: { authorization: config.authorization },
  });

  if (!list.ok) {
    return { ...list, ok: false, step: "list_phone_numbers" };
  }

  const numbers = Array.isArray(list.payload.incoming_phone_numbers)
    ? list.payload.incoming_phone_numbers
    : [];
  const phoneNumber = numbers
    .map((item) => (item && typeof item === "object" ? (item as JsonObject) : {}))
    .find((item) => onlyDigits(item.phone_number) === senderDigits);

  if (!phoneNumber) {
    return { ok: false, step: "phone_number_not_found", phone: `+${senderDigits}` };
  }

  const sid = cleanText(phoneNumber.sid);
  const params = new URLSearchParams({
    SmsUrl: targetUrl,
    SmsMethod: "POST",
    SmsFallbackUrl: targetUrl,
    SmsFallbackMethod: "POST",
  });
  const update = await twilioJson(
    `${config.apiBaseUrl.replace(/\/+$/, "")}/2010-04-01/Accounts/${
      config.accountSid
    }/IncomingPhoneNumbers/${sid}.json`,
    {
      method: "POST",
      headers: {
        authorization: config.authorization,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  return {
    ok: update.ok,
    step: "update_phone_number",
    phone_sid: sid,
    phone: `+${senderDigits}`,
    status: update.status,
  };
}

export async function POST(request: Request) {
  const authError = authorize(request);

  if (authError) {
    return authError;
  }

  const targetUrl = webhookUrl();

  try {
    const [sender, phoneNumber] = await Promise.all([
      configureWhatsAppSender(targetUrl),
      configureIncomingPhoneNumber(targetUrl),
    ]);

    return NextResponse.json({
      ok: Boolean(sender.ok || phoneNumber.ok),
      checked_at: new Date().toISOString(),
      webhook_url_configured: targetUrl.replace(/token=[^&]+/, "token=***"),
      sender,
      phone_number: phoneNumber,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        checked_at: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Erro desconhecido.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
