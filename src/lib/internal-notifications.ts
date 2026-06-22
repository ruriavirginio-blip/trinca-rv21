import { createClient } from "@supabase/supabase-js";
import { cleanText, normalizeBrazilianWhatsapp, onlyDigits } from "@/lib/whatsapp/phone";
import { sendTelegramMessage, type InlineButton } from "@/lib/telegram";

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
      internal_notifications: SupabaseTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

type NotificationInput = {
  type: "video_ready" | "sale_confirmed" | "lead_milestone" | "critical_alert";
  dedupeKey: string;
  message: string;
  /** Botões inline pro Telegram (ex: "Resolver problema"). Opcional. */
  telegramButtons?: InlineButton[][];
  /** Texto alternativo pro Telegram (Markdown). Se ausente, usa `message`. */
  telegramMessage?: string;
};

const ruriaWhatsapp = "5584999390488";

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function readTwilioConfig() {
  const rawMode = cleanText(process.env.TWILIO_SEND_MODE).toLowerCase();

  return {
    accountSid: cleanText(process.env.TWILIO_ACCOUNT_SID),
    authToken: cleanText(process.env.TWILIO_AUTH_TOKEN),
    baseUrl: cleanText(process.env.TWILIO_BASE_URL) || "https://api.twilio.com",
    from: cleanText(process.env.TWILIO_WHATSAPP_FROM),
    messagingServiceSid: cleanText(process.env.TWILIO_MESSAGING_SERVICE_SID),
    sendMode: rawMode === "text" ? "text" : "content",
    contentSid: cleanText(process.env.TWILIO_CONTENT_SID_NOTIFICACAO_INTERNA_RURIA),
  };
}

function getSupabaseClient() {
  const supabaseUrl = cleanText(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseServiceRoleKey = cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
}

function twilioFrom(value: unknown) {
  const digits = onlyDigits(value);

  return digits ? `whatsapp:+${digits}` : "";
}

function baseTwilioParams(config: ReturnType<typeof readTwilioConfig>) {
  const toDigits = normalizeBrazilianWhatsapp(ruriaWhatsapp);
  const params = new URLSearchParams();

  params.set("To", `whatsapp:+${toDigits}`);

  if (config.messagingServiceSid) {
    params.set("MessagingServiceSid", config.messagingServiceSid);
  } else {
    const from = twilioFrom(config.from);

    if (!from) {
      throw new Error("Configure TWILIO_WHATSAPP_FROM ou TWILIO_MESSAGING_SERVICE_SID.");
    }

    params.set("From", from);
  }

  return params;
}

async function sendInternalTwilioMessage(message: string) {
  const config = readTwilioConfig();

  if (!config.accountSid || !config.authToken) {
    throw new Error("TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN ainda nao configurados.");
  }

  const params = baseTwilioParams(config);

  if (config.sendMode === "content") {
    if (!config.contentSid) {
      throw new Error("Configure TWILIO_CONTENT_SID_NOTIFICACAO_INTERNA_RURIA.");
    }

    params.set("ContentSid", config.contentSid);
    params.set("ContentVariables", JSON.stringify({ "1": message }));
  } else {
    params.set("Body", message);
  }

  const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");
  const response = await fetch(
    `${config.baseUrl.replace(/\/+$/, "")}/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        authorization: `Basic ${auth}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );
  const text = await response.text();
  let body: unknown = text;

  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    const object = asObject(body);
    throw new Error(cleanText(object.message) || `Twilio retornou HTTP ${response.status}.`);
  }

  return body;
}

export async function sendInternalRuriaNotification(input: NotificationInput) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { ok: false, skipped: true, reason: "Supabase server credentials ausentes." };
  }

  const notification = {
    type: input.type,
    dedupe_key: input.dedupeKey,
    recipient_whatsapp: ruriaWhatsapp,
    message: input.message,
    status: "pending",
    provider: "twilio",
  };
  const { data: inserted, error: insertError } = await supabase
    .from("internal_notifications")
    .insert(notification)
    .select("id")
    .maybeSingle();

  if (insertError) {
    const message = insertError.message || "";

    if (message.includes("duplicate") || message.includes("unique")) {
      return { ok: true, skipped: true, reason: "Notificacao ja enviada para este gatilho." };
    }

    if (message.includes("internal_notifications") || message.includes("schema cache")) {
      return { ok: false, skipped: true, reason: "Tabela internal_notifications ainda nao existe." };
    }

    throw insertError;
  }

  const id = cleanText(inserted?.id);

  // Telegram — canal principal de alerta (funciona com o Mac do Ruriá desligado).
  // Best-effort: não derruba o fluxo se falhar. Dedupe já garantido acima.
  try {
    await sendTelegramMessage(
      input.telegramMessage || input.message,
      undefined,
      input.telegramButtons?.length ? { buttons: input.telegramButtons } : undefined,
    );
  } catch {
    /* Telegram é best-effort */
  }

  try {
    const providerResponse = await sendInternalTwilioMessage(input.message);

    await supabase
      .from("internal_notifications")
      .update({
        status: "sent",
        provider_response: providerResponse,
        sent_at: new Date().toISOString(),
      })
      .eq("id", id);

    return { ok: true, skipped: false };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao enviar Twilio.";

    await supabase
      .from("internal_notifications")
      .update({
        status: "error",
        error_message: errorMessage,
      })
      .eq("id", id);

    return { ok: false, skipped: false, reason: errorMessage };
  }
}

export function cockpitUrl() {
  return "protocolorv.com.br/cockpit";
}
