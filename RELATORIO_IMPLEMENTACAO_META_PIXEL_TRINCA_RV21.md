# RELATORIO DE IMPLEMENTACAO - META PIXEL + CAPI

Data: 10/06/2026  
Projeto: TRINCA RV21

## Arquivos criados

- `src/components/MetaPixel.tsx`
- `src/lib/meta-pixel.ts`
- `src/lib/meta-capi.ts`
- `RELATORIO_IMPLEMENTACAO_META_PIXEL_TRINCA_RV21.md`

## Arquivos modificados

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/bio/page.tsx`
- `src/app/obrigado/page.tsx`
- `src/app/api/kiwify/webhook/route.ts`
- `.env.local`
- `.env.example`

## Verificacao executada

- `npm run lint`: passou.
- `npm run build`: passou apos rodar fora do sandbox local, porque o Turbopack precisou criar processo interno.

## Confirmacoes tecnicas

- O Meta Pixel so carrega se `NEXT_PUBLIC_META_PIXEL_ID` existir.
- O `PageView` e disparado automaticamente em cada navegacao do App Router.
- Os eventos de browser usam `event_id` no payload e `eventID` nas opcoes do `fbq`, preparando deduplicacao.
- A CAPI esta pronta, mas nao bloqueia o fluxo se `META_CAPI_ACCESS_TOKEN` ainda nao existir.
- Email e telefone sao hasheados com SHA256 antes do envio server-side.
- O webhook Kiwify envolve a CAPI em `try/catch`, sem quebrar pagamento, Supabase ou Twilio se a Meta falhar.

## Variaveis adicionadas

Em `.env.local` e `.env.example`:

```env
NEXT_PUBLIC_META_PIXEL_ID=
META_CAPI_ACCESS_TOKEN=
```

Essas mesmas variaveis ainda precisam ser criadas no painel da Vercel quando o Pixel ID e o token CAPI forem definidos.

## Codigo criado - `src/components/MetaPixel.tsx`

```tsx
"use client";

import Script from "next/script";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createMetaEventId } from "@/lib/meta-pixel";

const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function MetaPixelPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pixelId || typeof window === "undefined" || !window.fbq) {
      return;
    }

    const eventId = createMetaEventId("PageView");

    window.fbq(
      "track",
      "PageView",
      {
        event_id: eventId,
        page_path: pathname,
        page_search: searchParams.toString(),
      },
      { eventID: eventId },
    );
  }, [pathname, searchParams]);

  return null;
}

export default function MetaPixel() {
  if (!pixelId) {
    return null;
  }

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
          `,
        }}
      />

      <Suspense fallback={null}>
        <MetaPixelPageView />
      </Suspense>

      <noscript>
        <img
          alt=""
          height="1"
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          style={{ display: "none" }}
          width="1"
        />
      </noscript>
    </>
  );
}
```

## Codigo criado - `src/lib/meta-pixel.ts`

```tsx
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
```

## Codigo criado - `src/lib/meta-capi.ts`

```ts
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
```

## Trechos modificados principais

### `src/app/layout.tsx`

```tsx
import MetaPixel from "@/components/MetaPixel";

<body className="min-h-full flex flex-col">
  <MetaPixel />
  {children}
</body>
```

### `src/app/page.tsx`

Eventos adicionados:

```tsx
trackViewContent({ content_name: "TRINCA RV21 - landing principal" });
trackCustomEvent("ScrollDepth", { depth });
trackCustomEvent("FormStart", { content_name: "TRINCA RV21 - formulario landing" });
trackLead({ objective, objective_label, value: 37.89, currency: "BRL" });
trackInitiateCheckout({ value: 37.89, currency: "BRL", checkout_url: checkoutUrl });
```

### `src/app/bio/page.tsx`

```tsx
trackViewContent({
  content_name: "TRINCA RV21 - bio Instagram",
  content_category: "bio_page",
  source: "instagram",
});
```

### `src/app/obrigado/page.tsx`

```tsx
trackViewContent({ content_name: "TRINCA RV21 - obrigado" });
trackPurchase({
  value: 37.89,
  currency: "BRL",
  content_type: "product",
  content_ids: ["trinca-rv21"],
});
```

### `src/app/api/kiwify/webhook/route.ts`

```ts
if (status === "compra-aprovada") {
  const metaEventId = createServerEventId("Purchase", orderId || email);

  try {
    metaCapiEvent = await sendServerEvent(
      "Purchase",
      { email, phone: whatsapp },
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
  }
}
```
