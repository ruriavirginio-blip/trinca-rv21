"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  Film,
  FlaskConical,
  ListChecks,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Timer,
  Users,
  XCircle,
} from "lucide-react";

type DashboardData = {
  ok: boolean;
  checked_at: string;
  launch_readiness: {
    launch_ready: boolean;
    blockers: Array<{ key: string; label: string; reason: string }>;
    warnings: Array<{ key: string; label: string; reason: string }>;
  };
  metrics: {
    total_leads: number;
    leads_24h: number;
    kiwify_events: number;
    messages_total: number;
    waiting_clicks: number;
    errors: number;
    group_links_sent: number;
    payment_confirmed: number;
    payment_not_confirmed: number;
    needs_attention: number;
    by_source: Array<{ label: string; count: number }>;
  };
  campaign_links: Array<{ label: string; url: string }>;
  leads: LeadRow[];
};

type LeadRow = {
  id: string;
  nome: string;
  email: string;
  whatsapp: string;
  objetivo: string;
  status: string;
  etapa_funil: string;
  capturado_em: string;
  source: { label: string; campaign: string };
  progress: { completed: number; total: number; percent: number };
  current_stage: { key: string; label: string };
  payment: { key: string; label: string; confirmed: boolean };
  dropoff: { key: string; label: string; needs_attention: boolean };
  operational_alert: null | {
    key: string;
    label: string;
    detail: string;
    minutes: number;
  };
  latest_activity_at: string;
  journey: Array<{
    key: string;
    label: string;
    status: string;
    status_label: string;
    completed: boolean;
    waiting: boolean;
    failed: boolean;
  }>;
  latest_kiwify_event: null | {
    evento: string;
    status: string;
    order_id: string;
    received_at: string;
  };
  messages: {
    total: number;
    sent: number;
    pending: number;
    waiting_click: number;
    errors: number;
    timeline: Array<{
      etapa: string;
      etapa_label: string;
      status: string;
      status_label: string;
      trigger_event: string;
      mensagem: string;
      enviar_em: string;
      created_at: string;
      sent_at: string;
      twilio_message_ids: string[];
      twilio_template: string;
    }>;
  };
  latest_interaction: null | {
    button_payload: string;
    button_text: string;
    received_at: string;
  };
};

type FlowTestResult = {
  ok: boolean;
  checked_at: string;
  lead: { email: string; phone: string; order_id: string };
  cleaned?: boolean;
  steps: Array<{
    key: string;
    label: string;
    status: "ok" | "failed";
    detail: string;
  }>;
  final_messages?: Array<{ etapa: string; status: string }>;
};

type PanelSimulationResult = {
  ok: boolean;
  checked_at: string;
  delay_seconds: number;
  lead: { email: string; phone: string; order_id: string; objetivo: string };
  note?: string;
  steps: Array<{
    etapa: string;
    label: string;
    at: string;
    elapsed_seconds: number;
    detail: string;
  }>;
};

const tokenStorageKey = "trinca-rv21-operacao-token";

