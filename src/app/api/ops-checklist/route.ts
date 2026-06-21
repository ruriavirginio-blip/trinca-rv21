import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ============================================================
   AGENTE DE CHECKLIST OPERACIONAL — verifica cada etapa da
   operação TRINCA RV21 e diz o que está 100% e o que falta.
   GET /api/ops-checklist
   ============================================================ */

export const dynamic = "force-dynamic";

type Check = { etapa: string; item: string; status: "ok" | "falta" | "alerta"; detalhe: string };

function envOk(name: string) {
  return Boolean((process.env[name] || "").trim());
}

async function reachable(url: string): Promise<{ ok: boolean; code: number }> {
  try {
    const r = await fetch(url, { method: "GET", redirect: "manual" });
    return { ok: r.status >= 200 && r.status < 400, code: r.status };
  } catch {
    return { ok: false, code: 0 };
  }
}

export async function GET() {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL || "https://protocolorv.com.br").replace(/\/+$/, "");
  const checks: Check[] = [];
  const add = (etapa: string, item: string, ok: boolean, detalhe: string, alerta = false) =>
    checks.push({ etapa, item, status: ok ? "ok" : alerta ? "alerta" : "falta", detalhe });

  // 1) CAPTAÇÃO — landing + form + tracking
  const root = await reachable(`${origin}/`);
  add("1. Captacao", "Landing no ar (raiz)", root.ok, `HTTP ${root.code}`);
  add("1. Captacao", "Meta Pixel", envOk("NEXT_PUBLIC_META_PIXEL_ID"), envOk("NEXT_PUBLIC_META_PIXEL_ID") ? "configurado" : "faltando");
  add("1. Captacao", "GA4", envOk("NEXT_PUBLIC_GA4_MEASUREMENT_ID"), envOk("NEXT_PUBLIC_GA4_MEASUREMENT_ID") ? "configurado" : "faltando");
  add("1. Captacao", "CAPI (Conversions API)", envOk("META_CAPI_ACCESS_TOKEN"), envOk("META_CAPI_ACCESS_TOKEN") ? "token presente" : "faltando", true);

  // 2) BANCO — Supabase / leads
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let leadsTotal = -1;
  if (url && key) {
    try {
      const db = createClient(url, key, { auth: { persistSession: false } });
      const { count } = await db.from("leads").select("*", { count: "exact", head: true });
      leadsTotal = count ?? 0;
    } catch {
      leadsTotal = -1;
    }
  }
  add("2. Banco", "Supabase conectado", leadsTotal >= 0, leadsTotal >= 0 ? `${leadsTotal} leads` : "sem conexao");

  // 3) CHECKOUT — Kiwify
  add("3. Checkout", "URL Kiwify configurada", envOk("NEXT_PUBLIC_KIWIFY_CHECKOUT_URL"), envOk("NEXT_PUBLIC_KIWIFY_CHECKOUT_URL") ? "ok" : "faltando");
  add("3. Checkout", "Webhook secret Kiwify", envOk("KIWIFY_WEBHOOK_SECRET"), envOk("KIWIFY_WEBHOOK_SECRET") ? "ok" : "faltando");

  // 4) ENTREGA — materiais (dieta por objetivo)
  const dietas = ["dieta-emagrecimento", "dieta-gluteos-firmeza", "dieta-autoestima", "dieta-roupas-antigas"];
  const dietaResults = await Promise.all(dietas.map((d) => reachable(`${origin}/materials/${d}.pdf`)));
  const dietasOk = dietaResults.filter((r) => r.ok).length;
  add("4. Entrega", "PDFs de dieta", dietasOk === dietas.length, `${dietasOk}/${dietas.length} respondem`);
  add("4. Entrega", "WhatsApp (Twilio)", envOk("TWILIO_ACCOUNT_SID") && envOk("TWILIO_AUTH_TOKEN"), "credenciais Twilio");

  // 5) AUTOMACAO — Make
  add("5. Automacao", "Make: compra aprovada", envOk("MAKE_WEBHOOK_COMPRA_APROVADA"), envOk("MAKE_WEBHOOK_COMPRA_APROVADA") ? "webhook ok" : "faltando");

  // 6) COMANDO — Telegram + Claude
  add("6. Comando", "Telegram bot", envOk("TELEGRAM_BOT_TOKEN") && envOk("TELEGRAM_CHAT_ID"), "token + chat");
  add("6. Comando", "Claude (IA)", envOk("ANTHROPIC_API_KEY"), envOk("ANTHROPIC_API_KEY") ? "ok" : "faltando");
  const setup = await reachable(`${origin}/api/telegram/setup`);
  add("6. Comando", "Webhook Telegram ativo", setup.ok, `HTTP ${setup.code}`);

  // 7) CONTEUDO — fábrica + remotion
  add("7. Conteudo", "Remotion worker", envOk("REMOTION_WORKER_URL"), envOk("REMOTION_WORKER_URL") ? "configurado" : "FALTA worker de render", true);
  add("7. Conteudo", "Instagram publish", envOk("INSTAGRAM_ACCESS_TOKEN") || envOk("IG_ACCESS_TOKEN"), "token de publicacao", true);

  // 8) METRICAS — sync
  let metricasFresh = false;
  let metricasDetalhe = "sem dados";
  if (url && key) {
    try {
      const db = createClient(url, key, { auth: { persistSession: false } });
      const { data } = await db.from("project_status").select("metricas").eq("id", 1).single();
      const sinc = data?.metricas?.sincronizado_em;
      if (sinc) {
        const ageMin = (Date.now() - new Date(sinc).getTime()) / 60000;
        metricasFresh = ageMin < 60 * 26; // < 26h
        metricasDetalhe = `sincronizado ${Math.round(ageMin)} min atras`;
      }
    } catch {
      /* noop */
    }
  }
  add("8. Metricas", "Auto-sync de metricas", metricasFresh, metricasDetalhe, true);

  const total = checks.length;
  const ok = checks.filter((c) => c.status === "ok").length;
  const faltas = checks.filter((c) => c.status === "falta");
  const alertas = checks.filter((c) => c.status === "alerta");
  const pct = Math.round((ok / total) * 100);

  return NextResponse.json({
    ok: faltas.length === 0,
    resumo: `${ok}/${total} itens OK (${pct}%). ${faltas.length} falhas criticas, ${alertas.length} alertas.`,
    operacao_pronta_pct: pct,
    falhas_criticas: faltas.map((c) => `${c.etapa} · ${c.item}: ${c.detalhe}`),
    alertas: alertas.map((c) => `${c.etapa} · ${c.item}: ${c.detalhe}`),
    checklist: checks,
    gerado_em: new Date().toISOString(),
  });
}
