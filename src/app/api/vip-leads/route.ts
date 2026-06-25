import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* Controle da LISTA VIP pro cockpit:
   - total de leads do formulário /vip
   - por qual LINK chegaram (origem: story-d1, trafego-d1, ig-dm, bio...)
   - lista com nome / WhatsApp / email / @ig / objetivo / data */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function supa() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function igFromUtm(utm: unknown): string {
  try {
    const o = typeof utm === "string" ? JSON.parse(utm) : utm;
    const ig = (o as { instagram_user?: string })?.instagram_user;
    return ig ? `@${String(ig).replace(/^@+/, "")}` : "";
  } catch {
    return "";
  }
}

function bonito(origem: string): string {
  const o = (origem || "").toLowerCase();
  if (o.includes("trafego")) return "Tráfego pago";
  if (o.includes("story")) return "Story orgânico";
  if (o.includes("ig-dm") || o.includes("whatsapp-claude")) return "DM/Comentário";
  if (o.includes("bio")) return "Bio do Instagram";
  if (o.includes("lista-vip") || o.includes("instagram-lista-vip")) return "Direto / lista-vip";
  return origem || "Sem origem";
}

function autorizado(request: Request): boolean {
  const url = new URL(request.url);
  const bearer = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const provided = [
    url.searchParams.get("token"),
    request.headers.get("x-automation-secret"),
    bearer,
  ]
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  const validSecrets = [
    process.env.AUTOMATION_API_SECRET,
    process.env.MONITOR_TOKEN,
    process.env.KIWIFY_WEBHOOK_SECRET,
  ].filter(Boolean) as string[];
  return validSecrets.length > 0 && provided.some((p) => validSecrets.includes(p));
}

export async function GET(request: Request) {
  // SEGURANCA: Lista VIP e PII. Sem token valido = 401 (antes esta rota era publica).
  if (!autorizado(request)) {
    return NextResponse.json({ ok: false, error: "Token invalido." }, { status: 401 });
  }
  const db = supa();
  if (!db) return NextResponse.json({ ok: false, reason: "supabase-off", total: 0, porOrigem: [], leads: [] });

  const { data, error } = await db
    .from("leads")
    .select("nome,email,whatsapp,objetivo,origem,utm,capturado_em,status")
    .eq("status", "lista-vip")
    .order("capturado_em", { ascending: false })
    .limit(500);

  if (error) return NextResponse.json({ ok: false, reason: error.message, total: 0, porOrigem: [], leads: [] });

  const rows = data || [];
  const agg: Record<string, number> = {};
  const leads = rows.map((r) => {
    const origem = String(r.origem || "");
    agg[origem] = (agg[origem] || 0) + 1;
    return {
      nome: r.nome || "—",
      whatsapp: r.whatsapp || "",
      email: typeof r.email === "string" && r.email.endsWith("@instagram-vip.trincarv21.local") ? "" : r.email || "",
      instagram: igFromUtm(r.utm),
      objetivo: r.objetivo && r.objetivo !== "lista-vip-pre-lancamento" ? r.objetivo : "",
      origem,
      origem_label: bonito(origem),
      capturado_em: r.capturado_em || null,
    };
  });

  const porOrigem = Object.entries(agg)
    .map(([origem, count]) => ({ origem, origem_label: bonito(origem), count }))
    .sort((a, b) => b.count - a.count);

  // últimas 24h
  const agora = Date.now();
  const novas24h = rows.filter((r) => {
    const t = r.capturado_em ? new Date(r.capturado_em).getTime() : 0;
    return t && agora - t < 24 * 60 * 60 * 1000;
  }).length;

  return NextResponse.json({ ok: true, total: rows.length, novas24h, porOrigem, leads });
}
