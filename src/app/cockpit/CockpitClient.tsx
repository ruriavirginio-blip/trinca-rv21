"use client";

import { createClient } from "@supabase/supabase-js";
import {
  Bot,
  ChevronRight,
  CircleDollarSign,
  Eye,
  Home,
  KeyRound,
  Loader2,
  Radio,
  RefreshCw,
  Send,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import OperacaoPage from "../operacao/page";

type TabKey = "hoje" | "leads" | "vendas" | "gastos" | "ao-vivo" | "ia";

type Lead = {
  id: string;
  nome: string | null;
  email: string | null;
  whatsapp: string | null;
  objetivo: string | null;
  status: string | null;
  utm_source: string | null;
  created_at: string;
  updated_at: string | null;
};

type CommentLead = {
  id: string;
  instagram_user_id: string;
  gatilho_ativado: string | null;
  dm_enviada: boolean | null;
  created_at: string;
};

type TwilioCredits = {
  balance: string;
  currency: string;
};

const GASTOS = [
  { nome: "Make.com", valor: 45, status: "ativo" },
  { nome: "Twilio WhatsApp", valor: 78.5, status: "ativo" },
  { nome: "Railway Worker", valor: 28, status: "ativo" },
  { nome: "Vercel", valor: 0, status: "gratuito" },
  { nome: "Supabase", valor: 0, status: "gratuito" },
  { nome: "Cloudinary", valor: 0, status: "gratuito" },
  { nome: "Meta Ads", valor: 0, status: "pausado" },
];

const authStorageKey = "trinca-rv21-cockpit-auth";
const operacaoTokenStorageKey = "trinca-rv21-operacao-token";
const saleValue = 37.89;
const leadGoal = 1000;

const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: "hoje", label: "Hoje", icon: <Home size={20} /> },
  { key: "leads", label: "Leads", icon: <Users size={20} /> },
  { key: "vendas", label: "Vendas", icon: <CircleDollarSign size={20} /> },
  { key: "gastos", label: "Gastos", icon: <WalletCards size={20} /> },
  { key: "ao-vivo", label: "Ao Vivo", icon: <Radio size={20} /> },
  { key: "ia", label: "IA", icon: <Bot size={20} /> },
];

function currency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function todayStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusColor(status: string) {
  if (status === "ativo" || status === "gratuito") return "#00E676";
  if (status === "pausado") return "#FFD740";
  return "#FF5252";
}

