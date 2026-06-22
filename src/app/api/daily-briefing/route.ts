import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { planByDate } from "@/app/cockpit/contentPlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* Briefing diário do aquecimento TRINCA RV21 — enviado no Telegram do Ruriá às 04h.
   Acionado por cron-job.org (timezone America/Fortaleza). Monta o checklist do dia
   a partir do plano (contentPlan.ts): bom dia em selfie, stories orgânicos, criativos,
   tráfego e checklist. GET ou POST (token-guarded). */

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function todayFortaleza(): string {
  // YYYY-MM-DD no fuso de Fortaleza (UTC-3, sem horário de verão)
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function authorized(request: Request) {
  const url = new URL(request.url);
  const provided = [
    url.searchParams.get("token"),
    request.headers.get("x-automation-secret"),
    (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim(),
  ].map(clean);
  const valid = [
    process.env.MONITOR_TOKEN,
    process.env.AUTOMATION_API_SECRET,
    process.env.KIWIFY_WEBHOOK_SECRET,
  ].map(clean).filter(Boolean);
  if (!valid.length) return false;
  return provided.some((t) => t && valid.includes(t));
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Token invalido." }, { status: 401 });
  }

  const url = new URL(request.url);
  const dateOverride = clean(url.searchParams.get("date"));
  const iso = dateOverride || todayFortaleza();
  const plan = planByDate(iso);

  if (!plan) {
    // Fora do aquecimento (ou data sem plano): aviso curto e neutro.
    await sendTelegramMessage(
      `☀️ Bom dia! Hoje (${iso}) não tem dia de aquecimento programado no plano. Se quiser, me chama que a gente ajusta a agenda.`,
    );
    return NextResponse.json({ ok: true, date: iso, plan: null });
  }

  const linhas: string[] = [];
  linhas.push(`☀️ *BOM DIA, RURIÁ — ${plan.id.toUpperCase()} · ${plan.data}*`);
  linhas.push("");
  linhas.push(`🎯 *Ênfase de hoje:* ${plan.enfase}`);
  linhas.push("");
  linhas.push("*📱 Stories orgânicos (selfie, comece 04:30):*");
  linhas.push(`_Bom dia:_ ${plan.organico.bomDia}`);
  plan.organico.roteiro.forEach((s) => linhas.push(`• ${s}`));
  linhas.push(`_(${plan.organico.qtd})_`);
  linhas.push("");
  linhas.push(`📣 *Tráfego:* ${plan.trafego}`);
  linhas.push("");
  linhas.push("*✅ CHECKLIST DE HOJE:*");
  plan.checklist.forEach((s, i) => linhas.push(`${i + 1}. ${s}`));
  linhas.push("");
  linhas.push("Os criativos (cards/reels) estão na aba *Conteúdo › Conteúdos por dia* do cockpit. Bora! 👊");

  const res = await sendTelegramMessage(linhas.join("\n"));
  return NextResponse.json({ ok: true, date: iso, plan: plan.id, telegram: res });
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
