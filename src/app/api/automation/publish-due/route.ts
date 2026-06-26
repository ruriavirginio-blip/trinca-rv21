import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { publishByType, hasInstagram } from "@/lib/instagram";
import { sendTelegramMessage } from "@/lib/telegram";

/* Motor 24/7 — publica os conteúdos AGENDADOS cujo horário chegou.
   Chamado por cron (Make.com) a cada X min com token.
   status 'agendado' + data/hora <= agora -> publica no Instagram -> 'publicado'. */

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: NextRequest) {
  const validSecrets = [process.env.AUTOMATION_API_SECRET, process.env.MONITOR_TOKEN].map(clean).filter(Boolean);
  const got = clean(request.headers.get("x-automation-secret")) || clean(request.nextUrl.searchParams.get("token"));
  if (validSecrets.length && !validSecrets.includes(got)) return NextResponse.json({ error: "Token invalido." }, { status: 401 });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false } });

  if (!hasInstagram()) {
    return NextResponse.json({ ok: true, published: 0, note: "Instagram ainda nao configurado (credenciais)." });
  }

  // Horário de Brasília — a programação do dia é em BRT, não UTC.
  // (sv-SE => "YYYY-MM-DD HH:MM:SS")
  const brt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date());
  const hoje = brt.slice(0, 10);
  const horaAgora = brt.slice(11, 16);

  // Vão ao ar: itens APROVADOS pelo Ruriá (ou já 'agendado'), com asset e com
  // HORÁRIO definido (a programação do dia). Sem hora_post não posta sozinho —
  // evita publicação acidental ao aprovar.
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
      c.tipo !== "story" && // story o Graph API não publica (sempre manual)
      (c.data_post < hoje ||
        (c.data_post === hoje && String(c.hora_post).slice(0, 5) <= horaAgora)),
  );

  // legenda guarda CAPTION + (opcional) galeria de slides após "---SLIDES---".
  // No post: caption limpa (sem os links) e, no carrossel, TODOS os slides.
  function parseLegenda(legenda: string | null | undefined) {
    const [cap, gal] = (legenda || "").split("---SLIDES---");
    const slides = (gal || "")
      .split(/\s+/)
      .map((s) => s.trim())
      .filter((s) => /^https?:\/\//.test(s));
    return { caption: (cap || "").trim(), slides };
  }

  const results: Array<{ id: string; ok: boolean; reason?: string }> = [];
  for (const c of aPublicar) {
    // Claim atômico contra disparo duplo (cron externo + GitHub Actions ao mesmo tempo):
    // só publica quem conseguir mudar 'agendado'/'aprovado' -> 'publicando'. Evita post duplicado.
    const { data: claimed } = await db
      .from("content_factory")
      .update({ status: "publicando" })
      .eq("id", c.id)
      .in("status", ["agendado", "aprovado"])
      .select("id");
    if (!claimed || claimed.length === 0) continue; // outro disparo já pegou este item

    const { caption, slides } = parseLegenda(c.legenda);
    const asset = c.tipo === "carrossel" && slides.length > 1 ? slides.join(",") : c.asset_url;
    const res = await publishByType(c.tipo, asset, caption);
    if (res.ok) {
      await db.from("content_factory").update({
        status: "publicado",
        instagram_media_id: res.mediaId,
        publicado_em: new Date().toISOString(),
      }).eq("id", c.id);
      await sendTelegramMessage(`✅ Post publicado no Instagram: *${c.tema || c.roteiro_ref || c.tipo}* (${c.tipo}).`);
    } else {
      await db.from("content_factory").update({ status: "erro", erro_msg: res.reason }).eq("id", c.id);
      await sendTelegramMessage(`⚠️ Falhou ao publicar *${c.tema || c.tipo}*: ${res.reason}`);
    }
    results.push({ id: c.id, ok: res.ok, reason: res.reason });
  }

  return NextResponse.json({ ok: true, published: results.filter((r) => r.ok).length, total: results.length, results });
}

export async function GET() {
  return NextResponse.json({ ok: true, instagram_configurado: hasInstagram() });
}
