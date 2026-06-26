import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* Painel Agentes do cockpit: estado dos agentes autônomos (agent_status).
   Protegido por token (mesmo padrão da /api/vip-leads). */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supa() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function autorizado(request: Request): boolean {
  const url = new URL(request.url);
  const bearer = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const provided = [url.searchParams.get("token"), request.headers.get("x-automation-secret"), bearer]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  const valid = [
    process.env.AUTOMATION_API_SECRET,
    process.env.MONITOR_TOKEN,
    process.env.KIWIFY_WEBHOOK_SECRET,
  ].filter(Boolean) as string[];
  return valid.length > 0 && provided.some((p) => valid.includes(p));
}

export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ ok: false, error: "Token invalido." }, { status: 401 });
  }
  const db = supa();
  if (!db) return NextResponse.json({ ok: false, reason: "supabase-off", agentes: [] });

  const { data, error } = await db
    .from("agent_status")
    .select("agent,nome,tipo,decision,severity,status,fonte,updated_at")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ ok: false, reason: error.message, agentes: [] });

  const agora = Date.now();
  const agentes = (data || []).map((a) => {
    const t = a.updated_at ? new Date(a.updated_at as string).getTime() : 0;
    const minAtras = t ? Math.round((agora - t) / 60000) : null;
    // vivo se reportou nas últimas 12h (ciclo do daemon é 6h)
    const vivo = minAtras !== null && minAtras <= 720;
    return { ...a, min_atras: minAtras, vivo };
  });

  return NextResponse.json({ ok: true, total: agentes.length, agentes });
}
