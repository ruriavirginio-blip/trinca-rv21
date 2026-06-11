import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  brazilianWhatsappVariants,
  cleanText,
  normalizeBrazilianWhatsapp,
  sameBrazilianWhatsapp,
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
      twilio_interactions: SupabaseTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

type AppSupabaseClient = SupabaseClient<Database>;

const INBOUND_ALIASES: Record<string, string> = {
  "estou pronta": "compra_confirmada_estou_pronta",
  "compra_confirmada_estou_pronta": "compra_confirmada_estou_pronta",
  "assistir boas vindas": "assistir_boas_vindas_grupo",
  "assistir boas-vindas": "assistir_boas_vindas_grupo",
  "assistir_boas_vindas_grupo": "assistir_boas_vindas_grupo",
};

const GATE_STAGE_BY_PAYLOAD: Record<string, string> = {
  compra_confirmada_estou_pronta: "clique-compra-confirmada-estou-pronta",
  assistir_boas_vindas_grupo: "clique-grupo-assistir-boas-vindas",
};

function readToken(request: Request) {
  const url = new URL(request.url);
  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.replace(/^Bearer\s+/i, "").trim();

  return [
    url.searchParams.get("token"),
    request.headers.get("x-automation-secret"),
    request.headers.get("x-cron-secret"),
    request.headers.get("x-token"),
    bearerToken,
  ]
    .map(cleanText)
    .filter(Boolean);
}

function authorizedSecrets() {
  return [
    process.env.AUTOMATION_API_SECRET,
    process.env.CRON_SECRET,
    process.env.TWILIO_WEBHOOK_SECRET,
    process.env.KIWIFY_WEBHOOK_SECRET,
  ]
    .map(cleanText)
    .filter(Boolean);
}

function authorize(request: Request) {
  const secrets = authorizedSecrets();

  if (!secrets.length) {
    return NextResponse.json(
      { error: "Token interno de automacao ainda nao configurado." },
      { status: 503 }
    );
  }

  const received = readToken(request);

  if (!received.some((token) => secrets.includes(token))) {
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

function normalizedBody(value: unknown) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inboundPayload(body: unknown) {
  return INBOUND_ALIASES[normalizedBody(body)] || "";
}

function twilioAuth() {
  const accountSid = cleanText(process.env.TWILIO_ACCOUNT_SID);
  const authToken = cleanText(process.env.TWILIO_AUTH_TOKEN);

  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN precisam estar configurados.");
  }

  return {
    accountSid,
    authToken,
    authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
    baseUrl: cleanText(process.env.TWILIO_BASE_URL) || "https://api.twilio.com",
  };
}

async function fetchTwilioMessages(params: URLSearchParams) {
  const config = twilioAuth();
  const response = await fetch(
    `${config.baseUrl.replace(/\/+$/, "")}/2010-04-01/Accounts/${
      config.accountSid
    }/Messages.json?${params}`,
    { headers: { authorization: config.authorization } }
  );
  const text = await response.text();
  let payload: JsonObject = {};

  try {
    payload = text ? (JSON.parse(text) as JsonObject) : {};
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    throw new Error(cleanText(payload.message) || `Twilio retornou HTTP ${response.status}.`);
  }

  return Array.isArray(payload.messages) ? payload.messages : [];
}

function filterActionableInbound(messages: unknown[], lookbackMinutes: number) {
  const since = Date.now() - lookbackMinutes * 60 * 1000;

  return messages
    .map((message) => (message && typeof message === "object" ? (message as JsonObject) : {}))
    .filter((message) => cleanText(message.direction).toLowerCase().includes("inbound"))
    .filter((message) => {
      const createdAt = cleanText(message.date_created || message.date_sent);
      const createdTime = createdAt ? new Date(createdAt).getTime() : Date.now();

      return createdTime >= since;
    })
    .filter((message) => Boolean(inboundPayload(message.body)));
}

async function fetchRecentMessages(lookbackMinutes: number) {
  return filterActionableInbound(
    await fetchTwilioMessages(new URLSearchParams({ PageSize: "50" })),
    lookbackMinutes
  );
}

async function waitingGatePhones(supabase: AppSupabaseClient) {
  const { data, error } = await supabase
    .from("automation_messages")
    .select("whatsapp")
    .eq("status", "aguardando-clique")
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return Array.from(
    new Set(
      (data || [])
        .map((row) => normalizeBrazilianWhatsapp((row as JsonObject).whatsapp))
        .filter(Boolean)
    )
  );
}

async function fetchMessagesForWaitingPhones(
  supabase: AppSupabaseClient,
  lookbackMinutes: number
) {
  const phones = await waitingGatePhones(supabase);
  const messages: JsonObject[] = [];

  for (const phone of phones) {
    const inbound: JsonObject[] = [];

    for (const phoneVariant of brazilianWhatsappVariants(phone)) {
      const params = new URLSearchParams({
        PageSize: "20",
        From: `whatsapp:+${phoneVariant}`,
      });

      inbound.push(
        ...filterActionableInbound(await fetchTwilioMessages(params), lookbackMinutes)
          .map((message) =>
            message && typeof message === "object" ? (message as JsonObject) : {}
          )
          .filter((message) => sameBrazilianWhatsapp(phone, message.from))
      );
    }

    messages.push(...inbound);
  }

  return messages;
}

async function alreadySynced(supabase: AppSupabaseClient, messageSid: string) {
  if (!messageSid) {
    return false;
  }

  const { data, error } = await supabase
    .from("twilio_interactions")
    .select("message_sid")
    .eq("message_sid", messageSid)
    .limit(1);
  const message = error?.message || "";

  if (error && !message.includes("twilio_interactions") && !message.includes("schema cache")) {
    throw new Error(error.message);
  }

  return Boolean(data?.length);
}

async function hasMatchingPendingGate(
  supabase: AppSupabaseClient,
  message: JsonObject,
  payload: string
) {
  const etapa = GATE_STAGE_BY_PAYLOAD[payload];
  const from = normalizeBrazilianWhatsapp(message.from);

  if (!etapa || !from) {
    return false;
  }

  const { data, error } = await supabase
    .from("automation_messages")
    .select("whatsapp")
    .eq("etapa", etapa)
    .eq("status", "aguardando-clique")
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).some((row) => sameBrazilianWhatsapp((row as JsonObject).whatsapp, from));
}

