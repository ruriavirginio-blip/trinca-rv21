import { NextResponse } from "next/server";

/* Dispara o testador oficial de fluxo (flow-test) em modo seguro (dry-run,
   auto-limpeza). Usa o segredo server-side para autenticar. Diagnóstico do
   pipeline operacional: confirma as 8 etapas, gates e dieta por objetivo. */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = (process.env.AUTOMATION_API_SECRET || process.env.KIWIFY_WEBHOOK_SECRET || "").trim();
  if (!secret) {
    return NextResponse.json({ ok: false, error: "AUTOMATION_API_SECRET/KIWIFY_WEBHOOK_SECRET ausente." }, { status: 503 });
  }
  const origin = new URL(request.url).origin;
  try {
    const r = await fetch(`${origin}/api/automation/flow-test?token=${encodeURIComponent(secret)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
