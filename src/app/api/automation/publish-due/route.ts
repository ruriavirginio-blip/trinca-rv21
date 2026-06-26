import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { publishByType, hasInstagram } from "@/lib/instagram";
import { sendTelegramMessage } from "@/lib/telegram";

/* Motor 24/7 — publica os conteúdos AGENDADOS cujo horário (Brasília) chegou.
   Chamado por cron/GitHub Actions a cada X min com token.
   status 'agendado'|'aprovado' + asset + hora_post + data/hora <= agora(BRT) -> publica -> 'publicado'.
   ?debug=1 -> NÃO publica, só mostra o que a rota está vendo (diagnóstico). */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

/* Horário de Brasília à prova de runtime (sem slice de string de locale).
   Usa formatToParts, que é estável entre ICU/ambientes. */
function agoraBRT() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const g = (t: string) => parts.find((p) => p.type === t)?.value || "";
  let hh = g("hour");
  if (hh === "24") hh = "00"; // alguns ICU usam 24 p/ meia-noite
  const hoje = `${g("year")}-${g("month")}-${g("day")}`;
  const min = parseInt(hh, 10) * 60 + parseInt(g("minute"), 10);
  return { hoje, min, hora: `${hh}:${g("minute")}` };
}

function horaParaMin(hora_post: unknown): number {
  const m = String(hora_post).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return 24 * 60 + 1; // sem hora válida = futuro (não posta)
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

export async function POST(request: NextRequest) {
  const validSecrets = [process.env.AUTOMATION_API_SECRET, process.env.MONITOR_TOKEN].map(clean).filter(Boolean);
  const got = clean(request.headers.get("x-automation-secret")) || clean(request.nextUrl.searchParams.get("token"));
  if (validSecrets.length && !validSecrets.includes(got)) return NextResponse.json({ error: "Token invalido." }, { status: 401 });

  const debug = request.nextUrl.searchParams.get("debug") === "1";

  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false } });

  if (!hasInstagram() && !debug) {
    return NextResponse.json({ ok: true, published: 0, note: "Instagram ainda nao configurado (credenciais)." });
  }

  const { hoje, min: minAgora, hora: horaAgora } = agoraBRT();

  const { data: due, error } = await db
    .from("content_factory")
    .select("*")
    .in("status", ["agendado", "aprovado"])
    .not("asset_url", "is", null)
    .not("hora_post", "is", null)
    .lte("data_post", hoje);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const aPublicar = (due ?? []).filter(
    (c) =>
      c.tipo !== "story" &&
      (String(c.data_post) < hoje ||
        (String(c.data_post) === hoje && horaParaMin(c.hora_post) <= minAgora)),
  );

  // DEBUG: mostra exatamente o que a rota vê, sem publicar nada.
  if (debug) {
    return NextResponse.json({
      ok: true, debug: true, hoje, horaAgora, minAgora,
      dueCount: (due ?? []).length,
      due: (due ?? []).map((c) => ({ id: c.id, tipo: c.tipo, status: c.status, data_post: c.data_post, hora_post: c.hora_post, hora_min: horaParaMin(c.hora_post), tem_asset: !!c.asset_url })),
      aPublicarCount: aPublicar.length,
      aPublicar: aPublicar.map((c) => c.id),
    });
  }

  function parseLegenda(legenda: string | null | undefined) {
    const [cap, gal] = (legenda || "").split("---SLIDES---");
    const slides = (gal || "").split(/\s+/).map((s) => s.trim()).filter((s) => /^https?:\/\//.test(s));
    return { caption: (cap || "").trim(), slides };
  }

  const results: Array<{ id: string; ok: boolean; reason?: string }> = [];
  for (const c of aPublicar) {
    // Claim atômico contra disparo duplo (cron externo + GitHub Actions): agendado/aprovado -> publicando.
    const { data: claimed } = await db
      .from("content_factory")
      .update({ status: "publicando" })
      .eq("id", c.id)
      .in("status", ["agendado", "aprovado"])
      .select("id");
    if (!claimed || claimed.length === 0) continue;

    const { caption, slides } = parseLegenda(c.legenda);
    const asset = c.tipo === "carrossel" && slides.length > 1 ? slides.join(",") : c.asset_url;
    const res = await publishByType(c.tipo, asset, caption);
    if (res.ok) {
      await db.from("content_factory").update({
        status: "publicado", instagram_media_id: res.mediaId, publicado_em: new Date().toISOString(),
      }).eq("id", c.id);
      await sendTelegramMessage(`✅ Post publicado no Instagram: *${c.tema || c.roteiro_ref || c.tipo}* (${c.tipo}).`);
    } else {
      // volta pra 'aprovado' p/ tentar de novo no próximo ciclo (não morre em 'publicando')
      await db.from("content_factory").update({ status: "aprovado", erro_msg: res.reason }).eq("id", c.id);
      await sendTelegramMessage(`🛑 FALHA ao publicar *${c.tema || c.tipo}*: ${res.reason}. Vou tentar de novo no próximo ciclo.`);
    }
    results.push({ id: c.id, ok: res.ok, reason: res.reason });
  }

  // WATCHDOG: itens já vencidos (data/hora passou) que continuam parados = alerta (silêncio nunca mais).
  const atrasados = (due ?? []).filter(
    (c) => c.tipo !== "story" &&
      (String(c.data_post) < hoje || (String(c.data_post) === hoje && horaParaMin(c.hora_post) <= minAgora)) &&
      !results.find((r) => r.id === c.id && r.ok),
  );
  if (atrasados.length && !results.some((r) => r.ok)) {
    await sendTelegramMessage(`⏰ ALERTA MOTOR: ${atrasados.length} post(s) venceram e NÃO publicaram (BRT ${horaAgora}). Checar publish-due.`);
  }

  return NextResponse.json({ ok: true, published: results.filter((r) => r.ok).length, total: results.length, hoje, horaAgora, results });
}

export async function GET() {
  return NextResponse.json({ ok: true, instagram_configurado: hasInstagram() });
}
