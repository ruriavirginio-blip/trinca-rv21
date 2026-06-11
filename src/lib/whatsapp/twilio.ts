import { cleanText, normalizeBrazilianWhatsapp, onlyDigits } from "./phone";

type JsonObject = Record<string, unknown>;

type TwilioConfig = {
  accountSid: string;
  authToken: string;
  baseUrl: string;
  from: string;
  messagingServiceSid: string;
  sendMode: "text" | "content";
  sendMedia: boolean;
};

type TwilioMessage = {
  id: string;
  whatsapp: unknown;
  mensagem: unknown;
  etapa: unknown;
  metadata: unknown;
};

type TwilioSendResult = {
  ok: boolean;
  status: number;
  provider: "twilio";
  mode: "text" | "content";
  messageIds: string[];
  responses: unknown[];
};

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(cleanText).filter(Boolean) : [];
}

function readConfig(): TwilioConfig {
  const rawMode = cleanText(process.env.TWILIO_SEND_MODE).toLowerCase();

  return {
    accountSid: cleanText(process.env.TWILIO_ACCOUNT_SID),
    authToken: cleanText(process.env.TWILIO_AUTH_TOKEN),
    baseUrl: cleanText(process.env.TWILIO_BASE_URL) || "https://api.twilio.com",
    from: cleanText(process.env.TWILIO_WHATSAPP_FROM),
    messagingServiceSid: cleanText(process.env.TWILIO_MESSAGING_SERVICE_SID),
    sendMode: rawMode === "text" ? "text" : "content",
    sendMedia: cleanText(process.env.TWILIO_SEND_MEDIA).toLowerCase() === "true",
  };
}

function stepEnvName(step: unknown) {
  return `TWILIO_CONTENT_SID_${cleanText(step)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")}`;
}

function twilioContentSid(message: TwilioMessage) {
  const metadata = asObject(message.metadata);
  const whatsappApi = asObject(metadata.whatsapp_api);
  const fromMetadata = cleanText(whatsappApi.twilio_content_sid);
  const fromStepEnv = cleanText(process.env[stepEnvName(message.etapa)]);
  const fallback = cleanText(process.env.TWILIO_DEFAULT_CONTENT_SID);

  return fromMetadata || fromStepEnv || fallback;
}

function contentVariables(message: TwilioMessage) {
  const metadata = asObject(message.metadata);
  const whatsappApi = asObject(metadata.whatsapp_api);
  const variables = asObject(whatsappApi.body_variables);
  const rawOrder = whatsappApi.body_variable_order;

  if (Array.isArray(rawOrder) && rawOrder.length === 0) {
    return {};
  }

  const explicitOrder = asStringArray(whatsappApi.body_variable_order);
  const order = explicitOrder.length ? explicitOrder : ["nome", "metodo_pagamento", "produto"];
  const entries = order
    .map((key, index) => [String(index + 1), cleanText(variables[key])] as const)
    .filter(([, value]) => Boolean(value));

  return Object.fromEntries(entries);
}

function twilioTo(value: unknown) {
  const digits = normalizeBrazilianWhatsapp(value);

  if (!digits) {
    return "";
  }

  return `whatsapp:+${digits}`;
}

function twilioFrom(value: unknown) {
  const digits = onlyDigits(value);

  if (!digits) {
    return "";
  }

  return `whatsapp:+${digits}`;
}

function baseParams(config: TwilioConfig, to: string) {
  const params = new URLSearchParams();

  params.set("To", to);

  if (config.messagingServiceSid) {
    params.set("MessagingServiceSid", config.messagingServiceSid);
  } else {
    const from = twilioFrom(config.from);

    if (!from) {
      throw new Error(
        "Configure TWILIO_WHATSAPP_FROM ou TWILIO_MESSAGING_SERVICE_SID."
      );
    }

    params.set("From", from);
  }

  return params;
}

