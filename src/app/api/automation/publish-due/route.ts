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
  const secret = clean(process.env.AUTOMATION_API_SECRET || process.env.MONITOR_TOKEN);
  const got = clean(request.headers.get("x-automation-secret")) || clean(request.nextUrl.searchParams.get("token"));
  if (secret && got !== secret) return NextResponse.json({ error: "Token invalido." }, { status: 401 });

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false } });

  if (!hasInstagram()) {
    return NextResponse.json({ ok: true, published: 0, note: "Instagram ainda nao configurado (credenciais)." });
  }

  const agora = new Date();
  const hoje = agora.toISOString().slice(0, 10);
  const horaAgora = agora.toISOString().slice(11, 16);

  const { data: due, error } = await db
    .from("content_factory")
    .select("*")
    .eq("status", "agendado")
    .not("asset_url", "is", null)
    .lte("data_post", hoje);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const aPublicar = (due ?? []).filter(
    (c) => c.data_post < hoje || (c.data_post === hoje && (!c.hora_post || c.hora_post <= horaAgora)),
  );

  const results: Array<{ id: string; ok: boolean; reason?: string }> = [];
  for (const c of aPublicar) {
    const res = await publishByType(c.tipo, c.asset_url, c.legenda || "");
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
