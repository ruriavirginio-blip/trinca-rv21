"use client";

import { createClient } from "@supabase/supabase-js";
import {
  Bot,
  CalendarDays,
  ChevronRight,
  CheckCircle2,
  CircleDollarSign,
  Edit3,
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

type TabKey = "hoje" | "leads" | "vendas" | "gastos" | "conteudo" | "ao-vivo" | "ia";
type ContentStatus = "RASCUNHO" | "APROVADO" | "PUBLICADO" | "REJEITADO";

type Lead = {
  id: string;
  nome: string | null;
  email: string | null;
  whatsapp: string | null;
  objetivo: string | null;
  origem: string | null;
  status: string | null;
  utm: string | null;
  capturado_em: string | null;
  created_at: string;
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

type NotionContentItem = {
  id: string;
  status: ContentStatus;
  notionUrl?: string;
  notionPageId?: string;
  updatedAt?: string;
};

type ContentQueueItem = {
  aprovado_em: string | null;
  criado_em: string;
  feedback: string | null;
  id: string;
  publicado_em: string | null;
  status: "aguardando_aprovacao" | "aprovado" | "rejeitado" | "publicado";
  tipo: string;
  titulo: string;
  url_video: string | null;
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
const contentStatusStorageKey = "trinca-rv21-content-statuses";
const saleValue = 37.89;
const leadGoal = 1000;

const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: "hoje", label: "Hoje", icon: <Home size={20} /> },
  { key: "leads", label: "Leads", icon: <Users size={20} /> },
  { key: "vendas", label: "Vendas", icon: <CircleDollarSign size={20} /> },
  { key: "gastos", label: "Gastos", icon: <WalletCards size={20} /> },
  { key: "conteudo", label: "Conteúdo", icon: <CalendarDays size={20} /> },
  { key: "ao-vivo", label: "Ao Vivo", icon: <Radio size={20} /> },
  { key: "ia", label: "IA", icon: <Bot size={20} /> },
];

const contentCalendar: Array<{
  id: string;
  day: string;
  title: string;
  time: string;
  format: string;
  objective: string;
  channel: string;
  status: ContentStatus;
  script: string[];
  roteiro?: string;
}> = [
  {
    id: "d1",
    day: "D1",
    title: "A promessa simples do desafio",
    time: "07:30",
    format: "Reels + 3 Stories",
    objective: "Abrir curiosidade e posicionar o TRINCA RV21 como método possível para recomeçar.",
    channel: "Reels + Stories",
    status: "RASCUNHO",
    script: [
      "Gancho: Voce nao precisa virar outra pessoa para voltar a cuidar do corpo.",
      "Contexto: A maioria para porque tenta compensar tudo em uma semana.",
      "Virada: O RV21 nasceu para organizar treino, dieta e constancia em passos pequenos.",
      "CTA: Comenta SEGUNDA se voce quer entrar na lista de prioridade.",
    ],
    roteiro: `[00:00-00:03] CLOSE | "Se você já tentou emagrecer e desistiu... você não falhou."
[00:03-00:06] CLOSE | "O método falhou por você." [PAUSA 1s]
[00:07-00:18] MEIO CORPO | "A maioria das mulheres começa na segunda animada. Na quarta já sumiu. Não é fraqueza. É falta de direção."
[00:18-00:27] CLOSE | "14 anos transformando mulheres que já tinham desistido de si mesmas. O Protocolo RV funciona porque é feito pra você — não pra todo mundo igual."
[00:27-00:32] CLOSE + APONTA | "Começa segunda. Comenta SEGUNDA aqui embaixo que eu te mando o acesso antes de abrir pra todo mundo."
TEXTO NA TELA: [00:00] "Você não falhou" | [00:03] "O método falhou" | [00:27] "Comenta SEGUNDA 👇"`,
  },
  {
    id: "d2",
    day: "D2",
    title: "Quebra da culpa",
    time: "12:15",
    format: "Reels curto",
    objective: "Tirar peso emocional e mostrar que o problema e falta de metodo, nao falta de vontade.",
    channel: "Reels",
    status: "RASCUNHO",
    script: [
      "Gancho: Voce ja comecou segunda e parou na quarta?",
      "Contexto: Isso acontece quando o plano depende de motivacao.",
      "Virada: Metodo bom diminui decisao, encaixa rotina e mostra o proximo passo.",
      "CTA: Comenta MENTIRA se voce cansou de se culpar.",
    ],
    roteiro: `[00:00-00:03] CLOSE | "3 mentiras que te fizeram desistir de emagrecer."
[00:03-00:10] 1 DEDO | "Você precisa de academia pra ter resultado. MENTIRA." [SOM DE ERRO]
[00:10-00:18] 2 DEDOS | "Você tem que cortar tudo que gosta pra emagrecer. MENTIRA." [SOM DE ERRO]
[00:18-00:27] 3 DEDOS | "Seu metabolismo parou com a idade e seu corpo não responde mais." [PAUSA DRAMÁTICA] "TAMBÉM É MENTIRA." [SOM DE ERRO]
[00:27-00:38] MEIO CORPO | "O que funciona de verdade? Comenta MENTIRA aqui embaixo que eu te mando no direct."`,
  },
  {
    id: "d3",
    day: "D3",
    title: "Prova social Jessica",
    time: "19:00",
    format: "Depoimento + bastidor",
    objective: "Usar depoimento para mostrar transformacao real sem promessa exagerada.",
    channel: "Depoimento + Stories",
    status: "APROVADO",
    script: [
      "Gancho: A Jessica nao precisou de perfeicao. Ela precisou de direcao.",
      "Contexto: Mostrar trecho curto do depoimento com legenda forte.",
      "Virada: O que muda primeiro e a postura diante da rotina.",
      "CTA: Responde JESSICA se voce quer receber os detalhes.",
    ],
    roteiro: `[00:00-00:05] CLOSE SUAVE | "A Jessica me disse assim: 'Ruriá, meu corpo desistiu de mim.'" [PAUSA]
[00:05-00:15] MEIO CORPO | "38 anos. 2 filhos. Já tinha feito 4 dietas diferentes. Ela não acreditava mais em nada."
[00:15-00:30] CÂMERA | "21 dias depois do Protocolo RV: menos 6 quilos. 8 centímetros de barriga. Mas o que ela me mandou que mais me tocou foi isso:" [PAUSA] "'Voltei a gostar de me olhar no espelho.'"
[00:30-00:42] CLOSE | "O corpo dela não tinha desistido. Ela só estava no método errado." [PAUSA] "Comenta JESSICA se você quer ser a próxima história assim."
TEXTO NA TELA: [00:15] "-6kg • -8cm de barriga" (verde) | [00:30] "'Voltei a gostar de mim'" (itálico)`,
  },
  {
    id: "d4",
    day: "D4",
    title: "O que tem dentro",
    time: "08:00",
    format: "Carrossel + Stories",
    objective: "Explicar oferta, materiais, acompanhamento e fluxo sem parecer aula longa.",
    channel: "Carrossel + Stories",
    status: "RASCUNHO",
    script: [
      "Slide 1: O que voce recebe no TRINCA RV21.",
      "Slide 2: Treinos guiados para 21 dias.",
      "Slide 3: Dietas por objetivo e materiais de apoio.",
      "Slide 4: WhatsApp com etapas liberadas no momento certo.",
      "CTA: Comenta PROTOCOLO para entrar no radar.",
    ],
  },
  {
    id: "d5",
    day: "D5",
    title: "Objeções comuns",
    time: "12:30",
    format: "Reels + perguntas",
    objective: "Responder falta de tempo, medo de nao conseguir e preco.",
    channel: "Reels + Caixa de perguntas",
    status: "RASCUNHO",
    script: [
      "Gancho: Se voce acha que nao tem tempo, esse video e para voce.",
      "Contexto: O plano nao pede rotina perfeita, pede execucao minima consistente.",
      "Virada: 21 dias e um recorte curto para recuperar controle.",
      "CTA: Manda EU QUERO se voce quer ver se encaixa na sua rotina.",
    ],
    roteiro: `[00:00-00:04] CLOSE | "O motivo científico pelo qual você não emagrece fazendo tudo certo."
[00:04-00:18] MEIO CORPO | "Quando você corta calorias demais, seu corpo entra em modo de sobrevivência e para de queimar gordura. É fisiologia — não fraqueza. Seu corpo está te protegendo."
[00:18-00:28] CLOSE FIRME | "O Protocolo RV não luta contra seu metabolismo. Trabalha a favor dele. Por isso funciona quando o resto falhou."
[00:28-00:35] CLOSE | "Comenta CIÊNCIA que eu te explico como funciona na prática."`,
  },
  {
    id: "d6",
    day: "D6",
    title: "Urgência honesta",
    time: "18:30",
    format: "Sequência de Stories",
    objective: "Avisar proximidade da abertura com clareza e sem pressão falsa.",
    channel: "Stories sequenciais",
    status: "RASCUNHO",
    script: [
      "Story 1: Falta pouco para abrir o TRINCA RV21.",
      "Story 2: Quem estiver na lista recebe o caminho primeiro.",
      "Story 3: Recapitular para quem e: recomeço, rotina e constancia.",
      "CTA: Responde ABRIU para receber quando liberar.",
    ],
  },
  {
    id: "d7",
    day: "D7",
    title: "Abertura oficial",
    time: "07:00",
    format: "Reels + Stories + Bio",
    objective: "Direcionar tráfego para a landing e transformar intenção em compra.",
    channel: "Reels + Stories + Bio",
    status: "RASCUNHO",
    script: [
      "Gancho: O TRINCA RV21 abriu.",
      "Contexto: 21 dias para voltar a treinar com direcao, dieta e acompanhamento.",
      "Oferta: Acesso por R$37,89 com materiais e fluxo completo no WhatsApp.",
      "CTA: Vai na bio ou comenta QUERO para receber o link.",
    ],
    roteiro: `[00:00-00:04] CLOSE SÉRIO | "Amanhã abre pra todo mundo. Mas eu preciso que você veja isso."
[00:04-00:20] MEIO CORPO | "Durante essa semana, dezenas de mulheres já garantiram o acesso antecipado ao TRINCA RV21. Hoje à noite eu estou disparando o link de compra pra lista inteira."
[00:20-00:32] CLOSE | "Quem está na lista paga preço de lançamento e entra primeiro. Quem não está... paga mais caro quando abrir amanhã."
[00:32-00:40] CLOSE + APONTA | "Comenta ÚLTIMA CHANCE agora. Sua vaga ainda está aqui."
TEXTO NA TELA: [00:04] "Lista VIP → acesso 24h antes" | [00:35] "ÚLTIMA CHANCE 👇" (pulsando)`,
  },
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

function normalizeContentStatus(status: unknown): ContentStatus {
  if (status === "PRONTO") return "APROVADO";
  if (status === "GRAVAR") return "RASCUNHO";
  if (status === "APROVADO" || status === "PUBLICADO" || status === "REJEITADO") return status;

  return "RASCUNHO";
}

export default function CockpitClient({ cockpitPassword }: { cockpitPassword: string }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [automationToken, setAutomationToken] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("hoje");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [commentLeads, setCommentLeads] = useState<CommentLead[]>([]);
  const [twilio, setTwilio] = useState<TwilioCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [iaLoading, setIaLoading] = useState(false);
  const [iaAnalysis, setIaAnalysis] = useState("");
  const [iaError, setIaError] = useState("");
  const [contentStatuses, setContentStatuses] = useState<Record<string, ContentStatus>>(
    Object.fromEntries(contentCalendar.map((post) => [post.id, post.status])),
  );
  const [notionContent, setNotionContent] = useState<Record<string, NotionContentItem>>({});
  const [contentSyncStatus, setContentSyncStatus] = useState("Notion ainda nao sincronizado.");
  const [contentSyncing, setContentSyncing] = useState(false);
  const [contentQueue, setContentQueue] = useState<ContentQueueItem[]>([]);
  const [contentQueueLoading, setContentQueueLoading] = useState(false);
  const [contentQueueError, setContentQueueError] = useState("");
  const [pendingContentApproval, setPendingContentApproval] = useState(0);
  const [expandedPostId, setExpandedPostId] = useState(contentCalendar[0]?.id || "");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedAuth = window.localStorage.getItem(authStorageKey);
        const expiresAt = savedAuth ? Number(JSON.parse(savedAuth).expiresAt || 0) : 0;
        setIsUnlocked(expiresAt > Date.now());
      } catch {
        setIsUnlocked(false);
      }

      setAutomationToken(window.localStorage.getItem(operacaoTokenStorageKey) || "");

      try {
        const defaults = Object.fromEntries(contentCalendar.map((post) => [post.id, post.status]));
        const saved = JSON.parse(window.localStorage.getItem(contentStatusStorageKey) || "{}") as Record<string, unknown>;
        const normalizedSaved = Object.fromEntries(
          Object.entries(saved).map(([postId, status]) => [postId, normalizeContentStatus(status)]),
        );

        setContentStatuses({ ...defaults, ...normalizedSaved });
      } catch {
        setContentStatuses(Object.fromEntries(contentCalendar.map((post) => [post.id, post.status])));
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (automationToken) {
      window.sessionStorage.setItem(operacaoTokenStorageKey, automationToken);
    }
  }, [automationToken]);

  const metrics = useMemo(() => {
    const start = todayStart();
    const leadsToday = leads.filter((lead) => new Date(lead.created_at) >= start);
    const salesToday = leads.filter((lead) => lead.status === "compra-aprovada" && new Date(lead.created_at) >= start);
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
            .select("id,nome,email,whatsapp,objetivo,origem,status,utm,capturado_em,created_at")
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

  useEffect(() => {
    if (isUnlocked && activeTab === "conteudo") {
      void loadContentFromNotion();
    }
  }, [activeTab, isUnlocked]);

  const loadContentQueue = useCallback(async () => {
    setContentQueueLoading(true);
    setContentQueueError("");

    try {
      const response = await fetch("/api/content-queue", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao ler content_queue.");
      }

      setPendingContentApproval(Number(data.pendingApproval || 0));
      setContentQueue(Array.isArray(data.items) ? (data.items as ContentQueueItem[]) : []);
      if (data.message) setContentQueueError(data.message);
    } catch {
      setPendingContentApproval(0);
      setContentQueue([]);
      setContentQueueError("Nao foi possivel carregar a fila de aprovacao.");
    } finally {
      setContentQueueLoading(false);
    }
  }, []);

  const updateQueueItemStatus = useCallback(
    async (id: string, status: ContentQueueItem["status"]) => {
      setContentQueueError("");

      try {
        const response = await fetch("/api/content-queue", {
          body: JSON.stringify({ id, status }),
          headers: { "Content-Type": "application/json" },
          method: "PATCH",
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Falha ao atualizar item.");
        }

        await loadContentQueue();
      } catch (error) {
        setContentQueueError(error instanceof Error ? error.message : "Falha ao atualizar item.");
      }
    },
    [loadContentQueue],
  );

  useEffect(() => {
    if (!isUnlocked) return undefined;

    const firstRunId = window.setTimeout(() => {
      void loadContentQueue();
    }, 0);
    const intervalId = window.setInterval(() => {
      void loadContentQueue();
    }, 30000);

    return () => {
      window.clearTimeout(firstRunId);
      window.clearInterval(intervalId);
    };
  }, [isUnlocked, loadContentQueue]);

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

  function updateContentStatus(postId: string, status: ContentStatus) {
    setContentStatuses((current) => {
      const next = {
        ...current,
        [postId]: status,
      };

      window.localStorage.setItem(contentStatusStorageKey, JSON.stringify(next));

      return next;
    });

    void syncContentStatus(postId, status);
  }

  async function loadContentFromNotion() {
    setContentSyncing(true);

    try {
      const response = await fetch("/api/cockpit-content", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nao foi possivel sincronizar o Notion.");
      }

      if (!data.configured) {
        setContentSyncStatus("Notion nao configurado. Usando calendario local.");
        return;
      }

      const items = Array.isArray(data.items) ? (data.items as NotionContentItem[]) : [];
      const byId = Object.fromEntries(items.map((item) => [item.id, item]));
      const nextStatuses = Object.fromEntries(
        items.map((item) => [item.id, normalizeContentStatus(item.status)]),
      );

      setNotionContent(byId);
      setContentStatuses((current) => {
        const next = { ...current, ...nextStatuses };

        window.localStorage.setItem(contentStatusStorageKey, JSON.stringify(next));

        return next;
      });
      setContentSyncStatus(`Notion sincronizado: ${items.length} itens.`);
    } catch (error) {
      setContentSyncStatus(error instanceof Error ? error.message : "Falha ao sincronizar Notion.");
    } finally {
      setContentSyncing(false);
    }
  }

  async function syncContentStatus(postId: string, status: ContentStatus) {
    try {
      const response = await fetch("/api/cockpit-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, status }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao atualizar Notion.");
      }

      if (data.configured === false) {
        setContentSyncStatus("Status salvo localmente. Notion nao configurado.");
        return;
      }

      setContentSyncStatus(`Notion atualizado: ${postId} -> ${status}.`);
    } catch (error) {
      setContentSyncStatus(
        error instanceof Error ? `Status local salvo. Notion: ${error.message}` : "Status local salvo. Notion falhou.",
      );
    }
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
                { label: "Leads hoje", value: String(metrics.leadsToday.length), tone: "gold" },
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
                { label: "Conversão", value: `${metrics.conversion.toFixed(1)}%`, tone: "gold" },
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

        {activeTab === "conteudo" ? (
          <DashboardSection
            title="Conteúdo"
            description="Calendário da semana pré-lançamento com roteiro, aprovação e publicação."
            loading={contentQueueLoading}
          >
            <ContentApprovalQueue
              error={contentQueueError}
              items={contentQueue}
              onRefresh={() => void loadContentQueue()}
              onStatusChange={(id, status) => void updateQueueItemStatus(id, status)}
              pendingCount={pendingContentApproval}
            />
            <ContentCalendar
              expandedPostId={expandedPostId}
              notionContent={notionContent}
              onRefresh={() => void loadContentFromNotion()}
              onExpand={setExpandedPostId}
              onStatusChange={updateContentStatus}
              statuses={contentStatuses}
              syncStatus={contentSyncStatus}
              syncing={contentSyncing}
            />
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
            <span className="nav-icon">
              {tab.icon}
              {tab.key === "conteudo" && pendingContentApproval > 0 ? (
                <b className="content-badge">{pendingContentApproval}</b>
              ) : null}
            </span>
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
  items: Array<{ label: string; value: string; tone: "gold" | "green" | "red" | "yellow" }>;
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

function ContentApprovalQueue({
  error,
  items,
  onRefresh,
  onStatusChange,
  pendingCount,
}: {
  error: string;
  items: ContentQueueItem[];
  onRefresh: () => void;
  onStatusChange: (id: string, status: ContentQueueItem["status"]) => void;
  pendingCount: number;
}) {
  const pendingItems = items.filter((item) => item.status === "aguardando_aprovacao");
  const visibleItems = pendingItems.length ? pendingItems : items.slice(0, 6);

  return (
    <section className="approval-queue">
      <div className="approval-head">
        <div>
          <span>Fila do Cockpit</span>
          <strong>{pendingCount} aguardando aprovação</strong>
        </div>
        <button className="secondary-action" onClick={onRefresh} type="button">
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {error ? <div className="queue-warning">{error}</div> : null}

      {visibleItems.length ? (
        <div className="approval-list">
          {visibleItems.map((item) => (
            <article className="approval-item" key={item.id}>
              <ContentPreview item={item} />
              <div className="approval-copy">
                <span>{item.tipo || "conteudo"}</span>
                <strong>{item.titulo}</strong>
                <small>
                  {queueStatusLabel(item.status)} · {dateLabel(item.criado_em)}
                </small>
                {item.feedback ? <p>{item.feedback}</p> : null}
              </div>
              <div className="approval-actions">
                {item.url_video ? (
                  <a className="secondary-action edit" href={item.url_video} rel="noreferrer" target="_blank">
                    <Eye size={16} />
                    Abrir
                  </a>
                ) : null}
                <button
                  className="secondary-action"
                  disabled={item.status === "aprovado" || item.status === "publicado"}
                  onClick={() => onStatusChange(item.id, "aprovado")}
                  type="button"
                >
                  <CheckCircle2 size={16} />
                  Aprovar
                </button>
                <button
                  className="secondary-action reject"
                  disabled={item.status === "rejeitado" || item.status === "publicado"}
                  onClick={() => onStatusChange(item.id, "rejeitado")}
                  type="button"
                >
                  <XCircleIcon />
                  Rejeitar
                </button>
                <button
                  className="secondary-action publish"
                  disabled={item.status === "publicado"}
                  onClick={() => onStatusChange(item.id, "publicado")}
                  type="button"
                >
                  <Send size={16} />
                  Publicar
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-queue">Nenhum criativo na fila agora.</div>
      )}
    </section>
  );
}

function ContentPreview({ item }: { item: ContentQueueItem }) {
  const url = item.url_video || "";
  const isImage = /\.(png|jpe?g|webp)(\?|$)/i.test(url);

  if (!url) {
    return <div className="approval-preview placeholder">{item.tipo || "conteudo"}</div>;
  }

  if (isImage) {
    // URLs da fila podem vir de Cloudinary, Vercel ou outro storage externo.
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={item.titulo} className="approval-preview" loading="lazy" src={url} />;
  }

  return <video className="approval-preview" muted playsInline preload="metadata" src={url} />;
}

function queueStatusLabel(status: ContentQueueItem["status"]) {
  if (status === "aguardando_aprovacao") return "Aguardando aprovação";
  if (status === "aprovado") return "Aprovado";
  if (status === "publicado") return "Publicado";
  return "Rejeitado";
}

function ContentCalendar({
  expandedPostId,
  notionContent,
  onRefresh,
  onExpand,
  onStatusChange,
  statuses,
  syncStatus,
  syncing,
}: {
  expandedPostId: string;
  notionContent: Record<string, NotionContentItem>;
  onRefresh: () => void;
  onExpand: (postId: string) => void;
  onStatusChange: (postId: string, status: ContentStatus) => void;
  statuses: Record<string, ContentStatus>;
  syncStatus: string;
  syncing: boolean;
}) {
  return (
    <div className="content-calendar">
      <div className="content-sync-card">
        <span>{syncStatus}</span>
        <button className="secondary-action" disabled={syncing} onClick={onRefresh} type="button">
          {syncing ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
          Sincronizar Notion
        </button>
      </div>
      {contentCalendar.map((post) => {
        const notionItem = notionContent[post.id];
        const status = normalizeContentStatus(notionItem?.status || statuses[post.id] || post.status);
        const isExpanded = expandedPostId === post.id;

        return (
          <article className={`content-post ${status.toLowerCase()}`} key={post.id}>
            <div className="content-post-head">
              <span className="day-pill">{post.day}</span>
              <div>
                <strong>{post.title}</strong>
                <small>
                  {post.time} · {post.format}
                </small>
              </div>
              <b>{status}</b>
              {notionItem?.notionUrl ? (
                <a className="notion-link" href={notionItem.notionUrl} rel="noreferrer" target="_blank">
                  Abrir Notion
                </a>
              ) : null}
              <button className="script-toggle" onClick={() => onExpand(isExpanded ? "" : post.id)} type="button">
                {isExpanded ? "Ocultar roteiro ▲" : "Ver roteiro ▼"}
              </button>
            </div>

            {isExpanded ? (
              <div className="content-post-body">
                <p>{post.objective}</p>
                {post.roteiro ? (
                  <pre className="script-block">{post.roteiro}</pre>
                ) : (
                  <ol>
                    {post.script.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ol>
                )}
                <div className="content-actions">
                  <button
                    className="secondary-action"
                    disabled={status === "APROVADO" || status === "PUBLICADO"}
                    onClick={() => onStatusChange(post.id, "APROVADO")}
                  >
                    <CheckCircle2 size={16} />
                    Aprovar
                  </button>
                  <button
                    className="secondary-action reject"
                    disabled={status === "REJEITADO" || status === "PUBLICADO"}
                    onClick={() => onStatusChange(post.id, "REJEITADO")}
                  >
                    <XCircleIcon />
                    Rejeitar
                  </button>
                  <button
                    className="secondary-action edit"
                    onClick={() => {
                      if (notionItem?.notionUrl) {
                        window.open(notionItem.notionUrl, "_blank", "noopener,noreferrer");
                        return;
                      }

                      onExpand(post.id);
                    }}
                    type="button"
                  >
                    <Edit3 size={16} />
                    Editar
                  </button>
                  <button
                    className="secondary-action publish"
                    disabled={status === "PUBLICADO"}
                    onClick={() => onStatusChange(post.id, "PUBLICADO")}
                  >
                    <Send size={16} />
                    Publicar
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function XCircleIcon() {
  return (
    <span aria-hidden="true" className="x-circle-icon">
      ×
    </span>
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
              {lead.origem || "origem direta"} · {lead.objetivo || "sem objetivo"} ·{" "}
              {dateLabel(lead.created_at || lead.capturado_em || new Date().toISOString())}
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
      .token-card,
      .content-post {
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
        background: rgba(255, 215, 0, 0.18);
        color: #FFD700;
        display: grid;
        place-items: center;
        margin-bottom: 18px;
      }

      .eyebrow {
        color: #FFD700;
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
        background: #FFD700;
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

      .metric.gold strong {
        color: #FFD700;
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
        background: linear-gradient(90deg, #FFD700, #00e676);
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
        color: #FFD700;
      }

      .content-calendar {
        display: grid;
        gap: 12px;
      }

      .approval-queue {
        border: 1px solid rgba(255, 215, 64, 0.24);
        border-radius: 14px;
        background: rgba(255, 215, 64, 0.06);
        display: grid;
        gap: 12px;
        margin-bottom: 14px;
        padding: 12px;
      }

      .approval-head {
        align-items: center;
        display: flex;
        gap: 12px;
        justify-content: space-between;
      }

      .approval-head span,
      .approval-copy span,
      .approval-copy small {
        color: rgba(255, 255, 255, 0.62);
        display: block;
      }

      .approval-head strong {
        color: #ffd740;
        display: block;
        margin-top: 2px;
      }

      .approval-list {
        display: grid;
        gap: 10px;
      }

      .approval-item {
        align-items: center;
        background: #13131a;
        border: 1px solid #1e1e2e;
        border-radius: 14px;
        display: grid;
        gap: 12px;
        grid-template-columns: 74px minmax(0, 1fr);
        padding: 10px;
      }

      .approval-preview {
        aspect-ratio: 9 / 16;
        background: #0a0a0f;
        border: 1px solid #1e1e2e;
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.54);
        display: grid;
        font-size: 11px;
        font-weight: 800;
        height: 118px;
        object-fit: cover;
        place-items: center;
        text-align: center;
        width: 66px;
      }

      .approval-copy {
        min-width: 0;
      }

      .approval-copy strong {
        display: block;
        margin: 2px 0 4px;
      }

      .approval-copy p {
        color: rgba(255, 255, 255, 0.72);
        font-size: 12px;
        margin: 6px 0 0;
      }

      .approval-actions {
        display: grid;
        gap: 8px;
        grid-column: 1 / -1;
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .approval-actions a {
        text-decoration: none;
      }

      .empty-queue,
      .queue-warning {
        border-radius: 12px;
        color: rgba(255, 255, 255, 0.72);
        padding: 12px;
      }

      .empty-queue {
        background: rgba(255, 255, 255, 0.05);
      }

      .queue-warning {
        background: rgba(255, 82, 82, 0.12);
        color: #ff8a80;
      }

      .content-sync-card {
        align-items: center;
        background: rgba(255, 215, 0, 0.1);
        border: 1px solid rgba(255, 215, 0, 0.24);
        border-radius: 14px;
        color: rgba(255, 255, 255, 0.72);
        display: flex;
        gap: 12px;
        justify-content: space-between;
        padding: 12px;
      }

      .content-post {
        overflow: hidden;
      }

      .content-post.aprovado {
        border-color: rgba(255, 215, 64, 0.36);
      }

      .content-post.publicado {
        border-color: rgba(0, 230, 118, 0.36);
      }

      .content-post.rejeitado {
        border-color: rgba(255, 82, 82, 0.36);
      }

      .content-post-head {
        width: 100%;
        align-items: center;
        color: #fff;
        display: grid;
        gap: 12px;
        grid-template-columns: auto minmax(0, 1fr) auto;
        padding: 14px;
        text-align: left;
      }

      .content-post-head strong,
      .content-post-head small {
        display: block;
      }

      .content-post-head small,
      .content-post-body p,
      .content-post-body li {
        color: rgba(255, 255, 255, 0.68);
      }

      .content-post-head b {
        border-radius: 999px;
        color: #ffd740;
        font-size: 10px;
        padding: 7px 9px;
        background: rgba(255, 215, 64, 0.1);
      }

      .content-post.publicado .content-post-head b {
        background: rgba(0, 230, 118, 0.1);
        color: #00e676;
      }

      .content-post.rascunho .content-post-head b,
      .content-post.rejeitado .content-post-head b {
        background: rgba(255, 82, 82, 0.12);
        color: #ff8a80;
      }

      .notion-link {
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 999px;
        color: rgba(255, 255, 255, 0.72);
        font-size: 11px;
        font-weight: 800;
        padding: 7px 9px;
        text-decoration: none;
      }

      .day-pill {
        background: rgba(255, 215, 0, 0.18);
        border: 1px solid rgba(255, 215, 0, 0.32);
        border-radius: 12px;
        color: #FFD700;
        font-weight: 900;
        padding: 10px 9px;
      }

      .content-post-body {
        border-top: 1px solid #1e1e2e;
        padding: 0 14px 14px;
      }

      .content-post-body ol {
        display: grid;
        gap: 10px;
        margin: 12px 0 0;
        padding-left: 20px;
      }

      .script-toggle {
        grid-column: 2 / -1;
        width: fit-content;
        border: 1px solid rgba(255, 215, 0, 0.34);
        border-radius: 999px;
        background: rgba(255, 215, 0, 0.16);
        color: #fff;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        font-weight: 900;
        padding: 8px 11px;
      }

      .script-block {
        white-space: pre-wrap;
        border: 1px solid #1e1e2e;
        border-radius: 12px;
        background: #0a0a0f;
        color: rgba(255, 255, 255, 0.76);
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        line-height: 1.65;
        margin: 12px 0 0;
        overflow-x: auto;
        padding: 12px;
      }

      .content-actions {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        margin-top: 16px;
      }

      .secondary-action {
        align-items: center;
        background: rgba(255, 215, 0, 0.16);
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 12px;
        color: #fff;
        cursor: pointer;
        display: flex;
        font: inherit;
        font-size: 13px;
        font-weight: 800;
        gap: 8px;
        justify-content: center;
        min-height: 42px;
        padding: 10px;
      }

      .secondary-action.publish {
        background: rgba(0, 230, 118, 0.1);
        border-color: rgba(0, 230, 118, 0.28);
      }

      .secondary-action.reject {
        background: rgba(255, 82, 82, 0.1);
        border-color: rgba(255, 82, 82, 0.28);
      }

      .secondary-action.edit {
        background: rgba(255, 215, 64, 0.1);
        border-color: rgba(255, 215, 64, 0.28);
      }

      .secondary-action:disabled {
        cursor: default;
        opacity: 0.46;
      }

      .x-circle-icon {
        align-items: center;
        border: 1px solid currentColor;
        border-radius: 999px;
        display: inline-flex;
        font-size: 14px;
        height: 16px;
        justify-content: center;
        line-height: 1;
        width: 16px;
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
        grid-template-columns: repeat(7, 1fr);
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
        background: rgba(255, 215, 0, 0.18);
        color: #fff;
      }

      .nav-icon {
        display: inline-grid;
        place-items: center;
        position: relative;
      }

      .content-badge {
        min-width: 18px;
        height: 18px;
        align-items: center;
        background: #ff5252;
        border: 2px solid #0a0a0f;
        border-radius: 999px;
        color: #fff;
        display: inline-flex;
        font-size: 10px;
        font-weight: 900;
        justify-content: center;
        line-height: 1;
        padding: 0 4px;
        position: absolute;
        right: -10px;
        top: -8px;
      }

      .bottom-nav span {
        font-size: 9px;
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

      @media (max-width: 520px) {
        .approval-actions {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .approval-head {
          align-items: stretch;
          flex-direction: column;
        }

        .content-actions {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .content-sync-card {
          align-items: stretch;
          flex-direction: column;
        }
      }
    `}</style>
  );
}