function formatDate(value: string) {
  if (!value) {
    return "Sem data";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: string) {
  if (
    [
      "enviada",
      "entregue",
      "lida",
      "concluida",
      "compra-aprovada",
      "grupo-liberado",
      "confirmado",
      "concluiu-fluxo",
    ].includes(status)
  ) {
    return "is-ok";
  }

  if (
    [
      "erro",
      "invalid",
      "missing",
      "recusado",
      "desistiu-checkout",
      "sem-pagamento",
      "travou-no-clique",
      "erro-operacional",
    ].includes(status)
  ) {
    return "is-danger";
  }

  if (
    [
      "aguardando-clique",
      "pendente",
      "sem-evento-kiwify",
      "proxima-mensagem",
      "evento-kiwify",
      "andamento-normal",
    ].includes(status)
  ) {
    return "is-waiting";
  }

  return "";
}

export default function OperacaoPage() {
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return (
      new URLSearchParams(window.location.search).get("token") ||
      sessionStorage.getItem(tokenStorageKey) ||
      ""
    );
  });
  const shouldAutoLoad = useRef(
    typeof window !== "undefined" &&
      Boolean(
        new URLSearchParams(window.location.search).get("token") ||
          sessionStorage.getItem(tokenStorageKey)
      )
  );
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [flowTest, setFlowTest] = useState<FlowTestResult | null>(null);
  const [flowTestLoading, setFlowTestLoading] = useState(false);
  const [flowTestError, setFlowTestError] = useState("");
  const [panelSimulation, setPanelSimulation] = useState<PanelSimulationResult | null>(null);
  const [panelSimulationLoading, setPanelSimulationLoading] = useState(false);
  const [panelSimulationError, setPanelSimulationError] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState("");
  const integrationLinks = useMemo(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const cleanToken = token.trim();
    const tokenQuery = cleanToken ? `?token=${encodeURIComponent(cleanToken)}` : "";
    const baseUrl = window.location.origin;

    return [
      {
        label: "Webhook Kiwify",
        description: "Cole esta URL no webhook de vendas da Kiwify.",
        url: `${baseUrl}/api/kiwify/webhook${tokenQuery}`,
      },
      {
        label: "Webhook Twilio",
        description: "Cole esta URL no inbound/status webhook do WhatsApp Twilio.",
        url: `${baseUrl}/api/twilio/webhook${tokenQuery}`,
      },
      {
        label: "Readiness",
        description: "Diagnostico tecnico completo do ambiente publicado.",
        url: `${baseUrl}/api/automation/readiness${tokenQuery}`,
      },
      {
        label: "Teste controlado",
        description: "Endpoint que valida a sequencia protegida por cliques.",
        url: `${baseUrl}/api/automation/flow-test${tokenQuery}`,
      },
      {
        label: "Simulação no painel",
        description: "Cria uma lead ficticia e avanca o fluxo para acompanhamento ao vivo.",
        url: `${baseUrl}/api/automation/panel-simulation${tokenQuery}`,
      },
      {
        label: "Motor da automação",
        description: "Executa recuperacao de leads e disparo das mensagens pendentes.",
        url: `${baseUrl}/api/automation/run${tokenQuery}`,
      },
    ];
  }, [token]);

  const absoluteCampaignLinks = useMemo(() => {
    if (!data || typeof window === "undefined") {
      return [];
    }

    return data.campaign_links.map((link) => ({
      ...link,
      url: new URL(link.url, window.location.origin).toString(),
    }));
  }, [data]);
  const operationBriefing = useMemo(() => {
    if (!data) {
      return [];
    }

    const briefing = [];

    if (data.launch_readiness.blockers.length) {
      briefing.push({
        key: "blockers",
        tone: "danger",
        title: "Ambiente ainda tem bloqueios",
        body: `${data.launch_readiness.blockers.length} item(ns) precisam ser resolvidos antes do lancamento oficial.`,
      });
    } else {
      briefing.push({
        key: "ready",
        tone: "ok",
        title: "Base operacional sem bloqueios criticos",
        body: "O painel conseguiu ler o ambiente e a automacao principal esta estruturada.",
      });
    }

    if (data.metrics.needs_attention > 0) {
      briefing.push({
        key: "attention",
        tone: "danger",
        title: "Leads exigem acompanhamento",
        body: `${data.metrics.needs_attention} lead(s) estao com erro, sem pagamento ou paradas em alguma etapa.`,
      });
    }

    if (data.metrics.waiting_clicks > 0) {
      briefing.push({
        key: "clicks",
        tone: "waiting",
        title: "Existem cliques pendentes",
        body: `${data.metrics.waiting_clicks} mensagem(ns) estao aguardando a lead tocar no botao correto.`,
      });
    }

    if (data.metrics.payment_not_confirmed > 0) {
      briefing.push({
        key: "payments",
        tone: "waiting",
        title: "Pagamentos ainda nao confirmados",
        body: `${data.metrics.payment_not_confirmed} lead(s) ainda nao tiveram compra aprovada pela Kiwify.`,
      });
    }

    if (data.metrics.group_links_sent > 0) {
      briefing.push({
        key: "group",
        tone: "ok",
        title: "Leads chegaram ao grupo",
        body: `${data.metrics.group_links_sent} lead(s) ja receberam o link final do Grupo Oficial.`,
      });
    }

    return briefing;
  }, [data]);
  const launchChecklist = useMemo(() => {
    if (!data) {
      return [];
    }

    const blockers = new Set(data.launch_readiness.blockers.map((item) => item.key));

    return [
      {
        group: "Vídeos",
        icon: Film,
        items: [
          {
            key: "TRINCA_WELCOME_VIDEO_URL",
            label: "Boas-vindas pós-compra",
            detail: "Vídeo enviado depois do clique Estou pronta.",
          },
          {
            key: "TRINCA_ABANDONMENT_VIDEO_URL",
            label: "Recuperação de pagamento",
            detail: "Vídeo usado em abandono, pendência ou pagamento recusado.",
          },
          {
            key: "TRINCA_GROUP_WELCOME_VIDEO_URL",
            label: "Boas-vindas ao grupo",
            detail: "Vídeo enviado antes do link do Grupo Oficial.",
          },
        ],
      },
      {
        group: "Ebooks e materiais",
        icon: BookOpen,
        items: [
          {
            key: "TRINCA_EBOOK_RV_URL",
            label: "Ebook RV",
            detail: "PDF oficial de mentalidade, rotina e constância.",
          },
          {
            key: "TRINCA_EBOOK_NUTRITION_URL",
            label: "Ebook Nutricional",
            detail: "PDF oficial de orientação nutricional.",
          },
          {
            key: "TRINCA_MATERIALS_URL",
            label: "Central de materiais",
            detail: "Página online de materiais da aluna.",
          },
        ],
      },
      {
        group: "Dieta e treino",
        icon: ListChecks,
        items: [
          {
            key: "TRINCA_DIET_URL",
            label: "Área dieta/treino",
            detail: "Página online com placeholders por objetivo.",
          },
          {
            key: "dietas-por-objetivo",
            label: "Arquivos por objetivo",
            detail: "Emagrecimento, glúteos/firmeza, autoestima e roupas antigas.",
            manualPending: true,
          },
          {
            key: "treinos-por-objetivo",
            label: "Treinos oficiais",
            detail: "Protocolos finais dos 21 dias.",
            manualPending: true,
          },
        ],
      },
      {
        group: "Twilio final",
        icon: ShieldCheck,
        items: [
          {
            key: "TWILIO_ACCOUNT_SID",
            label: "Conta Twilio",
            detail: "Credencial necessária para disparo real.",
          },
          {
            key: "TWILIO_SENDER",
            label: "Remetente WhatsApp",
            detail: "Número ou Messaging Service oficial do TRINCA RV21.",
          },
          {
            key: "TWILIO_CONTENT_SID_GRUPO_OFICIAL_LINK",
            label: "Template link do grupo",
            detail: "Template final para envio do link oficial.",
          },
        ],
      },
    ].map((section) => ({
      ...section,
      items: section.items.map((item) => ({
        ...item,
        done: !item.manualPending && !blockers.has(item.key),
      })),
    }));
  }, [data]);

  const loadDashboard = useCallback(async (
    nextToken?: string,
    options: { silent?: boolean } = {}
  ) => {
    const cleanToken = (nextToken ?? token).trim();

    if (!cleanToken) {
      setError("Informe o token da automação para abrir o painel.");
      return;
    }

    if (!options.silent) {
      setLoading(true);
    }

    setError("");

    try {
      const response = await fetch(
        `/api/automation/dashboard?token=${encodeURIComponent(cleanToken)}&limit=120`
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Nao foi possivel carregar o painel.");
      }

      sessionStorage.setItem(tokenStorageKey, cleanToken);
      setData(payload);
      setLastLoadedAt(new Date().toISOString());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro desconhecido.");
    } finally {
      if (!options.silent) {
        setLoading(false);
      }
    }
  }, [token]);

  async function copyLink(label: string, url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(label);
    window.setTimeout(() => setCopied(""), 1600);
  }

  async function runFlowTest() {
    const cleanToken = token.trim();

    if (!cleanToken) {
      setFlowTestError("Informe o token da automação antes de rodar o teste.");
      return;
    }

    setFlowTestLoading(true);
    setFlowTestError("");
    setFlowTest(null);

    try {
      const response = await fetch(
        `/api/automation/flow-test?token=${encodeURIComponent(cleanToken)}`,
        { method: "POST" }
      );
      const payload = await response.json();

      if (!response.ok) {
        setFlowTest(payload);
        throw new Error(payload.error || "O teste controlado encontrou uma falha.");
      }

      setFlowTest(payload);
      sessionStorage.setItem(tokenStorageKey, cleanToken);
    } catch (testError) {
      setFlowTestError(
        testError instanceof Error ? testError.message : "Erro desconhecido no teste."
      );
    } finally {
      setFlowTestLoading(false);
    }
  }

  async function runPanelSimulation() {
    const cleanToken = token.trim();

    if (!cleanToken) {
      setPanelSimulationError("Informe o token da automação antes de rodar a simulação.");
      return;
    }

    setPanelSimulationLoading(true);
    setPanelSimulationError("");
    setPanelSimulation(null);

    try {
      sessionStorage.setItem(tokenStorageKey, cleanToken);
      const response = await fetch(
        `/api/automation/panel-simulation?token=${encodeURIComponent(cleanToken)}&delay_seconds=5`,
        { method: "POST" }
      );
      const payload = await response.json();

      if (!response.ok) {
        setPanelSimulation(payload);
        throw new Error(payload.error || "A simulação do painel encontrou uma falha.");
      }

      setPanelSimulation(payload);
      await loadDashboard(cleanToken, { silent: true });
    } catch (simulationError) {
      setPanelSimulationError(
        simulationError instanceof Error ? simulationError.message : "Erro desconhecido na simulação."
      );
    } finally {
      setPanelSimulationLoading(false);
    }
  }

  useEffect(() => {
    if (shouldAutoLoad.current && token) {
      shouldAutoLoad.current = false;

      if (new URLSearchParams(window.location.search).get("token")) {
        window.history.replaceState(null, "", window.location.pathname);
      }

      void loadDashboard(token);
    }
  }, [loadDashboard, token]);

  useEffect(() => {
    if (!autoRefresh || !token.trim()) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadDashboard(token, { silent: true });
    }, 10000);

    return () => window.clearInterval(interval);
  }, [autoRefresh, loadDashboard, token]);

  return (
    <main className="ops-page">
      <header className="ops-header">
        <Link className="student-back" href="/">
          <ArrowLeft size={16} />
          Voltar para landing
        </Link>
        <div>
          <p className="eyebrow">Painel operacional</p>
          <h1>Fluxo TRINCA RV21 em tempo real.</h1>
          <p>
            Acompanhe cada lead desde a landing até o envio final do link do grupo,
            com origem de tráfego, etapa atual, mensagens e bloqueios.
          </p>
        </div>
      </header>

      <section className="ops-token">
        <label>
          Token da automação
          <input
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="Cole o AUTOMATION_API_SECRET"
            type="password"
          />
        </label>
        <button className="button button-primary" type="button" onClick={() => loadDashboard()} disabled={loading}>
          {loading ? <Loader2 size={18} className="spin" /> : <RefreshCw size={18} />}
          Atualizar painel
        </button>
        <button
          className={`button ${autoRefresh ? "button-secondary is-live" : "button-secondary"}`}
          type="button"
          onClick={() => setAutoRefresh((current) => !current)}
        >
          <Timer size={18} />
          {autoRefresh ? "Ao vivo 10s" : "Ao vivo pausado"}
        </button>
      </section>

      {error ? (
        <section className="ops-alert">
          <AlertTriangle size={22} />
          <p>{error}</p>
        </section>
      ) : null}

      {data ? (
        <>
          <section className="ops-command">
            <article className="ops-panel ops-command-main">
              <div className="ops-panel-title">
                <ListChecks size={20} />
                <h2>Leitura rápida da operação</h2>
              </div>
              <div className="ops-briefing-list">
                {operationBriefing.map((item) => (
                  <div className={`ops-briefing is-${item.tone}`} key={item.key}>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="ops-live-strip" aria-label="Estado do painel">
            <article>
              <span>Status do painel</span>
              <strong>{autoRefresh ? "Atualizando automaticamente" : "Atualização manual"}</strong>
            </article>
            <article>
              <span>Última leitura local</span>
              <strong>{lastLoadedAt ? formatDate(lastLoadedAt) : formatDate(data.checked_at)}</strong>
            </article>
            <article>
              <span>Problemas agora</span>
              <strong className={data.metrics.needs_attention ? "is-danger" : "is-ok"}>
                {data.metrics.needs_attention}
              </strong>
            </article>
          </section>

          <section className="ops-deploy-grid">
            <article className="ops-panel ops-readiness-list">
              <div className="ops-panel-title">
                <ShieldCheck size={20} />
                <h2>Bloqueios de lançamento</h2>
              </div>
              {data.launch_readiness.blockers.length || data.launch_readiness.warnings.length ? (
                <div className="ops-readiness-items">
                  {data.launch_readiness.blockers.map((item) => (
                    <div className="ops-readiness-item is-danger" key={`blocker-${item.key}`}>
                      <strong>{item.label}</strong>
                      <span>{item.reason || "Precisa de ajuste antes do lançamento."}</span>
                    </div>
                  ))}
                  {data.launch_readiness.warnings.map((item) => (
                    <div className="ops-readiness-item is-waiting" key={`warning-${item.key}`}>
                      <strong>{item.label}</strong>
                      <span>{item.reason || "Aviso operacional."}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Nenhum bloqueio técnico no ambiente atual.</p>
              )}
            </article>

            <article className="ops-panel ops-links ops-integration-links">
              <div className="ops-panel-title">
                <ExternalLink size={20} />
                <h2>URLs de integração</h2>
              </div>
              {integrationLinks.map((link) => (
                <button type="button" key={link.label} onClick={() => copyLink(link.label, link.url)}>
                  <span>
                    <strong>{link.label}</strong>
                    <small>{link.description}</small>
                  </span>
                  <Copy size={16} />
                </button>
              ))}
              {copied ? <p className="ops-copy-note">{copied} copiado.</p> : null}
            </article>
          </section>

          <section className="ops-flow-test">
            <article className="ops-panel">
              <div className="ops-flow-test-head">
                <div className="ops-panel-title">
                  <FlaskConical size={20} />
                  <h2>Teste controlado do fluxo</h2>
                </div>
                <div className="ops-flow-actions">
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={runFlowTest}
                    disabled={flowTestLoading || panelSimulationLoading}
                  >
                    {flowTestLoading ? <Loader2 size={18} className="spin" /> : <RefreshCw size={18} />}
                    Rodar teste técnico
                  </button>
                  <button
                    className="button button-primary"
                    type="button"
                    onClick={runPanelSimulation}
                    disabled={flowTestLoading || panelSimulationLoading}
                  >
                    {panelSimulationLoading ? <Loader2 size={18} className="spin" /> : <Timer size={18} />}
                    Simular ao vivo
                  </button>
                </div>
              </div>
              <p>
                O teste técnico valida a lógica e limpa a lead. A simulação ao vivo cria
                uma lead fictícia para você acompanhar a jornada no painel em tempo real.
              </p>

              {flowTestError ? (
                <div className="ops-inline-alert">
                  <AlertTriangle size={18} />
                  <span>{flowTestError}</span>
                </div>
              ) : null}

              {panelSimulationError ? (
                <div className="ops-inline-alert">
                  <AlertTriangle size={18} />
                  <span>{panelSimulationError}</span>
                </div>
              ) : null}

              {flowTest ? (
                <div className="ops-flow-result">
                  <div className={`ops-flow-status ${flowTest.ok ? "is-ok" : "is-danger"}`}>
                    {flowTest.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    <strong>
                      {flowTest.ok ? "Fluxo controlado aprovado" : "Fluxo controlado com falha"}
                    </strong>
                    <span>{formatDate(flowTest.checked_at)}</span>
                  </div>
                  <ol>
                    {flowTest.steps.map((step) => (
                      <li key={`${step.key}-${step.label}`} className={`is-${step.status}`}>
                        {step.status === "ok" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        <span>
                          <strong>{step.label}</strong>
                          <small>{step.detail}</small>
                        </span>
                      </li>
                    ))}
                  </ol>
                  {flowTest.cleaned ? (
                    <small className="ops-flow-cleanup">
                      Lead de teste removida automaticamente após a validação.
                    </small>
                  ) : null}
                </div>
              ) : null}

              {panelSimulation ? (
                <div className="ops-flow-result">
                  <div className={`ops-flow-status ${panelSimulation.ok ? "is-ok" : "is-danger"}`}>
                    {panelSimulation.ok ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    <strong>
                      {panelSimulation.ok ? "Simulação visível no painel concluída" : "Simulação com falha"}
                    </strong>
                    <span>{formatDate(panelSimulation.checked_at)}</span>
                  </div>
                  <p className="ops-flow-cleanup">
                    Lead: {panelSimulation.lead.email} | Objetivo: {panelSimulation.lead.objetivo}
                  </p>
                  <ol>
                    {panelSimulation.steps.map((step) => (
                      <li key={`${step.etapa}-${step.elapsed_seconds}`} className="is-ok">
                        <CheckCircle2 size={16} />
                        <span>
                          <strong>{step.label}</strong>
                          <small>
                            +{step.elapsed_seconds}s | {step.detail}
                          </small>
                        </span>
                      </li>
                    ))}
                  </ol>
                  {panelSimulation.note ? (
                    <small className="ops-flow-cleanup">{panelSimulation.note}</small>
                  ) : null}
                </div>
              ) : null}
            </article>
          </section>

          <section className="ops-content-checklist">
            <div className="ops-section-title">
              <h2>Pendências premium antes do lançamento</h2>
              <p>Conteúdos e configurações finais para fechar 100%.</p>
            </div>
            <div className="ops-content-grid">
              {launchChecklist.map((section) => {
                const Icon = section.icon;
                const completed = section.items.filter((item) => item.done).length;

                return (
                  <article className="ops-panel ops-content-card" key={section.group}>
                    <div className="ops-panel-title">
                      <Icon size={20} />
                      <h2>{section.group}</h2>
                    </div>
                    <p>
                      {completed}/{section.items.length} itens prontos
                    </p>
                    <div className="ops-content-items">
                      {section.items.map((item) => (
                        <div className={item.done ? "is-ok" : "is-waiting"} key={item.key}>
                          {item.done ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                          <span>
                            <strong>{item.label}</strong>
                            <small>{item.detail}</small>
                          </span>
                        </div>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="ops-metrics" aria-label="Métricas principais">
            <article>
              <Users size={22} />
              <span>Total de leads</span>
              <strong>{data.metrics.total_leads}</strong>
            </article>
            <article>
              <Timer size={22} />
              <span>Leads 24h</span>
              <strong>{data.metrics.leads_24h}</strong>
            </article>
            <article>
              <BarChart3 size={22} />
              <span>Pagaram</span>
              <strong>{data.metrics.payment_confirmed}</strong>
            </article>
            <article>
              <AlertTriangle size={22} />
              <span>Sem pagamento confirmado</span>
              <strong>{data.metrics.payment_not_confirmed}</strong>
            </article>
            <article>
              <Eye size={22} />
              <span>Precisam atenção</span>
              <strong>{data.metrics.needs_attention}</strong>
            </article>
            <article>
              <CheckCircle2 size={22} />
              <span>Grupo liberado</span>
              <strong>{data.metrics.group_links_sent}</strong>
            </article>
          </section>

          <section className="ops-grid">
            <article className="ops-panel">
              <div className="ops-panel-title">
                <ShieldCheck size={20} />
                <h2>Status de lançamento</h2>
              </div>
              <p className={`ops-badge ${data.launch_readiness.launch_ready ? "is-ok" : "is-danger"}`}>
                {data.launch_readiness.launch_ready ? "Pronto para lançamento" : "Ainda com bloqueios"}
              </p>
              <p>
                {data.launch_readiness.blockers.length} bloqueios e{" "}
                {data.launch_readiness.warnings.length} avisos no ambiente atual.
              </p>
            </article>

            <article className="ops-panel">
              <div className="ops-panel-title">
                <BarChart3 size={20} />
                <h2>Origem dos leads</h2>
              </div>
              <div className="ops-source-list">
                {data.metrics.by_source.length ? (
                  data.metrics.by_source.map((source) => (
                    <span key={source.label}>
                      {source.label}
                      <strong>{source.count}</strong>
                    </span>
                  ))
                ) : (
                  <p>Nenhum lead rastreado ainda.</p>
                )}
              </div>
            </article>

            <article className="ops-panel ops-links">
              <div className="ops-panel-title">
                <ExternalLink size={20} />
                <h2>Links para Instagram</h2>
              </div>
              {absoluteCampaignLinks.map((link) => (
                <button type="button" key={link.label} onClick={() => copyLink(link.label, link.url)}>
                  <span>{link.label}</span>
                  <Copy size={16} />
                </button>
              ))}
              {copied ? <p className="ops-copy-note">{copied} copiado.</p> : null}
            </article>
          </section>

          <section className="ops-leads">
            <div className="ops-section-title">
              <h2>Jornada por lead</h2>
              <p>Última atualização: {formatDate(data.checked_at)}</p>
            </div>

            <div className="ops-lead-list">
              {data.leads.length ? data.leads.map((lead) => (
                <article className="ops-lead-card" key={lead.id || lead.email}>
                  <div className="ops-lead-main">
                    <div>
                      <h3>{lead.nome || "Lead sem nome"}</h3>
                      <p>{lead.email}</p>
                      <span>{lead.whatsapp}</span>
                    </div>
                    <div className="ops-lead-stage">
                      <span className={`ops-badge ${statusClass(lead.current_stage.key)}`}>
                        {lead.current_stage.label}
                      </span>
                      <small>{lead.source.label}</small>
                    </div>
                  </div>

                  <div className="ops-progress" aria-label={`Progresso ${lead.progress.percent}%`}>
                    <span style={{ width: `${lead.progress.percent}%` }} />
                  </div>

                  <div className="ops-lead-summary">
                    <article>
                      <span>Pagamento</span>
                      <strong className={statusClass(lead.payment.key)}>{lead.payment.label}</strong>
                    </article>
                    <article>
                      <span>Situação</span>
                      <strong className={statusClass(lead.dropoff.key)}>{lead.dropoff.label}</strong>
                    </article>
                    <article>
                      <span>Última atividade</span>
                      <strong>{formatDate(lead.latest_activity_at)}</strong>
                    </article>
                  </div>

                  {lead.operational_alert ? (
                    <div className="ops-inline-alert">
                      <AlertTriangle size={18} />
                      <span>
                        <strong>{lead.operational_alert.label}</strong>
                        <small>{lead.operational_alert.detail}</small>
                      </span>
                    </div>
                  ) : null}

                  <div className="ops-journey" aria-label="Régua da jornada">
                    {lead.journey.map((step) => (
                      <span
                        key={step.key}
                        className={[
                          step.completed ? "is-ok" : "",
                          step.waiting ? "is-waiting" : "",
                          step.failed ? "is-danger" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        title={step.status_label}
                      >
                        {step.label}
                      </span>
                    ))}
                  </div>

                  <div className="ops-lead-meta">
                    <span>Captura: {formatDate(lead.capturado_em)}</span>
                    <span>Objetivo: {lead.objetivo || "Nao informado"}</span>
                    <span>Mensagens: {lead.messages.sent}/{lead.messages.total}</span>
                    <span>Progresso: {lead.progress.percent}%</span>
                  </div>

                  <details className="ops-timeline">
                    <summary>Ver linha do tempo completa</summary>
                    <div>
                      {lead.latest_kiwify_event ? (
                        <p>
                          Kiwify: {lead.latest_kiwify_event.status} em{" "}
                          {formatDate(lead.latest_kiwify_event.received_at)}
                        </p>
                      ) : (
                        <p>Kiwify: nenhum evento recebido.</p>
                      )}
                      {lead.latest_interaction ? (
                        <p>
                          Último clique: {lead.latest_interaction.button_text || lead.latest_interaction.button_payload} em{" "}
                          {formatDate(lead.latest_interaction.received_at)}
                        </p>
                      ) : (
                        <p>Cliques Twilio: nenhum clique registrado.</p>
                      )}
                      {lead.messages.timeline.length ? (
                        <ol>
                          {lead.messages.timeline.map((message) => (
                            <li key={`${message.etapa}-${message.created_at}`}>
                              <span>
                                {message.etapa_label}
                                <small>{message.twilio_template ? `Template: ${message.twilio_template}` : ""}</small>
                              </span>
                              <strong className={statusClass(message.status)}>{message.status_label}</strong>
                              <small>
                                {message.sent_at
                                  ? `Saiu: ${formatDate(message.sent_at)}`
                                  : message.enviar_em
                                    ? `Prevista: ${formatDate(message.enviar_em)}`
                                    : ""}
                              </small>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p>Automação: nenhuma mensagem enfileirada ainda.</p>
                      )}
                    </div>
                  </details>
                </article>
              )) : (
                <article className="ops-empty-state">
                  <CheckCircle2 size={24} />
                  <strong>Painel sem leads no momento</strong>
                  <p>A base está limpa. Quando uma nova lead entrar, ela aparecerá aqui com a etapa atual do fluxo.</p>
                </article>
              )}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
