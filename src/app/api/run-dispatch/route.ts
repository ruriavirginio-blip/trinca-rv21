import { NextResponse } from "next/server";

/* Aciona o dispatch da automação (envia mensagens DEVIDAS via Twilio).
   Este é o endpoint que um gatilho recorrente (Make/cron a cada ~1 min)
   deve chamar para o motor enviar as mensagens com delay de tempo. */

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = (process.env.AUTOMATION_API_SECRET || process.env.KIWIFY_WEBHOOK_SECRET || "").trim();
  if (!secret) return NextResponse.json({ ok: false, error: "Segredo ausente." }, { status: 503 });
  const origin = new URL(request.url).origin;
  try {
    const r = await fetch(`${origin}/api/automation/dispatch?limit=20&token=${encodeURIComponent(secret)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { status: r.status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
