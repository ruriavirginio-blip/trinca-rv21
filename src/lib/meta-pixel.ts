"use client";

type MetaEventData = Record<string, unknown>;

type FbqFunction = (
  command: "track" | "trackCustom",
  eventName: string,
  data?: MetaEventData,
  options?: { eventID?: string },
) => void;

declare global {
  interface Window {
    fbq?: FbqFunction;
  }
}

const PRODUCT_VALUE = 37.89;
const CURRENCY = "BRL";
const PRODUCT_ID = "trinca-rv21";

function hasPixel() {
  return Boolean(process.env.NEXT_PUBLIC_META_PIXEL_ID);
}

export function createMetaEventId(eventName: string) {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  return `${eventName.toLowerCase()}-${Date.now()}-${random}`;
}

function sendBrowserEvent(
  type: "track" | "trackCustom",
  eventName: string,
  data: MetaEventData = {},
) {
  const eventId = String(data.event_id || createMetaEventId(eventName));
  const payload = {
    ...data,
    event_id: eventId,
  };

  try {
    if (!hasPixel() || typeof window === "undefined" || !window.fbq) {
      return { ok: false, event_id: eventId, reason: "Meta Pixel indisponivel." };
    }

    window.fbq(type, eventName, payload, { eventID: eventId });

    return { ok: true, event_id: eventId };
  } catch (error) {
    console.error("Erro ao disparar evento Meta Pixel", error);

    return { ok: false, event_id: eventId, reason: "Erro no Meta Pixel." };
  }
}

export function trackLead(data: MetaEventData = {}) {
  return sendBrowserEvent("track", "Lead", {
    content_name: "TRINCA RV21 - formulario landing",
    content_category: "lead_capture",
    value: PRODUCT_VALUE,
    currency: CURRENCY,
    content_ids: [PRODUCT_ID],
    ...data,
  });
}

export function trackInitiateCheckout(data: MetaEventData = {}) {
  return sendBrowserEvent("track", "InitiateCheckout", {
    value: PRODUCT_VALUE,
    currency: CURRENCY,
    content_ids: [PRODUCT_ID],
    content_type: "product",
    ...data,
  });
}

export function trackPurchase(data: MetaEventData = {}) {
  return sendBrowserEvent("track", "Purchase", {
    value: PRODUCT_VALUE,
    currency: CURRENCY,
    content_type: "product",
    content_ids: [PRODUCT_ID],
    ...data,
  });
}

export function trackViewContent(data: MetaEventData = {}) {
  return sendBrowserEvent("track", "ViewContent", {
    content_name: "TRINCA RV21",
    content_category: "landing_page",
    content_ids: [PRODUCT_ID],
    content_type: "product",
    ...data,
  });
}

export function trackCustomEvent(eventName: string, data: MetaEventData = {}) {
  return sendBrowserEvent("trackCustom", eventName, data);
}