function originFromRequest(request: Request) {
  const url = new URL(request.url);

  return url.origin;
}

function webhookToken() {
  return cleanText(
    process.env.TWILIO_WEBHOOK_SECRET ||
      process.env.AUTOMATION_API_SECRET ||
      process.env.CRON_SECRET ||
      process.env.KIWIFY_WEBHOOK_SECRET
  );
}

async function forwardInboundToWebhook(
  request: Request,
  message: JsonObject,
  payload: string
) {
  const token = webhookToken();
  const origin = originFromRequest(request);
  const separator = token ? `?token=${encodeURIComponent(token)}` : "";
  const from = cleanText(message.from);
  const phone = normalizeBrazilianWhatsapp(from);
  const body = cleanText(message.body);
  const sid = cleanText(message.sid);
  const response = await fetch(`${origin}/api/twilio/webhook${separator}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      WaId: phone,
      From: from,
      Body: body,
      ButtonPayload: payload,
      ButtonText: body,
      MessageSid: sid,
    }),
  });
  const text = await response.text();
  let result: JsonObject = {};

  try {
    result = text ? (JSON.parse(text) as JsonObject) : {};
  } catch {
    result = { raw: text };
  }

  return {
    ok: response.ok,
    status: response.status,
    payload: result,
  };
}

export async function GET(request: Request) {
  return POST(request);
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
  const rawLookback = Number(url.searchParams.get("lookback_minutes") || 240);
  const lookbackMinutes = Number.isFinite(rawLookback)
    ? Math.min(Math.max(rawLookback, 5), 1440)
    : 240;
  const dryRun = url.searchParams.get("dry_run") === "true";

  try {
    const waitingPhones = await waitingGatePhones(supabase);
    const [recentMessages, waitingPhoneMessages] = await Promise.all([
      fetchRecentMessages(lookbackMinutes),
      fetchMessagesForWaitingPhones(supabase, lookbackMinutes),
    ]);
    const inboundMessages = Array.from(
      new Map(
        [...recentMessages, ...waitingPhoneMessages].map((message) => [
          cleanText(message.sid) || `${cleanText(message.from)}:${cleanText(message.body)}`,
          message,
        ])
      ).values()
    ).filter((message) =>
      waitingPhones.some((phone) => sameBrazilianWhatsapp(phone, message.from))
    );
    const processed = [];
    const skipped = [];

    for (const message of inboundMessages) {
      const sid = cleanText(message.sid);
      const payload = inboundPayload(message.body);

      if (
        (await alreadySynced(supabase, sid)) &&
        !(await hasMatchingPendingGate(supabase, message, payload))
      ) {
        skipped.push({ sid, reason: "already_synced", body: cleanText(message.body) });
        continue;
      }

      if (dryRun) {
        processed.push({
          sid,
          dry_run: true,
          from: cleanText(message.from),
          to: cleanText(message.to),
          body: cleanText(message.body),
          payload,
        });
        continue;
      }

      const result = await forwardInboundToWebhook(request, message, payload);

      processed.push({
        sid,
        from: cleanText(message.from),
        to: cleanText(message.to),
        body: cleanText(message.body),
        payload,
        webhook: result,
      });
    }

    return NextResponse.json({
      ok: processed.every((item) => {
        const webhook = (item as JsonObject).webhook as JsonObject | undefined;

        return !webhook || webhook.ok !== false;
      }),
      checked_at: new Date().toISOString(),
      lookback_minutes: lookbackMinutes,
      checked_waiting_phones: waitingPhones,
      found: inboundMessages.length,
      processed,
      skipped,
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
