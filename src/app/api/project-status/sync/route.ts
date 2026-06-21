import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeProjectMetrics, persistProjectMetrics } from "@/lib/project-metrics";

/* Sincronização automática de MÉTRICAS — chamada por cron (vercel.json).
   Recalcula da tabela `leads` e grava em project_status.metricas. */

export const dynamic = "force-dynamic";

function db() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  const supabase = db();
  if (!supabase) return NextResponse.json({ ok: false, error: "Supabase nao configurado." }, { status: 503 });
  try {
    const metricas = await computeProjectMetrics(supabase);
    const { error } = await persistProjectMetrics(supabase, metricas);
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, metricas });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