export default function CockpitClient({ cockpitPassword }: { cockpitPassword: string }) {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === "undefined") return false;

    const savedAuth = window.localStorage.getItem(authStorageKey);
    const expiresAt = savedAuth ? Number(JSON.parse(savedAuth).expiresAt || 0) : 0;

    return expiresAt > Date.now();
  });
  const [password, setPassword] = useState("");
  const [automationToken, setAutomationToken] = useState(() => {
    if (typeof window === "undefined") return "";

    return window.localStorage.getItem(operacaoTokenStorageKey) || "";
  });
  const [activeTab, setActiveTab] = useState<TabKey>("hoje");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [commentLeads, setCommentLeads] = useState<CommentLead[]>([]);
  const [twilio, setTwilio] = useState<TwilioCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [iaLoading, setIaLoading] = useState(false);
  const [iaAnalysis, setIaAnalysis] = useState("");
  const [iaError, setIaError] = useState("");

  useEffect(() => {
    if (automationToken) {
      window.sessionStorage.setItem(operacaoTokenStorageKey, automationToken);
    }
  }, [automationToken]);

  const metrics = useMemo(() => {
    const start = todayStart();
    const leadsToday = leads.filter((lead) => new Date(lead.created_at) >= start);
    const salesToday = leads.filter(
      (lead) => lead.status === "compra-aprovada" && lead.updated_at && new Date(lead.updated_at) >= start,
    );
    const revenueToday = salesToday.length * saleValue;
    const conversion = leadsToday.length ? (salesToday.length / leadsToday.length) * 100 : 0;
    const fixedCosts = GASTOS.reduce((sum, item) => sum + item.valor, 0);
    const netProfit = revenueToday - fixedCosts;
    const whatsappLeads = leadsToday.filter((lead) => Boolean(lead.whatsapp)).length;
    const commentLeadsToday = commentLeads.filter((lead) => new Date(lead.created_at) >= start);

    return {
      leadsToday,
      salesToday,
      revenueToday,
      conversion,
      fixedCosts,
      netProfit,
      whatsappLeads,
      commentLeadsToday,
      leadProgress: Math.min((leads.length / leadGoal) * 100, 100),
    };
  }, [commentLeads, leads]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setDataError("");

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL_PUBLIC;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const [{ data: leadsData, error: leadsError }, { data: commentsData, error: commentsError }, creditsResponse] =
        await Promise.all([
          supabase
            .from("leads")
            .select("id,nome,email,whatsapp,objetivo,status,utm_source,created_at,updated_at")
            .order("created_at", { ascending: false })
            .limit(250),
          supabase
            .from("comment_leads")
            .select("id,instagram_user_id,gatilho_ativado,dm_enviada,created_at")
            .order("created_at", { ascending: false })
            .limit(250),
          fetch("/api/twilio-credits"),
        ]);

      if (leadsError) throw new Error(leadsError.message);
      if (commentsError) throw new Error(commentsError.message);

      setLeads((leadsData || []) as Lead[]);
      setCommentLeads((commentsData || []) as CommentLead[]);

      if (creditsResponse.ok) {
        setTwilio((await creditsResponse.json()) as TwilioCredits);
      }
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      const timer = window.setTimeout(() => {
        void loadData();
      }, 0);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [isUnlocked, loadData]);

  function unlock() {
    if (password !== cockpitPassword) {
      setDataError("Senha incorreta.");
      return;
    }

    window.localStorage.setItem(
      authStorageKey,
      JSON.stringify({ expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }),
    );
    setDataError("");
    setIsUnlocked(true);
  }

  function saveAutomationToken(value: string) {
    setAutomationToken(value);
    window.localStorage.setItem(operacaoTokenStorageKey, value);
    window.sessionStorage.setItem(operacaoTokenStorageKey, value);
  }

  async function analyzeBusiness() {
    setIaLoading(true);
    setIaError("");
    setIaAnalysis("");

    try {
      const response = await fetch("/api/cockpit-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadsHoje: metrics.leadsToday.length,
          vendasHoje: metrics.salesToday.length,
          faturamentoHoje: metrics.revenueToday,
          conversao: metrics.conversion,
          gastosFixos: metrics.fixedCosts,
          lucroLiquido: metrics.netProfit,
          twilio,
          commentLeadsHoje: metrics.commentLeadsToday.length,
          totalLeads: leads.length,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao analisar.");
      }

      setIaAnalysis(data.analysis || "");
    } catch (error) {
      setIaError(error instanceof Error ? error.message : "Falha ao chamar IA.");
    } finally {
      setIaLoading(false);
    }
  }

  if (!isUnlocked) {
    return (
      <main className="cockpit">
        <section className="login-card">
          <div className="login-icon">
            <KeyRound size={28} />
          </div>
          <p className="eyebrow">COCKPIT RV21</p>
          <h1>Entrar no painel</h1>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") unlock();
            }}
            placeholder="Senha do Cockpit"
          />
          {dataError ? <p className="error">{dataError}</p> : null}
          <button onClick={unlock}>Acessar</button>
        </section>
        <CockpitStyles />
      </main>
    );
  }

  return (
    <main className="cockpit">
      <header className="topbar">
        <div>
          <p className="eyebrow">COCKPIT RV21</p>
          <h1>Inteligência do lançamento</h1>
        </div>
        <button className="icon-btn" onClick={() => void loadData()} aria-label="Atualizar">
          {loading ? <Loader2 className="spin" size={20} /> : <RefreshCw size={20} />}
        </button>
      </header>

      {dataError ? <div className="notice">{dataError}</div> : null}

      <section className="content">
        {activeTab === "hoje" ? (
          <DashboardSection
            title="Hoje"
            description="Pulso do dia em leads, vendas, acessos sociais e WhatsApp."
            loading={loading}
          >
            <MetricGrid
              items={[
                { label: "Leads hoje", value: String(metrics.leadsToday.length), tone: "purple" },
                { label: "Vendas hoje", value: String(metrics.salesToday.length), tone: "green" },
                { label: "Faturamento", value: currency(metrics.revenueToday), tone: "yellow" },
                { label: "WhatsApp", value: String(metrics.whatsappLeads), tone: "green" },
              ]}
            />
            <MiniCard title="Comentários com gatilho" value={String(metrics.commentLeadsToday.length)} />
          </DashboardSection>
        ) : null}

        {activeTab === "leads" ? (
          <DashboardSection title="Leads" description="Meta de 1.000 leads e últimas entradas captadas." loading={loading}>
            <div className="progress-card">
              <div>
                <strong>{leads.length}</strong>
                <span>de {leadGoal} leads</span>
              </div>
              <div className="progress">
                <span style={{ width: `${metrics.leadProgress}%` }} />
              </div>
            </div>
            <LeadList leads={leads} commentLeads={commentLeads} />
          </DashboardSection>
        ) : null}

        {activeTab === "vendas" ? (
          <DashboardSection title="Vendas" description="Conversão, receita e projeção do dia." loading={loading}>
            <MetricGrid
              items={[
                { label: "Conversão", value: `${metrics.conversion.toFixed(1)}%`, tone: "purple" },
                { label: "Vendas", value: String(metrics.salesToday.length), tone: "green" },
                { label: "Ticket", value: currency(saleValue), tone: "yellow" },
                { label: "Receita", value: currency(metrics.revenueToday), tone: "green" },
              ]}
            />
            <MiniCard title="Projeção se dobrar leads hoje" value={currency(metrics.revenueToday * 2)} />
          </DashboardSection>
        ) : null}

        {activeTab === "gastos" ? (
          <DashboardSection title="Gastos" description="Assinaturas, créditos e lucro líquido operacional." loading={loading}>
            <MetricGrid
              items={[
                { label: "Gasto fixo", value: currency(metrics.fixedCosts), tone: "red" },
                { label: "Lucro líquido", value: currency(metrics.netProfit), tone: metrics.netProfit >= 0 ? "green" : "red" },
                { label: "Twilio", value: twilio ? `${twilio.currency} ${twilio.balance}` : "Sem saldo", tone: "yellow" },
              ]}
            />
            <div className="list">
              {GASTOS.map((item) => (
                <div className="list-row" key={item.nome}>
                  <div>
                    <strong>{item.nome}</strong>
                    <span style={{ color: statusColor(item.status) }}>{item.status}</span>
                  </div>
                  <b>{currency(item.valor)}</b>
                </div>
              ))}
            </div>
          </DashboardSection>
        ) : null}

        {activeTab === "ao-vivo" ? (
          <DashboardSection title="Ao Vivo" description="Painel operacional atual integrado no Cockpit." loading={false}>
            <div className="token-card">
              <Eye size={18} />
              <input
                value={automationToken}
                onChange={(event) => saveAutomationToken(event.target.value)}
                placeholder="Cole o AUTOMATION_API_SECRET uma vez"
              />
            </div>
            <div className="live-frame">
              <OperacaoPage />
            </div>
          </DashboardSection>
        ) : null}

        {activeTab === "ia" ? (
          <DashboardSection title="IA" description="Análise simples do negócio com Claude." loading={false}>
            <button className="primary" disabled={iaLoading} onClick={() => void analyzeBusiness()}>
              {iaLoading ? <Loader2 className="spin" size={18} /> : <Send size={18} />}
              Analisar meu negócio agora
            </button>
            {iaError ? <div className="notice">{iaError}</div> : null}
            {iaAnalysis ? <article className="analysis">{iaAnalysis}</article> : null}
          </DashboardSection>
        ) : null}
      </section>

      <nav className="bottom-nav">
        {tabs.map((tab) => (
          <button
            className={activeTab === tab.key ? "active" : ""}
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <CockpitStyles />
    </main>
  );
}

function DashboardSection({
  title,
  description,
  loading,
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="dash-section">
      <div className="section-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {loading ? <Loader2 className="spin" size={18} /> : <ChevronRight size={18} />}
      </div>
      {children}
    </section>
  );
}

function MetricGrid({
  items,
}: {
  items: Array<{ label: string; value: string; tone: "purple" | "green" | "red" | "yellow" }>;
}) {
  return (
    <div className="metric-grid">
      {items.map((item) => (
        <div className={`metric ${item.tone}`} key={item.label}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}

function MiniCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="mini-card">
      <TrendingUp size={18} />
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function LeadList({ leads, commentLeads }: { leads: Lead[]; commentLeads: CommentLead[] }) {
  return (
    <div className="list">
      {leads.slice(0, 12).map((lead) => (
        <div className="list-row" key={lead.id}>
          <div>
            <strong>{lead.nome || lead.email || "Lead sem nome"}</strong>
            <span>
              {lead.utm_source || "origem direta"} · {lead.objetivo || "sem objetivo"} · {dateLabel(lead.created_at)}
            </span>
          </div>
          <b>{lead.status || "novo"}</b>
        </div>
      ))}
      {commentLeads.slice(0, 6).map((lead) => (
        <div className="list-row comment" key={lead.id}>
          <div>
            <strong>Comentário: {lead.gatilho_ativado || "gatilho"}</strong>
            <span>
              Instagram {lead.instagram_user_id} · DM {lead.dm_enviada ? "enviada" : "pendente"}
            </span>
          </div>
          <b>{dateLabel(lead.created_at)}</b>
        </div>
      ))}
    </div>
  );
}

function CockpitStyles() {
  return (
    <style jsx global>{`
      body {
        background: #0a0a0f;
      }

      .cockpit {
        min-height: 100vh;
        background: #0a0a0f;
        color: #fff;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        padding: 20px 16px calc(96px + env(safe-area-inset-bottom));
      }

      .login-card,
      .dash-section,
      .metric,
      .mini-card,
      .progress-card,
      .token-card {
        background: #13131a;
        border: 1px solid #1e1e2e;
        border-radius: 16px;
      }

      .login-card {
        width: min(420px, 100%);
        margin: 12vh auto 0;
        padding: 28px;
      }

      .login-icon {
        width: 54px;
        height: 54px;
        border-radius: 16px;
        background: rgba(124, 77, 255, 0.18);
        color: #7c4dff;
        display: grid;
        place-items: center;
        margin-bottom: 18px;
      }

      .eyebrow {
        color: #7c4dff;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.14em;
        margin: 0 0 6px;
        text-transform: uppercase;
      }

      .login-card h1,
      .topbar h1,
      .section-head h2 {
        margin: 0;
        letter-spacing: 0;
      }

      .login-card input,
      .token-card input {
        width: 100%;
        border: 1px solid #1e1e2e;
        border-radius: 12px;
        background: #0a0a0f;
        color: #fff;
        font: inherit;
        margin-top: 18px;
        padding: 14px;
      }

      .login-card button,
      .primary,
      .icon-btn {
        border: 0;
        border-radius: 14px;
        background: #7c4dff;
        color: #fff;
        cursor: pointer;
        font: inherit;
        font-weight: 800;
      }

      .login-card button,
      .primary {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin-top: 16px;
        padding: 15px;
      }

      .topbar {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: center;
        margin-bottom: 18px;
      }

      .icon-btn {
        width: 44px;
        height: 44px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }

      .content {
        max-width: 920px;
        margin: 0 auto;
      }

      .dash-section {
        padding: 18px;
      }

      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 14px;
        margin-bottom: 16px;
      }

      .section-head p,
      .metric span,
      .mini-card span,
      .list-row span {
        color: rgba(255, 255, 255, 0.62);
      }

      .metric-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .metric {
        min-height: 108px;
        padding: 16px;
      }

      .metric strong {
        display: block;
        font-size: 26px;
        margin-top: 12px;
      }

      .metric.purple strong {
        color: #7c4dff;
      }

      .metric.green strong {
        color: #00e676;
      }

      .metric.red strong {
        color: #ff5252;
      }

      .metric.yellow strong {
        color: #ffd740;
      }

      .mini-card,
      .progress-card,
      .token-card {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-top: 12px;
        padding: 16px;
      }

      .progress-card {
        display: block;
      }

      .progress-card strong {
        font-size: 34px;
        color: #00e676;
        margin-right: 8px;
      }

      .progress {
        height: 10px;
        border-radius: 999px;
        background: #0a0a0f;
        margin-top: 14px;
        overflow: hidden;
      }

      .progress span {
        display: block;
        height: 100%;
        background: linear-gradient(90deg, #7c4dff, #00e676);
      }

      .list {
        display: grid;
        gap: 10px;
        margin-top: 14px;
      }

      .list-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        border: 1px solid #1e1e2e;
        border-radius: 14px;
        padding: 14px;
      }

      .list-row span {
        display: block;
        font-size: 12px;
        margin-top: 4px;
      }

      .list-row b {
        color: #ffd740;
        font-size: 12px;
        text-align: right;
      }

      .list-row.comment b {
        color: #7c4dff;
      }

      .token-card input {
        margin: 0;
      }

      .live-frame {
        border: 1px solid #1e1e2e;
        border-radius: 16px;
        margin-top: 14px;
        max-height: 72vh;
        overflow: auto;
      }

      .analysis {
        white-space: pre-wrap;
        background: #13131a;
        border: 1px solid #1e1e2e;
        border-radius: 16px;
        line-height: 1.65;
        margin-top: 14px;
        padding: 16px;
      }

      .notice,
      .error {
        background: rgba(255, 82, 82, 0.12);
        border: 1px solid rgba(255, 82, 82, 0.35);
        border-radius: 14px;
        color: #ff8a80;
        margin: 12px auto;
        max-width: 920px;
        padding: 12px 14px;
      }

      .bottom-nav {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 50;
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 4px;
        background: rgba(10, 10, 15, 0.94);
        border-top: 1px solid #1e1e2e;
        padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
        backdrop-filter: blur(16px);
      }

      .bottom-nav button {
        background: transparent;
        border: 0;
        border-radius: 12px;
        color: rgba(255, 255, 255, 0.58);
        display: grid;
        gap: 4px;
        justify-items: center;
        min-width: 0;
        padding: 8px 2px;
      }

      .bottom-nav button.active {
        background: rgba(124, 77, 255, 0.18);
        color: #fff;
      }

      .bottom-nav span {
        font-size: 10px;
        font-weight: 800;
      }

      .spin {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      @media (min-width: 720px) {
        .cockpit {
          padding: 28px 28px 110px;
        }

        .metric-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }
    `}</style>
  );
}
