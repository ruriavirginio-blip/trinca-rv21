import { NextResponse } from "next/server";

/* ============================================================
   TESTE AO VIVO do funil — envia WhatsApp REAL via Twilio,
   mas NAO dispara conversao pro Meta/CAPI e marca como teste.
   Allowlist: so dispara para os 3 numeros de teste (anti-spam).
   GET /api/test-live?whatsapp=...&nome=...&objetivo=...
   ============================================================ */

export const dynamic = "force-dynamic";

// Apenas estes numeros podem receber teste (seguranca anti-spam).
const ALLOW = new Set(["5584988434282", "5584999390488", "5584998567078"]);

function digits(v: string) {
  return (v || "").replace(/\D/g, "");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const whatsapp = digits(url.searchParams.get("whatsapp") || "");
  const nome = (url.searchParams.get("nome") || "Lead Teste").trim();
  const objetivo = (url.searchParams.get("objetivo") || "emagrecimento-barriga").trim();

  if (!ALLOW.has(whatsapp)) {
    return NextResponse.json(
      { ok: false, error: "Numero nao permitido. Use um dos 3 numeros de teste." },
      { status: 403 },
    );
  }

  const origin = url.origin;
  const secret = (process.env.KIWIFY_WEBHOOK_SECRET || process.env.AUTOMATION_API_SECRET || "").trim();
  if (!secret) return NextResponse.json({ ok: false, error: "Segredo do webhook ausente." }, { status: 503 });

  const email = `teste-live-${whatsapp}@protocolorv.com.br`;
  const steps: Record<string, unknown>[] = [];

  // 1) Cria/atualiza o lead com o objetivo (define a dieta correta)
  const leadRes = await fetch(`${origin}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome,
      email,
      whatsapp,
      objetivo,
      origem: "teste-live",
      utm: "teste-live",
      status: "checkout-iniciado",
      etapaFunil: "checkout",
      data: new Date().toISOString(),
    }),
  });
  steps.push({ etapa: "criar_lead", http: leadRes.status, ok: leadRes.ok });

  // 2) Dispara o webhook em modo teste (compra aprovada) -> enfileira + envia Twilio real, sem CAPI
  const orderId = `TESTE-LIVE-${whatsapp}-${Date.now()}`;
  const hookRes = await fetch(`${origin}/api/kiwify/webhook?test_live=true&token=${encodeURIComponent(secret)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      webhook_event_type: "order.paid",
      order_status: "paid",
      order_id: orderId,
      payment_method: "credit_card",
      Customer: { full_name: nome, email, mobile: whatsapp },
      Product: { product_name: "TRINCA RV21" },
      Commissions: { charge_amount: 3789 },
      TrackingParameters: { source: "teste-live", utm_source: "teste", utm_medium: "teste", utm_campaign: "teste_live" },
    }),
  });
  const hookData = await hookRes.json().catch(() => ({}));
  steps.push({ etapa: "webhook_compra_aprovada_teste", http: hookRes.status, ok: hookRes.ok, dispatch: hookData?.immediateDispatch ?? null, capi: hookData?.metaCapiEvent ?? "pulado(teste)" });

  return NextResponse.json({
    ok: hookRes.ok,
    teste: { nome, whatsapp, objetivo, email, orderId },
    observacao: "Primeira mensagem deve chegar no WhatsApp. A sequencia avanca quando o lead clicar os botoes.",
    steps,
    webhook: hookData,
  });
}
