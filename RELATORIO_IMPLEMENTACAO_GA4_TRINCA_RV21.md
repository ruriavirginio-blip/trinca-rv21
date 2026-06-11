# RELATORIO DE IMPLEMENTACAO - GOOGLE ANALYTICS 4

Data: 10/06/2026  
Projeto: TRINCA RV21

## Objetivo

Instalar o Google Analytics 4 no projeto TRINCA RV21 com carregamento condicional, rastreamento automatico de page views e eventos principais de conversao alinhados ao Meta Pixel.

## Arquivos criados

- `src/components/GoogleAnalytics.tsx`
- `src/lib/google-analytics.ts`
- `RELATORIO_IMPLEMENTACAO_GA4_TRINCA_RV21.md`

## Arquivos modificados

- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/app/bio/page.tsx`
- `src/app/obrigado/page.tsx`
- `.env.local`
- `.env.example`

## Variavel de ambiente adicionada

```env
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
```

Tambem precisa ser adicionada no painel da Vercel quando o ID do GA4 estiver disponivel.

## Componente global criado

Arquivo: `src/components/GoogleAnalytics.tsx`

Responsabilidades:

- Carrega `gtag.js` com `next/script`.
- Usa `strategy="afterInteractive"`.
- Inicializa o GA4 com `NEXT_PUBLIC_GA4_MEASUREMENT_ID`.
- Desativa page view automatico do `gtag config` com `send_page_view: false`.
- Dispara `page_view` manualmente em cada mudanca de rota.
- Renderiza `null` quando a variavel de ambiente nao existe.

Codigo:

```tsx
"use client";

import Script from "next/script";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!measurementId || typeof window === "undefined" || !window.gtag) {
      return;
    }

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function GoogleAnalytics() {
  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', '${measurementId}', { send_page_view: false });
          `,
        }}
      />

      <Suspense fallback={null}>
        <GoogleAnalyticsPageView />
      </Suspense>
    </>
  );
}
```

## Biblioteca de tracking criada

Arquivo: `src/lib/google-analytics.ts`

Eventos exportados:

- `gaTrackEvent(eventName, params)`
- `gaTrackLead(params)`
- `gaTrackBeginCheckout(params)`
- `gaTrackPurchase(params)`

Codigo:

```ts
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
```

## Integracao no layout

Arquivo: `src/app/layout.tsx`

Foi importado e renderizado ao lado do Meta Pixel:

```tsx
import GoogleAnalytics from "@/components/GoogleAnalytics";
import MetaPixel from "@/components/MetaPixel";

<body className="min-h-full flex flex-col">
  <GoogleAnalytics />
  <MetaPixel />
  {children}
</body>
```

## Eventos integrados

### Landing principal - `src/app/page.tsx`

Eventos GA4 adicionados:

- `view_item` no carregamento da landing.
- `scroll_depth` quando a lead atinge 25%, 50%, 75% e 90% da pagina.
- `form_start` no primeiro foco no formulario.
- `generate_lead` quando o formulario e submetido.
- `begin_checkout` antes do redirecionamento para a Kiwify.

### Pagina bio - `src/app/bio/page.tsx`

Evento GA4 adicionado:

- `view_item` com origem `instagram`.

### Pagina obrigado - `src/app/obrigado/page.tsx`

Eventos GA4 adicionados:

- `view_item` para a pagina pos-compra.
- `purchase` com valor `37.89`, moeda `BRL` e item `trinca-rv21`.

## Observacoes importantes

- O GA4 nao envia nada enquanto `NEXT_PUBLIC_GA4_MEASUREMENT_ID` estiver vazio.
- As chamadas estao protegidas por `try/catch` dentro da biblioteca.
- Se GA4 falhar ou estiver indisponivel, o formulario, checkout, Kiwify e Twilio nao quebram.
- O evento `purchase` server-side pelo webhook Kiwify ainda esta no Meta CAPI. Para GA4 server-side/Measurement Protocol, seria uma etapa futura separada, exigindo `api_secret` do GA4.

## Verificacao

- `npm run lint`: aprovado.
- `npm run build`: aprovado.

Observacao: o primeiro build dentro do sandbox local falhou por bloqueio do Turbopack ao criar processo interno/bind de porta. O build foi repetido fora do sandbox e passou normalmente.

## Proximo passo

Criar no Vercel:

```env
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

Depois publicar novo deploy e testar no DebugView do GA4.