function textParams(config: TwilioConfig, to: string, body: string, mediaUrl?: string) {
  const params = baseParams(config, to);

  params.set("Body", body);

  if (mediaUrl) {
    params.append("MediaUrl", mediaUrl);
  }

  return params;
}

function isDirectMediaUrl(value: string) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    const pathname = url.pathname.toLowerCase();

    return /\.(mp4|mov|m4v|pdf|jpg|jpeg|png|webp|gif|mp3|m4a|aac)$/i.test(pathname);
  } catch {
    return false;
  }
}

function contentParams(config: TwilioConfig, to: string, message: TwilioMessage) {
  const params = baseParams(config, to);
  const contentSid = twilioContentSid(message);
  const variables = contentVariables(message);

  if (!contentSid) {
    throw new Error(
      `ContentSid Twilio ausente para a etapa ${cleanText(message.etapa) || "sem-etapa"}.`
    );
  }

  params.set("ContentSid", contentSid);

  if (Object.keys(variables).length) {
    params.set("ContentVariables", JSON.stringify(variables));
  }

  return params;
}

async function postTwilio(
  config: TwilioConfig,
  params: URLSearchParams
): Promise<{ status: number; body: unknown; messageIds: string[] }> {
  const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");
  const response = await fetch(
    `${config.baseUrl.replace(/\/+$/, "")}/2010-04-01/Accounts/${
      config.accountSid
    }/Messages.json`,
    {
      method: "POST",
      headers: {
        authorization: `Basic ${auth}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );
  const text = await response.text();
  let body: unknown = text;

  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  const data = asObject(body);
  const sid = cleanText(data.sid);

  if (!response.ok) {
    const message = cleanText(data.message) || cleanText(data.error_message) || text;
    throw new Error(message || `Twilio retornou HTTP ${response.status}.`);
  }

  return {
    status: response.status,
    body,
    messageIds: sid ? [sid] : [],
  };
}

export function isTwilioConfigured() {
  const config = readConfig();

  return Boolean(config.accountSid && config.authToken);
}

export async function sendTwilioMessage(message: TwilioMessage): Promise<TwilioSendResult> {
  const config = readConfig();
  const to = twilioTo(message.whatsapp);
  const text = cleanText(message.mensagem);
  const metadata = asObject(message.metadata);
  const assetUrl = cleanText(metadata.asset_url);
  const assetUrls = asStringArray(metadata.asset_urls);
  const mediaUrls = [...assetUrls, assetUrl]
    .map(cleanText)
    .filter((url, index, urls) => Boolean(url) && urls.indexOf(url) === index)
    .filter(isDirectMediaUrl);
  const shouldSendMedia = config.sendMedia && mediaUrls.length > 0;

  if (!config.accountSid || !config.authToken) {
    throw new Error("TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN ainda nao configurados.");
  }

  if (!to) {
    throw new Error("WhatsApp da lead ausente ou invalido.");
  }

  if (!text && config.sendMode === "text") {
    throw new Error("Mensagem vazia para envio por texto.");
  }

  const responses: unknown[] = [];
  const messageIds: string[] = [];
  const params =
    config.sendMode === "content"
      ? contentParams(config, to, message)
      : textParams(config, to, text, shouldSendMedia ? mediaUrls[0] : "");
  const primary = await postTwilio(config, params);

  responses.push(primary.body);
  messageIds.push(...primary.messageIds);

  if (config.sendMode === "content" && shouldSendMedia) {
    for (const [index, mediaUrl] of mediaUrls.entries()) {
      const caption = cleanText(message.etapa).includes("video")
        ? "Video oficial do TRINCA RV21"
        : index === 0
          ? "Material oficial do TRINCA RV21"
          : `Material oficial do TRINCA RV21 (${index + 1})`;
      const media = await postTwilio(config, textParams(config, to, caption, mediaUrl));

      responses.push(media.body);
      messageIds.push(...media.messageIds);
    }
  }

  return {
    ok: true,
    status: primary.status,
    provider: "twilio",
    mode: config.sendMode,
    messageIds,
    responses,
  };
}
