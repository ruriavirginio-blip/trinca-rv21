"use client";

/**
 * Painéis operacionais nativos do Cockpit (substituem o embed de /operacao).
 * - JornadaPanel: cada lead com origem, etapa atual, % do caminho, dropoff e passo a passo das mensagens.
 * - AlertasPanel: só o que travou / desistiu / deu erro — "na cara".
 * - AcessosPanel: contagem EXATA de acessos por origem / campanha / link (tracker próprio /api/track).
 * Atualização automática a cada 60s.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  Loader2,
  MousePointerClick,
  RefreshCw,
  XCircle,
} from "lucide-react";

// ---------- Tipos (subconjunto de /api/automation/dashboard) ----------
type StageRef = { key: string; label: string };
type DashLead = {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  objetivo: string;
  status: string;
  capturado_em: string;
  source: { key: string; label: string; campaign?: string };
  progress: { completed: number; total: number; percent: number };
  current_stage: StageRef;
  payment: { confirmed?: boolean };
  dropoff: { needs_attention?: boolean; label?: string; reason?: string; detail?: string };
  operational_alert: null | { label: string; detail?: string; minutes?: number };
  journey: Array<{
    key: string;
    label: string;
    status: string;
    status_label: string;
    completed: boolean;
    waiting: boolean;
    failed: boolean;
  }>;
  messages: {
    total: number;
    sent: number;
    pending: number;
    waiting_click: number;
    errors: number;
    timeline: Array<{ etapa_label: string; status: string; status_label: string }>;
  };
};
type DashMetrics = {
  total_leads: number;
  leads_24h: number;
  waiting_clicks: number;
  errors: number;
  group_links_sent: number;
  payment_confirmed: number;
  payment_not_confirmed: number;
  needs_attention: number;
  by_source: Array<{ label: string; count: number }>;
};
type DashResponse = {
  ok?: boolean;
  error?: string;
  checked_at?: string;
  metrics?: DashMetrics;
  leads?: DashLead[];
};

// ---------- Hook compartilhado: busca dashboard + refresh 60s ----------
function useDashboard(token: string) {
  const [data, setData] = useState<DashResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setError("Cole o token da operação (AUTOMATION_API_SECRET) para ver os dados ao vivo.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/automation/dashboard?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      const json = (await res.json()) as DashResponse;
      if (!res.ok || json.error) {
        setError(json.error || `Erro ${res.status}`);
      } else {
        setData(json);
        setUpdatedAt(new Date());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
    if (!token) return;
    const timer = window.setInterval(() => void load(), 20_000);
    return () => window.clearInterval(timer);
  }, [load, token]);

  return { data, error, loading, updatedAt, reload: load };
}

function stageTone(lead: DashLead): "ok" | "wait" | "err" {
  if (lead.messages.errors > 0 || lead.operational_alert) return "err";
  if (lead.dropoff?.needs_attention || lead.messages.waiting_click > 0) return "wait";
  return "ok";
}

function timeAgo(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  if (!d) return "";
  const min = Math.round((Date.now() - d) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  return `${Math.round(h / 24)} d`;
}

// ---------- Token + cabeçalho compartilhado ----------
function LiveHeader({
  token,
  onToken,
  loading,
  updatedAt,
  onReload,
  showToken = true,
}: {
  token: string;
  onToken?: (v: string) => void;
  loading: boolean;
  updatedAt: Date | null;
  onReload: () => void;
  showToken?: boolean;
}) {
  return (
    <div className="op-head">
      {showToken && onToken ? (
        <div className="op-token">
          <Eye size={16} />
          <input
            value={token}
            onChange={(e) => onToken(e.target.value)}
            placeholder="Cole o token da operação (uma vez)"
          />
        </div>
      ) : (
        <span className="op-updated">
          {updatedAt ? `Atualizado ${timeAgo(updatedAt.toISOString())} atrás` : "—"}
        </span>
      )}
      <button className="op-refresh" onClick={onReload} disabled={loading}>
        {loading ? <Loader2 className="op-spin" size={16} /> : <RefreshCw size={16} />}
        Atualizar
      </button>
      <style jsx>{opStyles}</style>
    </div>
  );
}

// ======================= JORNADA =======================
export function JornadaPanel({ token, onToken }: { token: string; onToken: (v: string) => void }) {
  const { data, error, loading, updatedAt, reload } = useDashboard(token);
  const [open, setOpen] = useState<string | null>(null);
  const m = data?.metrics;
  const leads = data?.leads ?? [];

  return (
    <div className="op-wrap">
      <LiveHeader token={token} onToken={onToken} loading={loading} updatedAt={updatedAt} onReload={reload} />
      {error ? <div className="op-error">{error}</div> : null}

      {m ? (
        <div className="op-grid">
          <Stat label="Leads" value={m.total_leads} />
          <Stat label="Últimas 24h" value={m.leads_24h} tone="gold" />
          <Stat label="Compras" value={m.payment_confirmed} tone="ok" />
          <Stat label="Precisam atenção" value={m.needs_attention} tone={m.needs_attention ? "wait" : "ok"} />
        </div>
      ) : null}

      {m && m.by_source.length ? (
        <div className="op-sources">
          {m.by_source.map((s) => (
            <span key={s.label} className="op-chip">
              {s.label} <b>{s.count}</b>
            </span>
          ))}
        </div>
      ) : null}

      <div className="op-leads">
        {leads.length === 0 && !loading && !error ? (
          <p className="op-empty">Nenhuma lead na janela atual.</p>
        ) : null}
        {leads.map((lead) => {
          const tone = stageTone(lead);
          const isOpen = open === lead.id;
          return (
            <div key={lead.id} className={`op-lead tone-${tone}`}>
              <button className="op-lead-top" onClick={() => setOpen(isOpen ? null : lead.id)}>
                <div className="op-lead-id">
                  <strong>{lead.nome || lead.email || "Lead"}</strong>
                  <span className="op-lead-meta">
                    {lead.source.label}
                    {lead.objetivo ? ` · ${lead.objetivo}` : ""}
                    {lead.capturado_em ? ` · ${timeAgo(lead.capturado_em)}` : ""}
                  </span>
                </div>
                <div className="op-lead-right">
                  <span className={`op-stage tone-${tone}`}>
                    {tone === "err" ? <XCircle size={13} /> : tone === "wait" ? <Clock size={13} /> : <CheckCircle2 size={13} />}
                    {lead.current_stage.label}
                  </span>
                  <ChevronDown size={16} className={isOpen ? "op-rot" : ""} />
                </div>
              </button>

              <div className="op-bar">
                <span style={{ width: `${lead.progress.percent}%` }} />
                <em>{lead.progress.completed}/{lead.progress.total}</em>
              </div>

              {isOpen ? (
                <div className="op-timeline">
                  {lead.operational_alert ? (
                    <div className="op-inline-alert">
                      <AlertTriangle size={14} /> {lead.operational_alert.label}
                      {lead.operational_alert.minutes ? ` (${lead.operational_alert.minutes} min)` : ""}
                    </div>
                  ) : null}

                  {/* Origem do link por onde a lead entrou */}
                  <div className="op-step st-origem">
                    <span className="op-step-dot" />
                    <span className="op-step-label">
                      Origem: {lead.source.label}
                      {lead.source.campaign ? ` · ${lead.source.campaign}` : ""}
                    </span>
                    <span className="op-step-status">entrada</span>
                  </div>

                  {/* Caminho completo: da landing ao clique no grupo oficial */}
                  {(lead.journey ?? []).map((step) => {
                    const cls = step.failed
                      ? "st-erro"
                      : step.completed
                        ? "st-concluida"
                        : step.waiting
                          ? "st-aguardando-clique"
                          : "st-nao-iniciado";
                    const isCurrent = step.key === lead.current_stage.key;
                    return (
                      <div key={step.key} className={`op-step ${cls}${isCurrent ? " is-current" : ""}`}>
                        <span className="op-step-dot" />
                        <span className="op-step-label">{step.label}</span>
                        <span className="op-step-status">
                          {isCurrent ? "▶ agora · " : ""}
                          {step.status_label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <style jsx>{opStyles}</style>
    </div>
  );
}

// ======================= ALERTAS =======================
export function AlertasPanel({ token }: { token: string }) {
  const { data, error, loading, updatedAt, reload } = useDashboard(token);
  const leads = data?.leads ?? [];
  const problemas = useMemo(
    () =>
      leads
        .map((lead) => ({ lead, tone: stageTone(lead) }))
        .filter((x) => x.tone !== "ok")
        .sort((a, b) => (a.tone === "err" ? -1 : 1) - (b.tone === "err" ? -1 : 1)),
    [leads],
  );
  const m = data?.metrics;

  return (
    <div className="op-wrap">
      <LiveHeader token={token} loading={loading} updatedAt={updatedAt} onReload={reload} showToken={false} />
      {error ? <div className="op-error">{error}</div> : null}

      {m ? (
        <div className="op-grid">
          <Stat label="Erros" value={m.errors} tone={m.errors ? "err" : "ok"} />
          <Stat label="Aguardando clique" value={m.waiting_clicks} tone={m.waiting_clicks ? "wait" : "ok"} />
          <Stat label="Precisam atenção" value={m.needs_attention} tone={m.needs_attention ? "wait" : "ok"} />
          <Stat label="Sem pagar" value={m.payment_not_confirmed} />
        </div>
      ) : null}

      <div className="op-leads">
        {problemas.length === 0 && !loading && !error ? (
          <div className="op-allgood">
            <CheckCircle2 size={18} /> Tudo certo — nenhuma lead travada ou com erro agora.
          </div>
        ) : null}
        {problemas.map(({ lead, tone }) => (
          <div key={lead.id} className={`op-alert tone-${tone}`}>
            <div className="op-alert-icon">
              {tone === "err" ? <XCircle size={18} /> : <Clock size={18} />}
            </div>
            <div className="op-alert-body">
              <strong>{lead.nome || lead.email || "Lead"}</strong>
              <span className="op-lead-meta">{lead.source.label} · {timeAgo(lead.capturado_em)}</span>
              <p className="op-alert-reason">
                {tone === "err"
                  ? lead.operational_alert?.label || `Erro em ${lead.current_stage.label}`
                  : lead.dropoff?.label || lead.dropoff?.reason || `Travou em: ${lead.current_stage.label}`}
              </p>
            </div>
            {lead.whatsapp ? (
              <a
                className="op-alert-wa"
                href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
              >
                WhatsApp
              </a>
            ) : null}
          </div>
        ))}
      </div>
      <style jsx>{opStyles}</style>
    </div>
  );
}

// ======================= ACESSOS =======================
type TrackTally = { nome: string; total: number };
type TrackResponse = {
  ok?: boolean;
  reason?: string;
  total?: number;
  ultimas24h?: number;
  janelaDias?: number;
  porOrigem?: TrackTally[];
  porCampanha?: TrackTally[];
  porPath?: TrackTally[];
};

export function AcessosPanel() {
  const [data, setData] = useState<TrackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [days, setDays] = useState(30);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/track?days=${days}`, { cache: "no-store" });
      const json = (await res.json()) as TrackResponse;
      if (!res.ok || json.ok === false) setError(json.reason || `Erro ${res.status}`);
      else setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <div className="op-wrap">
      <div className="op-head">
        <div className="op-days">
          {[1, 7, 30].map((d) => (
            <button key={d} className={d === days ? "active" : ""} onClick={() => setDays(d)}>
              {d === 1 ? "Hoje" : `${d}d`}
            </button>
          ))}
        </div>
        <button className="op-refresh" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="op-spin" size={16} /> : <RefreshCw size={16} />}
          Atualizar
        </button>
      </div>
      {error ? <div className="op-error">{error}</div> : null}

      <div className="op-grid">
        <Stat label="Acessos (período)" value={data?.total ?? 0} tone="gold" />
        <Stat label="Últimas 24h" value={data?.ultimas24h ?? 0} />
        <Stat label="Origens" value={data?.porOrigem?.length ?? 0} />
        <Stat label="Campanhas" value={data?.porCampanha?.length ?? 0} />
      </div>

      <TallyBlock title="Por origem (link exato)" rows={data?.porOrigem} icon={<MousePointerClick size={14} />} />
      <TallyBlock title="Por campanha" rows={data?.porCampanha} />
      <TallyBlock title="Por página" rows={data?.porPath} />

      <p className="op-note">
        Contagem própria e exata (não usa GA4). Cada visita em <code>/nova</code> e <code>/bio</code> registra a origem
        derivada da URL (UTM) + referrer.
      </p>
      <style jsx>{opStyles}</style>
    </div>
  );
}

function TallyBlock({ title, rows, icon }: { title: string; rows?: TrackTally[]; icon?: React.ReactNode }) {
  const max = rows && rows.length ? Math.max(...rows.map((r) => r.total)) : 0;
  return (
    <div className="op-tally">
      <h4>{icon}{title}</h4>
      {!rows || rows.length === 0 ? (
        <p className="op-empty">Sem dados ainda.</p>
      ) : (
        rows.map((r) => (
          <div key={r.nome} className="op-tally-row">
            <span className="op-tally-name">{r.nome}</span>
            <span className="op-tally-bar">
              <em style={{ width: `${max ? (r.total / max) * 100 : 0}%` }} />
            </span>
            <b>{r.total}</b>
          </div>
        ))
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number | string; tone?: "ok" | "wait" | "err" | "gold" }) {
  return (
    <div className={`op-stat tone-${tone || "n"}`}>
      <strong>{value}</strong>
      <span>{label}</span>
      <style jsx>{opStyles}</style>
    </div>
  );
}

// ---------- estilos (escopo styled-jsx) ----------
const opStyles = `
.op-wrap{display:flex;flex-direction:column;gap:14px}
.op-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.op-token{flex:1;min-width:200px;display:flex;align-items:center;gap:8px;background:#16161a;border:1px solid #26262c;border-radius:12px;padding:10px 12px;color:#a3a09a}
.op-token input{flex:1;background:none;border:none;color:#f5f3ef;font-size:13px;outline:none}
.op-updated{flex:1;color:#6f6c66;font-size:12px}
.op-refresh{display:inline-flex;align-items:center;gap:6px;background:rgba(212,162,60,.12);border:1px solid rgba(212,162,60,.3);color:#f0c969;font-weight:600;font-size:13px;padding:9px 14px;border-radius:10px;cursor:pointer}
.op-refresh:disabled{opacity:.6}
.op-spin{animation:opspin 1s linear infinite}
@keyframes opspin{to{transform:rotate(360deg)}}
.op-days{display:flex;gap:6px;flex:1}
.op-days button{background:#16161a;border:1px solid #26262c;color:#a3a09a;font-size:12px;font-weight:600;padding:8px 14px;border-radius:10px;cursor:pointer}
.op-days button.active{background:rgba(212,162,60,.14);border-color:rgba(212,162,60,.35);color:#f0c969}
.op-error{background:rgba(220,80,80,.1);border:1px solid rgba(220,80,80,.3);color:#f0a3a3;font-size:13px;padding:11px 14px;border-radius:12px}
.op-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
@media(max-width:560px){.op-grid{grid-template-columns:repeat(2,1fr)}}
.op-stat{background:#16161a;border:1px solid #26262c;border-radius:14px;padding:14px 12px;text-align:center}
.op-stat strong{display:block;font-size:24px;font-weight:800;color:#f5f3ef;line-height:1}
.op-stat span{display:block;font-size:11px;color:#a3a09a;margin-top:6px;font-weight:600}
.op-stat.tone-gold strong{color:#f0c969}
.op-stat.tone-ok strong{color:#5fd08a}
.op-stat.tone-wait strong{color:#e8b04a}
.op-stat.tone-err strong{color:#f07a7a}
.op-sources{display:flex;flex-wrap:wrap;gap:8px}
.op-chip{background:#16161a;border:1px solid #26262c;border-radius:100px;padding:6px 12px;font-size:12px;color:#a3a09a}
.op-chip b{color:#f0c969;margin-left:4px}
.op-leads{display:flex;flex-direction:column;gap:10px}
.op-empty{color:#6f6c66;font-size:13px;text-align:center;padding:8px}
.op-lead{background:#16161a;border:1px solid #26262c;border-radius:14px;padding:12px 14px;border-left:3px solid #26262c}
.op-lead.tone-wait{border-left-color:#e8b04a}
.op-lead.tone-err{border-left-color:#f07a7a}
.op-lead.tone-ok{border-left-color:#5fd08a}
.op-lead-top{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;background:none;border:none;cursor:pointer;text-align:left;padding:0}
.op-lead-id strong{display:block;color:#f5f3ef;font-size:14px;font-weight:700}
.op-lead-meta{color:#6f6c66;font-size:11.5px}
.op-lead-right{display:flex;align-items:center;gap:8px;color:#a3a09a;flex-shrink:0}
.op-stage{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;padding:4px 9px;border-radius:100px;background:#1d1d22}
.op-stage.tone-ok{color:#5fd08a}
.op-stage.tone-wait{color:#e8b04a}
.op-stage.tone-err{color:#f07a7a}
.op-rot{transform:rotate(180deg)}
.op-bar{position:relative;height:6px;background:#1d1d22;border-radius:100px;margin-top:10px;overflow:hidden}
.op-bar>span{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#d4a23c,#f0c969);border-radius:100px}
.op-bar>em{position:absolute;right:6px;top:-16px;font-size:10px;color:#6f6c66;font-style:normal}
.op-timeline{margin-top:12px;display:flex;flex-direction:column;gap:6px;border-top:1px solid #26262c;padding-top:10px}
.op-inline-alert{display:flex;align-items:center;gap:7px;background:rgba(240,122,122,.1);border:1px solid rgba(240,122,122,.3);color:#f0a3a3;font-size:12px;padding:8px 10px;border-radius:10px}
.op-step{display:flex;align-items:center;gap:9px;font-size:12.5px}
.op-step-dot{width:8px;height:8px;border-radius:50%;background:#3a3a42;flex-shrink:0}
.op-step.st-enviada .op-step-dot,.op-step.st-concluida .op-step-dot{background:#5fd08a}
.op-step.st-pendente .op-step-dot,.op-step.st-aguardando-clique .op-step-dot{background:#e8b04a}
.op-step.st-erro .op-step-dot{background:#f07a7a}
.op-step.st-origem .op-step-dot{background:#d4a23c;box-shadow:0 0 0 3px rgba(212,162,60,.18)}
.op-step.st-nao-iniciado .op-step-dot{background:#3a3a42}
.op-step.st-nao-iniciado .op-step-label{color:#8a877f}
.op-step.is-current{background:rgba(212,162,60,.08);border-radius:8px;padding:4px 6px;margin:0 -6px}
.op-step.is-current .op-step-label{color:#f0c969;font-weight:700}
.op-step.is-current .op-step-status{color:#e8b04a;font-weight:600}
.op-step-label{flex:1;color:#d8d5cf}
.op-step-status{color:#6f6c66;font-size:11.5px}
.op-allgood{display:flex;align-items:center;gap:9px;background:rgba(95,208,138,.08);border:1px solid rgba(95,208,138,.25);color:#5fd08a;font-size:13.5px;font-weight:600;padding:14px;border-radius:14px}
.op-alert{display:flex;align-items:center;gap:12px;background:#16161a;border:1px solid #26262c;border-radius:14px;padding:12px 14px;border-left:3px solid #e8b04a}
.op-alert.tone-err{border-left-color:#f07a7a}
.op-alert-icon{flex-shrink:0;color:#e8b04a}
.op-alert.tone-err .op-alert-icon{color:#f07a7a}
.op-alert-body{flex:1;min-width:0}
.op-alert-body strong{display:block;color:#f5f3ef;font-size:14px;font-weight:700}
.op-alert-reason{color:#c9a24a;font-size:12.5px;margin-top:3px}
.op-alert.tone-err .op-alert-reason{color:#f0a3a3}
.op-alert-wa{flex-shrink:0;background:rgba(95,208,138,.12);border:1px solid rgba(95,208,138,.3);color:#5fd08a;font-size:12px;font-weight:700;padding:8px 12px;border-radius:10px;text-decoration:none}
.op-tally{background:#16161a;border:1px solid #26262c;border-radius:14px;padding:14px}
.op-tally h4{display:flex;align-items:center;gap:7px;color:#f0c969;font-size:13px;font-weight:700;margin:0 0 10px}
.op-tally-row{display:flex;align-items:center;gap:10px;margin-bottom:8px}
.op-tally-name{flex-shrink:0;width:120px;color:#d8d5cf;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.op-tally-bar{flex:1;height:8px;background:#1d1d22;border-radius:100px;overflow:hidden}
.op-tally-bar>em{display:block;height:100%;background:linear-gradient(90deg,#d4a23c,#f0c969);border-radius:100px}
.op-tally-row b{color:#f5f3ef;font-size:13px;width:40px;text-align:right}
.op-note{color:#6f6c66;font-size:11.5px;line-height:1.5}
.op-note code{color:#a3a09a;background:#1d1d22;padding:1px 5px;border-radius:5px}
`;
