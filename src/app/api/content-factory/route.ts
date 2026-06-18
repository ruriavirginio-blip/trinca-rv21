import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ============================================================
   Motor 24/7 — Fila de criação de conteúdo (ESQUELETO)
   GET  -> lista a fila (cockpit lê)
   POST -> cria um pedido de criação (botão do cockpit)
   PATCH-> atualiza status (aprovar/ajustar/rejeitar/agendar)

   NÃO publica no Instagram ainda (depende de IG_PAGE_ACCESS_TOKEN —
   ver docs/credenciais-pendentes.md). Por enquanto só enfileira e
   organiza o ciclo de vida do conteúdo no Supabase.
   ============================================================ */

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const VALID_STATUS = [
  "solicitado", "criando", "em_aprovacao", "aprovado",
  "agendado", "publicado", "rejeitado", "erro",
];

export async function GET(request: NextRequest) {
  const supabase = db();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  }
  const status = clean(request.nextUrl.searchParams.get("status"));
  let query = supabase.from("content_factory").select("*").order("data_post", { ascending: true });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const supabase = db();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const tipo = clean(body.tipo);
  if (!["story", "feed", "carrossel", "reel"].includes(tipo)) {
    return NextResponse.json({ error: "tipo invalido (story|feed|carrossel|reel)." }, { status: 400 });
  }
  const pedido = {
    tipo,
    tema: clean(body.tema) || null,
    roteiro_ref: clean(body.roteiro_ref) || null,
    legenda: clean(body.legenda) || null,
    skills: Array.isArray(body.skills) ? (body.skills as string[]) : [],
    data_post: clean(body.data_post) || null,
    hora_post: clean(body.hora_post) || null,
    video_bruto_url: clean(body.video_bruto_url) || null,
    status: "solicitado",
  };
  const { data, error } = await supabase.from("content_factory").insert(pedido).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, pedido: data });
}

export async function PATCH(request: NextRequest) {
  const supabase = db();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  }
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const id = clean(body.id);
  const status = clean(body.status);
  if (!id) return NextResponse.json({ error: "id obrigatorio." }, { status: 400 });
  if (status && !VALID_STATUS.includes(status)) {
    return NextResponse.json({ error: "status invalido." }, { status: 400 });
  }
  const patch: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
  if (status) patch.status = status;
  if (typeof body.feedback === "string") patch.feedback = body.feedback;
  if (typeof body.asset_url === "string") patch.asset_url = body.asset_url;
  if (typeof body.legenda === "string") patch.legenda = body.legenda;
  if (typeof body.data_post === "string") patch.data_post = body.data_post;
  if (typeof body.hora_post === "string") patch.hora_post = body.hora_post;
  const { data, error } = await supabase.from("content_factory").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, pedido: data });
}
