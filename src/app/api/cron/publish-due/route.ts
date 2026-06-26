import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* CRON — Publicação automática de posts agendados (independe do Mac do Ruriá).
   Lê public.scheduled_posts, publica os que já venceram via Instagram Graph API,
   atualiza status e avisa no Telegram. Idempotente (claim atômico scheduled->publishing).
   Disparado por: GitHub Actions (a cada ~10 min) + Vercel Cron (backup).
   Auth: CRON_SECRET via Authorization: Bearer <secret> ou ?token=. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const G = "https://graph.facebook.com/v21.0";

function supa() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function autorizado(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const url = new URL(req.url);
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const provided = [url.searchParams.get("token"), req.headers.get("x-cron-secret"), bearer]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  return provided.includes(secret);
}

async function tg(text: string) {
  const t = process.env.TELEGRAM_BOT_TOKEN, c = process.env.TELEGRAM_CHAT_ID;
  if (!t || !c) return;
  try {
    await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: c, text, parse_mode: "HTML", disable_web_page_preview: false }),
    });
  } catch { /* noop */ }
}

async function pollContainer(id: string, tok: string, maxTries: number) {
  let status = "IN_PROGRESS";
  for (let i = 0; i < maxTries && status !== "FINISHED"; i++) {
    await new Promise((r) => setTimeout(r, 3500));
    const s = await (await fetch(`${G}/${id}?fields=status_code&access_token=${tok}`)).json();
    status = s.status_code || status;
    if (status === "ERROR") throw new Error("container ERROR: " + JSON.stringify(s));
  }
  if (status !== "FINISHED") throw new Error("container nao finalizou (timeout)");
}

type Post = {
  id: string; kind: string; image_url: string | null; media_urls: string[] | null;
  caption: string; dia: string | null; attempts: number;
};

async function publishOne(p: Post, ig: string, tok: string): Promise<{ ig_post_id: string; permalink: string }> {
  let creationId: string;

  if (p.kind === "reel") {
    const url = p.image_url || (p.media_urls && p.media_urls[0]);
    if (!url) throw new Error("reel sem video_url");
    const body = new URLSearchParams({ media_type: "REELS", video_url: url, caption: p.caption, access_token: tok });
    const c = await (await fetch(`${G}/${ig}/media`, { method: "POST", body })).json();
    if (!c.id) throw new Error("container reel falhou: " + JSON.stringify(c));
    await pollContainer(c.id, tok, 30); // video demora mais
    creationId = c.id;
  } else if (p.kind === "carousel") {
    const urls = p.media_urls || [];
    if (urls.length < 2) throw new Error("carousel precisa 2+ imagens");
    const children: string[] = [];
    for (const u of urls) {
      const body = new URLSearchParams({ image_url: u, is_carousel_item: "true", access_token: tok });
      const c = await (await fetch(`${G}/${ig}/media`, { method: "POST", body })).json();
      if (!c.id) throw new Error("child falhou: " + JSON.stringify(c));
      children.push(c.id);
    }
    const body = new URLSearchParams({ media_type: "CAROUSEL", children: children.join(","), caption: p.caption, access_token: tok });
    const c = await (await fetch(`${G}/${ig}/media`, { method: "POST", body })).json();
    if (!c.id) throw new Error("container carousel falhou: " + JSON.stringify(c));
    await pollContainer(c.id, tok, 15);
    creationId = c.id;
  } else {
    // feed (imagem)
    const url = p.image_url || (p.media_urls && p.media_urls[0]);
    if (!url) throw new Error("feed sem image_url");
    const body = new URLSearchParams({ image_url: url, caption: p.caption, access_token: tok });
    const c = await (await fetch(`${G}/${ig}/media`, { method: "POST", body })).json();
    if (!c.id) throw new Error("container feed falhou: " + JSON.stringify(c));
    await pollContainer(c.id, tok, 10);
    creationId = c.id;
  }

  const pub = await (await fetch(`${G}/${ig}/media_publish`, {
    method: "POST", body: new URLSearchParams({ creation_id: creationId, access_token: tok }),
  })).json();
  if (!pub.id) throw new Error("publish falhou: " + JSON.stringify(pub));

  const perm = await (await fetch(`${G}/${pub.id}?fields=permalink&access_token=${tok}`)).json();
  return { ig_post_id: pub.id, permalink: perm.permalink || "https://www.instagram.com/ruriavirginio/" };
}

export async function GET(req: Request) {
  if (!autorizado(req)) return NextResponse.json({ ok: false, error: "nao autorizado" }, { status: 401 });

  const db = supa();
  if (!db) return NextResponse.json({ ok: false, reason: "supabase-off" }, { status: 500 });

  const ig = process.env.IG_BUSINESS_ACCOUNT_ID;
  const tok = process.env.IG_PAGE_ACCESS_TOKEN;
  if (!ig || !tok) return NextResponse.json({ ok: false, reason: "ig-creds-off" }, { status: 500 });

  const nowIso = new Date().toISOString();
  const { data: due, error } = await db
    .from("scheduled_posts")
    .select("id,kind,image_url,media_urls,caption,dia,attempts")
    .eq("status", "scheduled")
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(5);

  if (error) return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
  if (!due || due.length === 0) return NextResponse.json({ ok: true, publicados: 0, vazio: true });

  const resultados: Array<Record<string, unknown>> = [];

  for (const row of due as Post[]) {
    // claim atômico: só processa se ainda estiver 'scheduled'
    const { data: claimed } = await db
      .from("scheduled_posts")
      .update({ status: "publishing" })
      .eq("id", row.id)
      .eq("status", "scheduled")
      .select("id");
    if (!claimed || claimed.length === 0) continue;

    try {
      const { ig_post_id, permalink } = await publishOne(row, ig, tok);
      await db.from("scheduled_posts").update({
        status: "posted", ig_post_id, permalink, posted_at: new Date().toISOString(),
      }).eq("id", row.id);
      resultados.push({ id: row.id, kind: row.kind, ok: true, permalink });
      await tg(`✅ <b>POST PUBLICADO</b> (${row.kind}${row.dia ? " · " + row.dia : ""})\n🔗 ${permalink}\n\nCaptação Lista VIP · Comenta QUERO → DM automática.`);
    } catch (e) {
      const msg = String((e as Error)?.message || e).slice(0, 500);
      const newAttempts = (row.attempts || 0) + 1;
      const giveUp = newAttempts >= 3;
      await db.from("scheduled_posts").update({
        status: giveUp ? "error" : "scheduled", // se ainda tem tentativa, volta pra fila
        error: msg, attempts: newAttempts,
      }).eq("id", row.id);
      resultados.push({ id: row.id, kind: row.kind, ok: false, error: msg, attempts: newAttempts });
      await tg(`🛑 <b>FALHA ao publicar</b> (${row.kind}${row.dia ? " · " + row.dia : ""}) — tentativa ${newAttempts}/3\n${msg}\n\n${giveUp ? "Desisti após 3 tentativas. Vou precisar olhar manual." : "Tento de novo no próximo ciclo."}`);
    }
  }

  return NextResponse.json({ ok: true, publicados: resultados.filter((r) => r.ok).length, resultados });
}
