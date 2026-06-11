import { createHash, randomUUID } from "node:crypto";

type UserData = {
  email?: unknown;
  phone?: unknown;
  fbp?: unknown;
  fbc?: unknown;
  clientIpAddress?: unknown;
  clientUserAgent?: unknown;
};

type CustomData = Record<string, unknown> & {
  event_id?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function onlyDigits(value: unknown) {
  return cleanText(value).replace(/\D/g, "");
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(value: unknown) {
  return cleanText(value).toLowerCase();
}

function normalizePhone(value: unknown) {
  return onlyDigits(value);
}

function hashedUserData(userData: UserData) {
  const email = normalizeEmail(userData.email);
  const phone = normalizePhone(userData.phone);
  const fbp = cleanText(userData.fbp);
  const fbc = cleanText(userData.fbc);
  const clientIpAddress = cleanText(userData.clientIpAddress);
  const clientUserAgent = cleanText(userData.clientUserAgent);

  return {
    ...(email ? { em: [sha256(email)] } : {}),
    ...(phone ? { ph: [sha256(phone)] } : {}),
    ...(fbp ? { fbp } : {}),
    ...(fbc ? { fbc } : {}),
    ...(clientIpAddress ? { client_ip_address: clientIpAddress } : {}),
    ...(clientUserAgent ? { client_user_agent: clientUserAgent } : {}),
  };
}

export function createServerEventId(eventName: string, reference?: unknown) {
  const cleanReference = cleanText(reference);

  return [
    eventName.toLowerCase(),
    cleanReference || randomUUID(),
    Date.now().toString(),
  ].join("-");
}

export async function sendServerEvent(
  eventName: string,
  userData: UserData = {},
  customData: CustomData = {},
) {
  const pixelId = cleanText(process.env.NEXT_PUBLIC_META_PIXEL_ID);
  const accessToken = cleanText(process.env.META_CAPI_ACCESS_TOKEN);
  const eventId = cleanText(customData.event_id) || createServerEventId(eventName);

  if (!pixelId || !accessToken) {
    return {
      ok: false,
      skipped: true,
      event_id: eventId,
      reason: "Meta CAPI sem Pixel ID ou Access Token.",
    };
  }

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: "website",
        user_data: hashedUserData(userData),
        custom_data: {
          ...customData,
          event_id: eventId,
        },
      },
    ],
  };

  const response = await fetch(
    `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${encodeURIComponent(
      accessToken,
    )}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
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
    throw new Error(
      `Meta CAPI retornou HTTP ${response.status}: ${
        typeof body === "string" ? body : JSON.stringify(body)
      }`,
    );
  }

  return {
    ok: true,
    skipped: false,
    event_id: eventId,
    response: body,
  };
}
