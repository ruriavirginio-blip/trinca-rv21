import { createClient } from "@supabase/supabase-js";

type FoundationStatus = "ok" | "missing" | "invalid" | "warning";

type FoundationCheck = {
  key: string;
  label: string;
  status: FoundationStatus;
  reason?: string;
  count?: number | null;
};

const BRAIN_TABLES = [
  { key: "instagram_metrics", label: "Metricas do Instagram" },
  { key: "content_performance", label: "Performance de conteudo" },
  { key: "ads_metrics", label: "Metricas de anuncios" },
  { key: "daily_snapshots", label: "Fotografia diaria consolidada" },
];

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function envConfigured(key: string) {
  return Boolean(cleanText(process.env[key]));
}

function envCheck(key: string, label: string, required = true): FoundationCheck {
  const configured = envConfigured(key);

  if (configured) {
    return { key, label, status: "ok" };
  }

  return {
    key,
    label,
    status: required ? "missing" : "warning",
    reason: required ? "Variavel ausente." : "Opcional nesta fase.",
  };
}

async function tableCheck(table: string, label: string): Promise<FoundationCheck> {
  const supabaseUrl = cleanText(process.env.SUPABASE_URL);
  const supabaseServiceRoleKey = cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return {
      key: table,
      label,
      status: "invalid",
      reason: "Supabase URL ou service role ausente.",
    };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });

  if (error) {
    return {
      key: table,
      label,
      status: "missing",
      reason: error.message,
      count: null,
    };
  }

  return {
    key: table,
    label,
    status: "ok",
    count,
  };
}

function checksOk(checks: FoundationCheck[]) {
  return checks.every((check) => check.status === "ok" || check.status === "warning");
}

export async function buildBrainFoundationReadiness() {
  const tableChecks = await Promise.all(
    BRAIN_TABLES.map((table) => tableCheck(table.key, table.label)),
  );

  const trackingChecks = [
    envCheck("NEXT_PUBLIC_META_PIXEL_ID", "Meta Pixel ID", true),
    envCheck("META_CAPI_ACCESS_TOKEN", "Meta CAPI Access Token", true),
    envCheck("NEXT_PUBLIC_GA4_MEASUREMENT_ID", "GA4 Measurement ID", true),
  ];

  const brainChecks = [
    envCheck("ANTHROPIC_API_KEY", "Claude API Key", true),
    envCheck("ANTHROPIC_MODEL", "Claude model", false),
  ];

  return {
    ok: true,
    checked_at: new Date().toISOString(),
    foundation_ready:
      checksOk(tableChecks) && checksOk(trackingChecks) && checksOk(brainChecks),
    groups: [
      {
        key: "supabase_brain_tables",
        label: "Tabelas do cerebro unico",
        status: checksOk(tableChecks) ? "ok" : "invalid",
        items: tableChecks,
      },
      {
        key: "tracking",
        label: "Tracking critico para trafego",
        status: checksOk(trackingChecks) ? "ok" : "invalid",
        items: trackingChecks,
      },
      {
        key: "claude",
        label: "Claude API",
        status: checksOk(brainChecks) ? "ok" : "invalid",
        items: brainChecks,
      },
    ],
  };
}
