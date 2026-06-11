"use client";

type GaEventParams = Record<string, unknown>;

type GtagFunction = (
  command: "event" | "config" | "js",
  targetIdOrEventName: string | Date,
  params?: GaEventParams,
) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: GtagFunction;
  }
}

const PRODUCT_VALUE = 37.89;
const CURRENCY = "BRL";
const PRODUCT_ID = "trinca-rv21";
const PRODUCT_NAME = "TRINCA RV21";

function hasGa4() {
  return Boolean(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID);
}

function defaultItem() {
  return {
    item_id: PRODUCT_ID,
    item_name: PRODUCT_NAME,
    item_category: "desafio_fitness",
    price: PRODUCT_VALUE,
    quantity: 1,
  };
}

export function gaTrackEvent(eventName: string, params: GaEventParams = {}) {
  try {
    if (!hasGa4() || typeof window === "undefined" || !window.gtag) {
      return { ok: false, reason: "GA4 indisponivel." };
    }

    window.gtag("event", eventName, params);

    return { ok: true };
  } catch (error) {
    console.error("Erro ao disparar evento GA4", error);

    return { ok: false, reason: "Erro no GA4." };
  }
}

export function gaTrackLead(params: GaEventParams = {}) {
  return gaTrackEvent("generate_lead", {
    currency: CURRENCY,
    value: PRODUCT_VALUE,
    items: [defaultItem()],
    ...params,
  });
}

export function gaTrackBeginCheckout(params: GaEventParams = {}) {
  return gaTrackEvent("begin_checkout", {
    currency: CURRENCY,
    value: PRODUCT_VALUE,
    items: [defaultItem()],
    ...params,
  });
}

export function gaTrackPurchase(params: GaEventParams = {}) {
  return gaTrackEvent("purchase", {
    transaction_id: `trinca-rv21-${Date.now()}`,
    currency: CURRENCY,
    value: PRODUCT_VALUE,
    items: [defaultItem()],
    ...params,
  });
}
