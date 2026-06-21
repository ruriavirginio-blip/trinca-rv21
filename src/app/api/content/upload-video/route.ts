import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ============================================================
   Upload de VÍDEO BRUTO -> Supabase Storage (bucket cockpit-assets)
   -> grava video_bruto_url no content_factory (alimenta o Remotion).
   Usa URL assinada: o navegador envia o arquivo direto pro Storage
   (sem passar pelo limite de body da Vercel).
   GET                          -> lista itens de conteudo
   POST {action:"sign",...}     -> gera URL assinada de upload
   POST {action:"confirm",...}  -> grava a URL final no item
   ============================================================ */

export const dynamic = "force-dynamic";
const BUCKET = "cockpit-assets";

function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function GET() {
  const supabase = db();
  if (!supabase) return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  const { data, error } = await supabase
    .from("content_factory")
    .select("id, tipo, tema, status, data_post, video_bruto_url, asset_url")
    .in("status", ["solicitado", "criando", "aprovado", "em_aprovacao"])
    .order("data_post", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, itens: data });
}

export async function POST(request: Request) {
  const supabase = db();
  if (!supabase) return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = clean(body.action);
  const contentId = clean(body.contentId);
  if (!contentId) return NextResponse.json({ error: "contentId obrigatorio." }, { status: 400 });

  if (action === "sign") {
    const filename = clean(body.filename) || "video.mp4";
    const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `videos-brutos/${contentId}/${Date.now()}-${safe}`;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
    return NextResponse.json({ ok: true, path: data.path, token: data.token, signedUrl: data.signedUrl, publicUrl });
  }

  if (action === "confirm") {
    const publicUrl = clean(body.publicUrl);
    if (!publicUrl) return NextResponse.json({ error: "publicUrl obrigatorio." }, { status: 400 });
    const { error } = await supabase
      .from("content_factory")
      .update({ video_bruto_url: publicUrl, status: "criando", atualizado_em: new Date().toISOString() })
      .eq("id", contentId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, video_bruto_url: publicUrl });
  }

  return NextResponse.json({ error: "action invalida (use sign|confirm)." }, { status: 400 });
}
