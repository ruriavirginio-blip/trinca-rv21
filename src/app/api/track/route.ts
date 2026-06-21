import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Tracker de acessos próprio (NÃO usa GA4 API — frágil).
// POST  -> insere 1 acesso na tabela `acessos`.
// GET   -> agrega acessos por origem / campanha / período.

type TrackPayload = {
  path?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  origem?: string;
  referrer?: string;
};

function clean(value: unknown, max = 300) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

// Deriva a origem "popular" do acesso quando o cliente não mandou explícito.
// Buckets: story | feed | carrossel | trafego | google | bio | landing | direct
function derivarOrigem(p: TrackPayload): string {
  const explicit = clean(p.origem).toLowerCase();
  if (explicit) return explicit;

  const src = clean(p.utm_source).toLowerCase();
  const med = clean(p.utm_medium).toLowerCase();
  const camp = clean(p.utm_campaign).toLowerCase();
  const blob = `${src} ${med} ${camp}`;
  const ref = clean(p.referrer).toLowerCase();
  const path = clean(p.path).toLowerCase();

  if (/story|stories/.test(blob)) return "story";
  if (/carrossel|carousel/.test(blob)) return "carrossel";
  if (/feed|post/.test(blob)) return "feed";
  if (/cpc|paid|ads?|trafego|tr[aá]fego|paga/.test(blob)) return "trafego";
  if (med === "bio" || /linktree|\/bio/.test(`${blob} ${path}`)) return "bio";
  if (/google\./.test(ref) || /google/.test(blob)) return "google";
  if (/instagram|ig\b|l\.instagram/.test(`${ref} ${blob}`)) return "instagram";
  if (path.includes("/bio")) return "bio";
  if (!ref && !blob.trim()) return "direct";
  return "landing";
}

function supa() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  let body: TrackPayload = {};
  try {
    body = (await request.json()) as TrackPayload;
  } catch {
    body = {};
  }

  const db = supa();
  // Nunca quebrar a página do cliente: sempre responde 200.
  if (!db) return NextResponse.json({ ok: false, reason: "supabase-off" });

  const row = {
    path: clean(body.path) || null,
    utm_source: clean(body.utm_source) || null,
    utm_medium: clean(body.utm_medium) || null,
    utm_campaign: clean(body.utm_campaign) || null,
    origem: derivarOrigem(body),
    referrer: clean(body.referrer, 500) || null,
  };

  const { error } = await db.from("acessos").insert(row);
  if (error) return NextResponse.json({ ok: false, reason: error.message });
  return NextResponse.json({ ok: true, origem: row.origem });
}

type Acesso = {
  origem: string | null;
  utm_campaign: string | null;
  utm_source: string | null;
  path: string | null;
  created_at: string;
};

export async function GET(request: Request) {
  const db = supa();
  if (!db) {
    return NextResponse.json({ ok: false, reason: "supabase-off" }, { status: 503 });
  }

  const url = new URL(request.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days") || 30), 1), 365);
  const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await db
    .from("acessos")
    .select("origem, utm_campaign, utm_source, path, created_at")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(50000);

  if (error) {
    return NextResponse.json({ ok: false, reason: error.message }, { status: 500 });
  }

  const rows = (data || []) as Acesso[];
  const cutoff24h = Date.now() - 24 * 60 * 60 * 1000;

  const tally = (keyOf: (r: Acesso) => string) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      const k = keyOf(r) || "—";
      m.set(k, (m.get(k) || 0) + 1);
    }
    return Array.from(m.entries())
      .map(([nome, total]) => ({ nome, total }))
      .sort((a, b) => b.total - a.total);
  };

  return NextResponse.json({
    ok: true,
    janelaDias: days,
    total: rows.length,
    ultimas24h: rows.filter((r) => new Date(r.created_at).getTime() >= cutoff24h).length,
    porOrigem: tally((r) => r.origem || "direct"),
    porCampanha: tally((r) => r.utm_campaign || "(sem campanha)"),
    porPath: tally((r) => r.path || "/"),
  });
}
