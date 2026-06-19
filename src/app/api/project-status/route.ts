import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* Status do projeto — fonte de verdade do "o que estamos fazendo agora".
   O bot do Telegram lê isto pra responder em sintonia com o centro operacional. */

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}
function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  const supabase = db();
  if (!supabase) return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  const { data, error } = await supabase.from("project_status").select("*").eq("id", 1).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, status: data });
}

export async function POST(request: NextRequest) {
  const supabase = db();
  if (!supabase) return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  const secret = clean(process.env.AUTOMATION_API_SECRET || process.env.MONITOR_TOKEN);
  const got = clean(request.headers.get("x-automation-secret")) || clean(request.nextUrl.searchParams.get("token"));
  if (secret && got !== secret) return NextResponse.json({ error: "Token invalido." }, { status: 401 });

  const b = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: Record<string, unknown> = { id: 1, atualizado_em: new Date().toISOString() };
  if (typeof b.fase === "string") patch.fase = b.fase;
  if (typeof b.em_execucao === "string") patch.em_execucao = b.em_execucao;
  if (typeof b.resumo === "string") patch.resumo = b.resumo;
  if (typeof b.proximos_passos === "string") patch.proximos_passos = b.proximos_passos;
  const { data, error } = await supabase.from("project_status").upsert(patch).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, status: data });
}
