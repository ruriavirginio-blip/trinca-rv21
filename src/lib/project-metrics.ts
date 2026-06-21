/* Métricas do projeto — fonte única, computada ao vivo da tabela `leads`.
   Usada pelo cron (/api/project-status/sync), pelo GET /api/project-status
   e pelo bot do Telegram. Mantém tudo sincronizado sem depender de ninguém. */

export type ProjectMetrics = {
  leads_total: number;
  leads_hoje: number;
  leads_google: number;
  checkout_iniciado: number;
  vendas: number;
  meta_leads: number;
  progresso_pct: number;
  taxa_checkout_pct: number;
  dias_para_lancamento: number;
  lancamento: string;
  sincronizado_em: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

const META_LEADS = 1000;
const LANCAMENTO = "2026-06-30";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function count(supabase: SB, build: (q: any) => unknown): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const base: any = supabase.from("leads").select("*", { count: "exact", head: true });
  const q = (build(base) as typeof base) ?? base;
  const { count: c } = await q;
  return c ?? 0;
}

export async function computeProjectMetrics(supabase: SB): Promise<ProjectMetrics> {
  const hoje = new Date().toISOString().slice(0, 10);
  const [total, hojeCount, google, checkoutIniciado, vendas] = await Promise.all([
    count(supabase, () => undefined),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count(supabase, (q: any) => q.gte("capturado_em", `${hoje}T00:00:00`)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count(supabase, (q: any) => q.eq("origem", "google")),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count(supabase, (q: any) => q.eq("status", "checkout-iniciado")),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    count(supabase, (q: any) => q.in("status", ["compra-aprovada", "comprou", "cliente"])),
  ]);

  const dias = Math.max(
    0,
    Math.ceil((new Date(`${LANCAMENTO}T00:00:00Z`).getTime() - Date.now()) / 86400000),
  );

  return {
    leads_total: total,
    leads_hoje: hojeCount,
    leads_google: google,
    checkout_iniciado: checkoutIniciado,
    vendas,
    meta_leads: META_LEADS,
    progresso_pct: Math.round((total / META_LEADS) * 1000) / 10,
    taxa_checkout_pct: total > 0 ? Math.round((checkoutIniciado / total) * 1000) / 10 : 0,
    dias_para_lancamento: dias,
    lancamento: LANCAMENTO,
    sincronizado_em: new Date().toISOString(),
  };
}

export async function persistProjectMetrics(supabase: SB, metricas: ProjectMetrics) {
  return supabase
    .from("project_status")
    .update({ metricas, atualizado_em: new Date().toISOString() })
    .eq("id", 1);
}
