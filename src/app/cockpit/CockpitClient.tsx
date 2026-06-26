"use client";

import { createClient } from "@supabase/supabase-js";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarDays,
  Camera,
  ChevronRight,
  CheckCircle2,
  CircleDollarSign,
  Edit3,
  Eye,
  Home,
  KeyRound,
  LayoutGrid,
  Loader2,
  MessageCircle,
  Radio,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
  WalletCards,
  Wrench,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { JornadaPanel, AlertasPanel, AcessosPanel } from "./CockpitOperacao";
import { DIA_PLANS, FASES, CTA_AUTOMACAO_STORY } from "./contentPlan";

type TabKey = "hoje" | "jornada" | "alertas" | "leads" | "vip" | "vendas" | "gastos" | "conteudo" | "comando" | "ia";
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
  { key: "jornada", label: "Jornada", icon: <Radio size={20} /> },
  { key: "alertas", label: "Alertas", icon: <AlertTriangle size={20} /> },
  { key: "leads", label: "Leads", icon: <Users size={20} /> },
  { key: "vip", label: "Lista VIP", icon: <Sparkles size={20} /> },
  { key: "vendas", label: "Vendas", icon: <CircleDollarSign size={20} /> },
  { key: "gastos", label: "Gastos", icon: <WalletCards size={20} /> },
  { key: "conteudo", label: "Conteúdo", icon: <CalendarDays size={20} /> },
  { key: "comando", label: "Comando", icon: <LayoutGrid size={20} /> },
  { key: "ia", label: "IA", icon: <Bot size={20} /> },
];

type DeptStatus = "ok" | "run" | "wait" | "new";
type CheckState = "d" | "p" | "x";
type Department = {
  icon: React.ReactNode;
  name: string;
  agent: string;
  status: DeptStatus;
  domain: string;
  report: string;
  skills: string[];
  conn: string[];
  check: Array<{ s: CheckState; t: string }>;
  cmd: string;
};

// 8 DEPARTAMENTOS — espelham o MANUAL DE OPERAÇÃO (a constituição). Ordem e charters do Manual.
// FASE ATUAL: AQUECIMENTO (24/06→01/07) — meta-mãe = encher a Lista VIP. Agulha = leads VIP/dia + CPL.
const DEPARTMENTS: Department[] = [
  {
    icon: <Target size={18} />, name: "TRAFFIC HUNTER", agent: "Depto 1 · Aquisição paga (Meta Ads)", status: "run",
    domain: "Levar mulher 25–44 BR ao /vip pelo menor CPL, escalando o que converte.",
    report: "LIVE e corrigido. Tirei Audience Network + objetivo→LANDING_PAGE_VIEWS no adset: CTR 0,52%→6,25%, clique→LPV 21%→83%. Próxima ação: vigiar CPL 2×/dia, pausar criativo ruim, escalar o que converte (com OK do Ruriá). Agulha: CPL R$3–12 e leads VIP/dia subindo.",
    skills: ["audience-segmentation-rv", "performance-metrics-rv", "competitor-intelligence-rv"],
    conn: ["Meta Marketing API", "Meta Ad Library", "Perplexity", "Windsor"],
    check: [
      { s: "d", t: "Campanha LIVE (act_1204020497109693)" },
      { s: "d", t: "Funil corrigido (0% Audience Network, LPV)" },
      { s: "d", t: "Público Mulher 25–44 BR" },
      { s: "p", t: "CPL dentro do benchmark R$3–12" },
      { s: "p", t: "Primeiros leads VIP do tráfego" },
    ],
    cmd: "COMANDO TRAFFIC HUNTER: assuma a aquisição paga. Leia insights do adset 120246044937170265 via Marketing API ($META_ADS_ACCESS_TOKEN), reporte CPL/gasto/leads, pause criativo ruim e proponha realocação de verba. Antes de escalar, espere OK do Ruriá. Use audience-segmentation-rv e performance-metrics-rv.",
  },
  {
    icon: <Camera size={18} />, name: "CONTENT CREATOR", agent: "Depto 2 · Orgânico + criativo", status: "run",
    domain: "Conteúdo que capta lead frio→VIP e aquece a audiência, no padrão premium da marca.",
    report: "Carrossel 'Por que eu criei' aprovado/agendado; reel 'Não foi você que falhou' em aprovação. FEED ainda não resolvido (direção de arte a definir COM o Ruriá antes de gerar). Regra: conceito definido com o Ruriá ANTES de produzir; nunca postar sem 'aprovado'. Agulha: post gera interação/lead VIP (não vaidade).",
    skills: ["content-instagram-rv", "trinca-high-end-visual-design", "trinca-copywriting"],
    conn: ["STACK CRIATIVO #01–30", "Adobe", "Canva", "Cloudinary"],
    check: [
      { s: "d", t: "Carrossel 'Por que eu criei' aprovado" },
      { s: "p", t: "Reel 'Não foi você que falhou' (aprovação)" },
      { s: "x", t: "Direção de arte do FEED (com o Ruriá)" },
      { s: "p", t: "Briefing/contentPlan do dia" },
    ],
    cmd: "COMANDO CONTENT CREATOR: assuma o conteúdo. Defina a DIREÇÃO DE ARTE COM o Ruriá ANTES de gerar (trinca-high-end-visual-design + referência real Meta Ad Library/Perplexity). Produza com o STACK CRIATIVO FIXO #01–30, suba na fila em_aprovacao. Nunca publicar sem 'aprovado'.",
  },
  {
    icon: <Zap size={18} />, name: "CONVERSION ENGINE", agent: "Depto 3 · Funil & automação", status: "run",
    domain: "Transformar clique/interação em lead VIP registrado. Roda 24/7.",
    report: "LIVE: /vip captando (Pixel+CAPI evento Lead, atribuição por ?o=), 3 automações ManyChat (comentário→DM, story→DM, novo-seguidor) e WhatsApp+Claude dinâmico. Verdade ManyChat: enquete NÃO dispara DM; keywords QUERO/EU QUERO/BORA/CUIDA/SEGUNDA. Agulha: % clique→lead e tamanho da lista subindo.",
    skills: ["conversion-funnel-rv", "objection-handling-rv", "trinca-page-cro"],
    conn: ["Supabase", "ManyChat API", "Twilio", "Meta Pixel/CAPI"],
    check: [
      { s: "d", t: "/vip + evento Lead (Pixel+CAPI)" },
      { s: "d", t: "3 automações ManyChat LIVE" },
      { s: "d", t: "WhatsApp+Claude dinâmico LIVE" },
      { s: "p", t: "Taxa clique→lead em alta" },
    ],
    cmd: "COMANDO CONVERSION ENGINE: assuma o funil. Garanta /vip, ManyChat e WhatsApp+Claude captando sem falha; meça clique→lead e otimize o que vaza. Use conversion-funnel-rv e objection-handling-rv.",
  },
  {
    icon: <MessageCircle size={18} />, name: "SALES CLOSER", agent: "Depto 4 · Lançamento & vendas", status: "wait",
    domain: "Converter a Lista VIP em venda no lançamento (vira protagonista em 02/07).",
    report: "DORME na fase aquecimento — só PREPARA: oferta, página de venda, sequência pós-compra (Twilio), ordem de comunicação da véspera. Precisa do Ruriá: aprovar oferta/preço/bônus. Agulha (no lançamento): conversão VIP→venda e faturamento.",
    skills: ["objection-handling-rv", "trinca-copywriting", "brand-positioning-rv"],
    conn: ["Kiwify", "Twilio", "página /nova"],
    check: [
      { s: "d", t: "Motor pós-compra WhatsApp validado E2E" },
      { s: "p", t: "Templates de nutrição VIP (Meta)" },
      { s: "x", t: "Oferta/preço/bônus aprovados" },
      { s: "x", t: "Página de venda do lançamento" },
    ],
    cmd: "COMANDO SALES CLOSER: na fase aquecimento, PREPARE sem ativar. Estruture oferta, página de venda e a sequência da véspera com objection-handling-rv e trinca-copywriting. Aguarde 02/07 e a aprovação de oferta/preço do Ruriá.",
  },
  {
    icon: <BarChart3 size={18} />, name: "DATA ANALYST", agent: "Depto 5 · Métricas & verdade dos números", status: "run",
    domain: "Dizer, com dado real, o que está dentro do esperado e o que não está — pelo tempo decorrido.",
    report: "Puxa Meta Ads + Lista VIP + cockpit, calcula CPL/conversão/ROI vs. benchmark. Reporta 2×/dia no Telegram (+ sob demanda). Agulha: relatórios honestos que levam a uma correção concreta — não número solto.",
    skills: ["performance-metrics-rv", "competitor-intelligence-rv", "audience-segmentation-rv"],
    conn: ["Meta Ads insights", "Supabase (/api/leads)", "GA4", "Perplexity"],
    check: [
      { s: "d", t: "Lista VIP ao vivo no cockpit (/api/leads)" },
      { s: "p", t: "CPL/conversão calculados vs. benchmark" },
      { s: "p", t: "Relatório Telegram 2×/dia" },
      { s: "p", t: "Projeção até a meta de leads" },
    ],
    cmd: "COMANDO DATA ANALYST: assuma as métricas. Puxe Meta Ads + Lista VIP + cockpit, calcule CPL/conversão/ROI e compare com benchmark atual (Perplexity). Entregue 1 correção concreta, não número solto. Use performance-metrics-rv.",
  },
  {
    icon: <Wrench size={18} />, name: "TECH OPS", agent: "Depto 6 · Infra, cockpit, motor", status: "run",
    domain: "Tudo no ar, sem erro escondido; o motor publica o aprovado no horário.",
    report: "Cockpit consertado (Jornada/Alertas, /api/leads, aba Conteúdo no dia de hoje, botão Baixar+galeria). Motor publish-due monta carrossel com todos os slides. Falta: cron chamando publish-due a cada X min. Agulha: zero falha escondida, uptime, fila publicada no horário.",
    skills: ["conversion-funnel-rv", "performance-metrics-rv"],
    conn: ["Next.js/Vercel", "Supabase", "Make.com", "cron-job.org", "Git SSH"],
    check: [
      { s: "d", t: "Cockpit estável (deploys f77abfc/7b8006f/2715d21)" },
      { s: "d", t: "Motor publish-due (carrossel multi-slide)" },
      { s: "d", t: "Monitor 24/7 + alerta Telegram" },
      { s: "p", t: "Cron chamando publish-due" },
    ],
    cmd: "COMANDO TECH OPS: assuma a infraestrutura. Mantenha tudo no ar (monitor+auto-heal), feche o cron do publish-due e faça deploy via git push SSH só com OK do Ruriá. Reporte qualquer falha escondida.",
  },
  {
    icon: <Wallet size={18} />, name: "FINANCE / CFO", agent: "Depto 7 · Gasto & sustentabilidade", status: "run",
    domain: "Gasto em dia, break-even claro, nada de surpresa.",
    report: "Soma assinaturas + gasto de tráfego, projeta custo até 1.000 leads, alerta saldo baixo. Precisa do Ruriá: confirmar valores reais das assinaturas. Agulha: CAC < LTV e gasto sob controle vs. meta.",
    skills: ["performance-metrics-rv", "launch-action-plan-rv"],
    conn: ["aba Gastos", "Twilio balance", "gasto Meta Ads"],
    check: [
      { s: "d", t: "Gastos fixos mapeados (aba Gastos)" },
      { s: "p", t: "Gasto de Meta Ads ao vivo somado" },
      { s: "x", t: "Break-even pelo ticket definido" },
      { s: "x", t: "Alertas de saldo/pagamento" },
    ],
    cmd: "COMANDO FINANCE CFO: assuma o financeiro. Some assinaturas + gasto de tráfego, projete o custo até a meta de leads e calcule o break-even. Confirme os valores reais das assinaturas com o Ruriá. Use performance-metrics-rv.",
  },
  {
    icon: <Eye size={18} />, name: "INTELIGÊNCIA DE MERCADO", agent: "Depto 8 · O Espião (NOVO)", status: "run",
    domain: "Minerar o dado PÚBLICO de concorrentes R$500k+ no nicho e converter em tática aplicável ao TRINCA.",
    report: "1ª varredura FEITA (24/06, docs/inteligencia-mercado-mov2.md): players Carol Borba, Amanda Biuger (Mulher Fitness), Mayra Cardi + desafios 21/30d. Achados: modelo 3 camadas (low-ticket alimenta assinatura/mentoria), mecanismo nomeado ('antifalha'/'destravar'), garantia 7d, comunidade+prova social, suporte 24h como herói. Aplicado: ângulo 'a culpa não foi sua' no Conteúdo, 'antifalha+24h' no Tráfego, order bump+upsell+garantia na Oferta. Limite honesto: lemos SINAIS PÚBLICOS, não extratos. Agulha: táticas validadas que moveram a agulha do Norte.",
    skills: ["competitor-intelligence-rv", "performance-metrics-rv", "brand-positioning-rv"],
    conn: ["Meta Ad Library", "Perplexity", "SEO (SEMrush)", "TikTok Creative Center"],
    check: [
      { s: "d", t: "1ª varredura Perplexity deep research" },
      { s: "d", t: "Relatório (funciona/não/táticas em alta)" },
      { s: "d", t: "Conclusões embutidas em Conteúdo/Tráfego/Oferta" },
      { s: "p", t: "Scan Meta Ad Library ao vivo (com o Ruriá)" },
    ],
    cmd: "COMANDO INTELIGÊNCIA DE MERCADO: rode a varredura do nicho (fitness/coaching feminino BR, R$500k+). Use Meta Ad Library + Perplexity (search_context_size high, citando fonte) + competitor-intelligence-rv. Entregue o que funciona / o que não / táticas em alta / estrutura de oferta-funil-gancho-cadência, e converta em recomendações para Conteúdo, Tráfego e Oferta.",
  },
];

type Expert = { icon: React.ReactNode; name: string; tag: string; desc: string; atua: string; cmd: string };
const EXPERTS: Expert[] = [
  { icon: <Sparkles size={16} />, name: "using-superpowers", tag: "/using-superpowers", desc: "O maestro: escolhe sozinho a melhor skill para cada tarefa.", atua: "Todos os setores", cmd: "Use a skill using-superpowers para selecionar automaticamente as melhores skills e executar a tarefa do setor que eu indicar." },
  { icon: <Sparkles size={16} />, name: "ui-ux-pro-max", tag: "/ui-ux-pro-max", desc: "Design de telas: 50+ estilos, paletas e fontes.", atua: "Conversion · Content", cmd: "Use a skill ui-ux-pro-max para elevar o design da landing/criativo ao padrão premium." },
  { icon: <Sparkles size={16} />, name: "frontend-design", tag: "/frontend-design", desc: "Direção visual de agência (padrão americano).", atua: "Conversion · Content", cmd: "Use a skill frontend-design para dar direção visual premium à landing." },
  { icon: <Sparkles size={16} />, name: "ckm:ui-styling", tag: "/ckm:ui-styling", desc: "Estilização fina: componentes, cores, dark mode.", atua: "Conversion", cmd: "Use a skill ckm-ui-styling para refinar componentes, cores e responsividade." },
  { icon: <Sparkles size={16} />, name: "ckm:banner-design", tag: "/ckm:banner-design", desc: "Banners e criativos de anúncio (Meta, capas).", atua: "Content · Traffic", cmd: "Use a skill ckm-banner-design para criar os criativos de anúncio do TRINCA RV21." },
  { icon: <Sparkles size={16} />, name: "obsidian-bases", tag: "/obsidian-bases", desc: "Bancos de dados visuais para alimentar o painel.", atua: "Data · Comando", cmd: "Use a skill obsidian-bases para montar a base de dados que alimenta o cockpit." },
  { icon: <Sparkles size={16} />, name: "create-cowork-plugin", tag: "/create-cowork-plugin", desc: "Cria plugins sob medida para o fluxo de trabalho.", atua: "Comando", cmd: "Use a skill create-cowork-plugin para empacotar o sistema TRINCA RV21 num plugin reutilizável." },
  { icon: <Sparkles size={16} />, name: "schedule", tag: "/anthropic-skills:schedule", desc: "Agenda agentes na nuvem que rodam sozinhos. Motor 24/7.", atua: "Motor de automação", cmd: "Use a skill schedule para criar uma rotina diária na nuvem que gera meu relatório de comando às 07h." },
];

type ArsenalCol = { col: string; items: Array<{ n: string; d: string }> };
const ARSENAL: ArsenalCol[] = [
  { col: "🎯 Tráfego & Leads", items: [
    { n: "audience-segmentation-rv", d: "Segmenta público e qualifica leads" },
    { n: "performance-metrics-rv", d: "Calcula CPL, CAC, ROI, KPIs" },
    { n: "competitor-intelligence-rv", d: "Espiona e compara concorrentes" },
  ] },
  { col: "⚡ Funil & Conversão", items: [
    { n: "conversion-funnel-rv", d: "Arquitetura do funil e automações" },
    { n: "trinca-page-cro", d: "Audita conversão da landing" },
    { n: "trinca-final-polish", d: "Passe final antes de publicar" },
    { n: "objection-handling-rv", d: "Quebra objeções de venda" },
  ] },
  { col: "📸 Conteúdo & Copy", items: [
    { n: "content-instagram-rv", d: "Posts, reels, stories, calendário" },
    { n: "trinca-copywriting", d: "Headlines, bio, CTAs, anúncios" },
    { n: "brand-positioning-rv", d: "Tom de voz e posicionamento" },
    { n: "trinca-marketing-psychology", d: "Gatilhos mentais que convertem" },
  ] },
  { col: "🎨 Design Premium", items: [
    { n: "trinca-high-end-visual-design", d: "Padrão visual premium do projeto" },
    { n: "ckm:design", d: "Logo, identidade, banners, slides" },
    { n: "canvas-design", d: "Posters e artes estáticas" },
  ] },
  { col: "💰 Vendas & Estratégia", items: [
    { n: "launch-action-plan-rv", d: "Plano-mestre do lançamento" },
    { n: "trinca-prompt-mestre", d: "Refina prompts para qualquer IA" },
    { n: "agents-trinca-rv21", d: "Decide qual agente faz o quê" },
  ] },
  { col: "🛠️ Produção & Docs", items: [
    { n: "pptx", d: "Apresentações / pitch decks" },
    { n: "docx", d: "Documentos Word profissionais" },
    { n: "xlsx", d: "Planilhas e relatórios" },
  ] },
];

const STATUS_LABEL: Record<DeptStatus, string> = { ok: "PRONTO", run: "ANDAMENTO", wait: "PENDENTE", new: "A ESTRUTURAR" };

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
  { id: "d1", day: "D1 · 26/06", title: "Você não falhou", time: "07:30", format: "Reel + Stories", objective: "Plantar a ideia e abrir curiosidade. Captar VIP.", channel: "Reels + Stories", status: "RASCUNHO",
    script: ["Gancho: Se você já tentou e desistiu, você não falhou — o método falhou com você.", "Virada: o TRINCA organiza treino, dieta e constância em passos pequenos.", "CTA: comenta QUERO que eu te chamo no Direct."],
    roteiro: `[00:00-00:03] CLOSE | "Se você já tentou emagrecer e desistiu... você não falhou."
[00:03-00:06] CLOSE | "O método é que falhou com você." [PAUSA]
[00:07-00:18] MEIO CORPO | "A maioria começa segunda animada e na quarta sumiu. Não é fraqueza. É falta de direção."
[00:18-00:27] CLOSE | "14 anos transformando mulher que já tinha desistido de si mesma. O Protocolo RV funciona porque é feito pra você."
[00:27-00:32] CLOSE + APONTA | "Comenta QUERO aqui embaixo que eu te chamo no Direct antes de abrir pra geral."
TEXTO NA TELA: [00:00] "Você não falhou" | [00:03] "O método falhou" | [00:27] "Comenta QUERO"` },
  { id: "d2", day: "D2 · 27/06", title: "A culpa não é sua", time: "12:15", format: "Reel + Stories", objective: "Tirar o peso da culpa. Gerar confiança.", channel: "Reels", status: "RASCUNHO",
    script: ["Gancho: começou na segunda e parou na quarta?", "Virada: plano que depende de motivação quebra; método diminui decisão.", "CTA: comenta QUERO se cansou de se culpar."],
    roteiro: `[00:00-00:04] CLOSE | "Você começa toda animada na segunda... e na quarta já largou. Adivinha de quem NÃO é a culpa?"
[00:04-00:15] MEIO CORPO | "Sua. Plano que depende só de motivação quebra. Método bom diminui decisão e encaixa na sua rotina."
[00:15-00:24] CLOSE | "Não é sobre força de vontade. É sobre direção. E isso eu te dou."
[00:24-00:30] APONTA | "Comenta QUERO que eu te explico no Direct."
TEXTO NA TELA: "A culpa não é sua" | "É falta de método" | "Comenta QUERO"` },
  { id: "d3", day: "D3 · 28/06", title: "15 minutos cabem no seu dia", time: "07:30", format: "Reel + Stories", objective: "Quebrar a objeção de tempo.", channel: "Reels", status: "RASCUNHO",
    script: ["Gancho: 'não tenho tempo' é a desculpa que mais ouço.", "Virada: você não tem 1h, mas tem 15 min.", "CTA: comenta QUERO."],
    roteiro: `[00:00-00:04] CLOSE | "A desculpa que eu mais ouço em 14 anos: 'Ruriá, não tenho tempo'."
[00:04-00:16] MEIO CORPO | "E você tem razão. Não tem 1h de academia. Mas 15 minutos por dia você tem. E é só disso que eu preciso."
[00:16-00:24] CLOSE | "21 dias, 15 min por dia, guiado. Cabe até no dia mais corrido."
[00:24-00:30] APONTA | "Comenta QUERO."
TEXTO NA TELA: "15 min/dia" | "Cabe no seu dia" | "Comenta QUERO"` },
  { id: "d4", day: "D4 · 29/06", title: "Energia pra você", time: "12:15", format: "Reel + Stories", objective: "Atacar a dor de energia (raiz).", channel: "Reels", status: "RASCUNHO",
    script: ["Gancho: acorda já cansada? não é preguiça, é sobrecarga.", "Virada: micro-hábitos que devolvem energia.", "CTA: comenta QUERO."],
    roteiro: `[00:00-00:04] CLOSE | "Você acorda já cansada e ainda se cobra por isso?"
[00:04-00:15] MEIO CORPO | "A raiz não é preguiça. É sobrecarga. Você gasta sua energia toda nos outros e não sobra nada pra você."
[00:15-00:24] CLOSE | "O TRINCA começa devolvendo a SUA energia. Pra você, não só pros outros."
[00:24-00:30] APONTA | "Comenta QUERO."
TEXTO NA TELA: "Não é preguiça" | "É sobrecarga" | "Comenta QUERO"` },
  { id: "d5", day: "D5 · 30/06", title: "A turma está se formando", time: "07:30", format: "Reel + Stories", objective: "Pertencimento + prova social.", channel: "Reels + Stories", status: "RASCUNHO",
    script: ["Gancho: tá chegando muita mulher boa.", "Virada: bora se conhecer.", "CTA: comenta QUERO."],
    roteiro: `[00:00-00:05] CLOSE | "Olha quanta mulher boa chegou essa semana."
[00:05-00:16] MEIO CORPO | "E todas com a mesma treta: tempo, energia, culpa. Você não tá sozinha nisso."
[00:16-00:24] CLOSE | "A 1ª turma tá se formando. Bora junto?"
[00:24-00:30] APONTA | "Comenta QUERO."` },
  { id: "d6", day: "D6 · 01/07", title: "Constância no fim de semana", time: "10:00", format: "Stories + Recap", objective: "Reforço leve + prova.", channel: "Stories", status: "RASCUNHO",
    script: ["Fim de semana é treino de constância, não desculpa.", "Prova social.", "CTA: responde SEGUNDA."] },
  { id: "d7", day: "D7 · 02/07", title: "Balanço da Semana 1", time: "10:00", format: "Stories + Card", objective: "Fechar Fase 1 + teaser Fase 2.", channel: "Stories", status: "RASCUNHO",
    script: ["Retrospecto leve.", "Teaser da próxima fase.", "CTA: responde SEGUNDA."] },
  { id: "d8", day: "D8 · 03/07", title: "Voltar a ser você", time: "12:15", format: "Reel + Stories", objective: "Virada de identidade.", channel: "Reels", status: "RASCUNHO",
    script: ["Não é sobre corpo perfeito, é sobre se reconhecer.", "Identidade > vaidade.", "CTA: comenta QUERO."] },
  { id: "d9", day: "D9 · 04/07", title: "Mulheres iguais a você", time: "12:15", format: "Reel + Stories", objective: "Prova social pesada.", channel: "Reels", status: "RASCUNHO",
    script: ["Gente real, virada real.", "Espelho, não inveja.", "CTA: manda 🔥."] },
  { id: "d10", day: "D10 · 05/07", title: "Uma vitória hoje", time: "10:00", format: "Reel + Stories", objective: "Micro-vitória + reciprocidade.", channel: "Reels", status: "RASCUNHO",
    script: ["Dica que funciona já hoje.", "Faça e me conte.", "CTA: responde no Direct."] },
  { id: "d11", day: "D11 · 06/07", title: "O que tem dentro", time: "12:15", format: "Reel + Stories", objective: "Ancoragem de valor (sem preço).", channel: "Reels", status: "RASCUNHO",
    script: ["Não é 'mais um PDF'.", "Treino + dieta + acompanhamento juntos.", "CTA: responde SEGUNDA."] },
  { id: "d12", day: "D12 · 07/07", title: "Funciona pra mim?", time: "12:15", format: "Reel + Stories", objective: "Quebrar objeção racional.", channel: "Reels", status: "RASCUNHO",
    script: ["A pergunta que mais aparece.", "Caso parecido respondido.", "CTA: manda 🔥."] },
  { id: "d13", day: "D13 · 08/07", title: "Virou comunidade", time: "12:15", format: "Reel + Stories", objective: "Comunidade + FOMO saudável.", channel: "Reels", status: "RASCUNHO",
    script: ["Olha o tamanho da turma.", "Não fica de fora.", "CTA: responde SEGUNDA."] },
  { id: "d14", day: "D14 · 09/07", title: "Balanço + gates", time: "10:00", format: "Stories + Card", objective: "Fechar Fase 2 + checar 3 gates.", channel: "Stories", status: "RASCUNHO",
    script: ["Retrospecto.", "Teaser do pré-lançamento.", "CTA: responde SEGUNDA."] },
  { id: "d15", day: "D15 · 10/07", title: "Tá chegando", time: "12:15", format: "Reel + Stories", objective: "Ligar antecipação.", channel: "Reels", status: "RASCUNHO",
    script: ["A 1ª turma vai abrir.", "VIP sabe primeiro e paga diferente.", "CTA: responde SEGUNDA."] },
  { id: "d16", day: "D16 · 11/07", title: "Onde você vai estar em 21 dias", time: "12:15", format: "Reel + Stories", objective: "Aversão à perda.", channel: "Reels", status: "RASCUNHO",
    script: ["O tempo passa do mesmo jeito.", "Igual ou um passo na frente?", "CTA: VIP responde SEGUNDA."] },
  { id: "d17", day: "D17 · 12/07", title: "Por que comigo", time: "12:15", format: "Reel + Stories", objective: "Autoridade + prova.", channel: "Reels", status: "RASCUNHO",
    script: ["14 anos, método.", "Não é sorte.", "CTA: VIP responde SEGUNDA."] },
  { id: "d18", day: "D18 · 13/07", title: "Turma limitada de verdade", time: "12:15", format: "Reel + Stories", objective: "Escassez honesta.", channel: "Reels", status: "RASCUNHO",
    script: ["Acompanho de perto, por isso é limitada.", "Não é marketing.", "CTA: VIP entra primeiro."] },
  { id: "d19", day: "D19 · 14/07", title: "Véspera — VIP primeiro", time: "12:15", format: "Reel + Stories", objective: "Preparar conversão.", channel: "Reels", status: "RASCUNHO",
    script: ["A turma abre em breve.", "VIP recebe o link antes.", "CTA: última chamada da VIP."] },
  { id: "d20", day: "D20 · 15/07", title: "Abriu pra VIP", time: "08:00", format: "Stories + Conversão", objective: "Abertura VIP (se gates verdes).", channel: "Stories", status: "RASCUNHO",
    script: ["Abriu pra VIP.", "Prova de quem entrou.", "CTA: VIP, confere o Direct."] },
  { id: "d21", day: "D21 · 16/07", title: "Abertura geral + última chamada", time: "08:00", format: "Stories + Conversão", objective: "Conversão full + escassez real.", channel: "Stories", status: "RASCUNHO",
    script: ["Abriu pra geral.", "Vagas limitadas de verdade.", "CTA: última chamada, link na bio."] },
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

export default function CockpitClient({
  cockpitPassword,
  opsToken = "",
}: {
  cockpitPassword: string;
  opsToken?: string;
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [automationToken, setAutomationToken] = useState(opsToken);
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

      {
        const tk = window.localStorage.getItem(operacaoTokenStorageKey) || opsToken;
        setAutomationToken(tk);
        if (tk) window.localStorage.setItem(operacaoTokenStorageKey, tk);
      }

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
      // Leads são lidos pelo SERVIDOR (service role) via /api/leads — o read
      // client-side com anon key é bloqueado por RLS (retornava vazio e sumia
      // com a Janile/meta 1.000). comment_leads segue no client (degradação ok).
      const leadsHeaders: HeadersInit = automationToken
        ? { authorization: `Bearer ${automationToken}` }
        : {};
      const [leadsResponse, { data: commentsData, error: commentsError }, creditsResponse] =
        await Promise.all([
          fetch("/api/leads", { headers: leadsHeaders, cache: "no-store" }),
          supabase
            .from("comment_leads")
            .select("id,instagram_user_id,gatilho_ativado,dm_enviada,created_at")
            .order("created_at", { ascending: false })
            .limit(250),
          fetch("/api/twilio-credits"),
        ]);

      if (commentsError) throw new Error(commentsError.message);

      const leadsJson = leadsResponse.ok
        ? ((await leadsResponse.json()) as { leads?: Lead[] })
        : { leads: [] };
      if (!leadsResponse.ok) {
        setDataError("Não foi possível ler os leads (token da operação ausente ou inválido).");
      }

      setLeads((leadsJson.leads || []) as Lead[]);
      setCommentLeads((commentsData || []) as CommentLead[]);

      if (creditsResponse.ok) {
        setTwilio((await creditsResponse.json()) as TwilioCredits);
      }
    } catch (error) {
      setDataError(error instanceof Error ? error.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, [automationToken]);

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
            <h3 className="block-title">Acessos por link (contagem exata)</h3>
            <AcessosPanel />
          </DashboardSection>
        ) : null}

        {activeTab === "jornada" ? (
          <DashboardSection
            title="Jornada da Lead"
            description="Cada lead: origem, etapa atual, passo a passo das mensagens e onde travou. Atualiza sozinho a cada 1 min."
            loading={false}
          >
            <JornadaPanel token={automationToken} onToken={saveAutomationToken} />
          </DashboardSection>
        ) : null}

        {activeTab === "alertas" ? (
          <DashboardSection
            title="Alertas"
            description="Só o que precisa de você agora: travou, desistiu ou deu erro."
            loading={false}
          >
            <AlertasPanel token={automationToken} />
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

        {activeTab === "vip" ? (
          <DashboardSection title="Lista VIP" description="Quem entrou pelo formulário /vip, por qual link chegou, e os dados de cada lead." loading={false}>
            <VipPanel />
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
            <TwilioEconomics balance={twilio} />
          </DashboardSection>
        ) : null}

        {activeTab === "conteudo" ? (
          <DashboardSection
            title="Conteúdo"
            description="Clique no dia (D1 = 23/06) e veja todos os posts daquele dia: formato, objetivo e roteiro."
            loading={contentQueueLoading}
          >
            <ContentDaySection />
            <details className="legacy-notion">
              <summary>🗄️ Notion (antigo — NÃO usar)</summary>
              <p className="legacy-note">
                Esta área era uma fila pelo Notion que <b>nunca foi ativada</b> e não vale. O que vale é
                a <b>Fábrica de Conteúdo</b> acima (Supabase). Mantida só por histórico — pode ignorar.
              </p>
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
            </details>
          </DashboardSection>
        ) : null}

        {activeTab === "comando" ? (
          <DashboardSection
            title="Comando Geral"
            description="Escolha uma área embaixo. Cada botão abre só aquela parte — sem bagunça."
            loading={false}
          >
            <ComandoHub
              live={{
                leads: leads.length,
                leadGoal,
                googleLeads: leads.filter((l) => /google/i.test(`${l.utm ?? ""} ${l.origem ?? ""}`)).length,
                sales: metrics.salesToday.length,
                revenue: metrics.revenueToday,
              }}
            />
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

type MonitorStatus = {
  severity: "ok" | "warn" | "critical";
  problems: string[];
  warnings: string[];
  counts: Record<string, number>;
  checked_at: string;
};

function MonitorPanel() {
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<MonitorStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [testMsg, setTestMsg] = useState("");

  const check = useCallback(async (t: string) => {
    if (!t) return;
    setBusy(true);
    setErr("");
    try {
      const r = await fetch(`/api/automation/monitor?token=${encodeURIComponent(t)}`);
      const d = await r.json();
      if (!r.ok) {
        setErr(d.error || "Falha ao consultar a saúde.");
        setStatus(null);
      } else {
        setStatus(d as MonitorStatus);
      }
    } catch {
      setErr("Erro de rede ao consultar a saúde.");
    }
    setBusy(false);
  }, []);

  useEffect(() => {
    const t = window.localStorage.getItem(operacaoTokenStorageKey) || "";
    setToken(t);
    void check(t);
  }, [check]);

  const sendTest = async () => {
    setTestMsg("Enviando alerta de teste...");
    try {
      const r = await fetch("/api/internal-notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          trigger: "critical_alert",
          description: "TESTE DE COMANDO: alerta manual do Cockpit. Se chegou no seu WhatsApp, o motor de erros está integrado.",
          dedupeKey: `teste-manual:${Date.now()}`,
        }),
      });
      const d = await r.json();
      if (d.ok && !d.skipped) setTestMsg("✅ Enviado! Confira seu WhatsApp.");
      else setTestMsg(`⚠️ ${d.reason || d.error || "Não enviou — verifique a configuração do WhatsApp."}`);
    } catch {
      setTestMsg("Erro de rede ao enviar o teste.");
    }
  };

  const sev = status?.severity;
  const sevLabel = sev === "ok" ? "TUDO OK" : sev === "warn" ? "ATENÇÃO" : sev === "critical" ? "FALHA" : "—";

  return (
    <div className="monitor-card">
      <div className="mon-head">
        <span className={`mon-dot ${sev || "none"}`} />
        <div className="mon-title">
          <strong>Saúde do Sistema · Motor de Erros</strong>
          <span>
            {status ? `${sevLabel} · checado ${dateLabel(status.checked_at)}` : err ? err : "Aguardando token..."}
          </span>
        </div>
        <button className="mon-refresh" onClick={() => void check(token)} disabled={busy} aria-label="Atualizar">
          {busy ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
        </button>
      </div>

      {!token ? (
        <p className="mon-hint">
          Cole o AUTOMATION_API_SECRET uma vez na aba <b>Ao Vivo</b> para ligar o monitor de saúde aqui.
        </p>
      ) : null}

      {status && status.problems.length > 0 ? (
        <ul className="mon-list crit">
          {status.problems.map((p, i) => (
            <li key={i}>🚨 {p}</li>
          ))}
        </ul>
      ) : null}
      {status && status.warnings.length > 0 ? (
        <ul className="mon-list warn">
          {status.warnings.map((w, i) => (
            <li key={i}>⚠️ {w}</li>
          ))}
        </ul>
      ) : null}
      {status && status.severity === "ok" ? <p className="mon-ok">✓ Nenhuma falha detectada. Automação saudável.</p> : null}

      <div className="mon-actions">
        <button className="mon-test" onClick={() => void sendTest()} disabled={!token}>
          <Send size={14} /> Testar alerta no meu WhatsApp
        </button>
        {testMsg ? <span className="mon-testmsg">{testMsg}</span> : null}
      </div>
    </div>
  );
}

// Economia do WhatsApp (Twilio) — para controle de gasto por lead
const USD_BRL = 5.4; // aproximado; ajustável
const COST_PER_MSG_USD = 0.04; // custo médio estimado por mensagem WhatsApp (BR)
const LOW_BALANCE_USD = 5; // alerta de crédito baixo
const CONVERSAO_ESTIMADA = 0.05; // 5% dos leads compram (estimativa conservadora)

const FLUXO_MSGS: Array<{ fase: string; msgs: number; gatilho: string }> = [
  { fase: "Captação (lead novo)", msgs: 2, gatilho: "Preencheu o formulário" },
  { fase: "Aquecimento / nutrição", msgs: 3, gatilho: "Primeiros 2-3 dias" },
  { fase: "Carrinho abandonado", msgs: 2, gatilho: "Não finalizou a compra" },
  { fase: "Pagamento pendente", msgs: 2, gatilho: "Gerou boleto / PIX" },
  { fase: "Pós-compra (entrega)", msgs: 6, gatilho: "Comprou — grupo, dieta, materiais" },
];

function TwilioEconomics({ balance }: { balance: TwilioCredits | null }) {
  const saldoUsd = balance ? Number(balance.balance) : null;
  const baixo = saldoUsd !== null && saldoUsd <= LOW_BALANCE_USD;
  const brl = (usd: number) => `R$ ${(usd * USD_BRL).toFixed(2)}`;

  const msgsNaoCompra = 2 + 3 + 2; // captação + nutrição + abandono
  const msgsCompra = 2 + 3 + 6; // captação + nutrição + pós-compra
  const custoLeadNaoCompra = msgsNaoCompra * COST_PER_MSG_USD;
  const custoLeadCompra = msgsCompra * COST_PER_MSG_USD;

  const compradores = Math.round(leadGoal * CONVERSAO_ESTIMADA);
  const naoCompradores = leadGoal - compradores;
  const totalMsgs1000 = naoCompradores * msgsNaoCompra + compradores * msgsCompra;
  const custoTotal1000Usd = totalMsgs1000 * COST_PER_MSG_USD;
  const mensagensRestantes = saldoUsd !== null ? Math.floor(saldoUsd / COST_PER_MSG_USD) : null;

  return (
    <div className="health-card" style={{ marginTop: 14 }}>
      <div className="health-top">
        <div className={`health-score ${baixo ? "red" : "green"}`}>
          <strong style={{ fontSize: 18 }}>{saldoUsd !== null ? `$${saldoUsd.toFixed(2)}` : "—"}</strong>
          <span>saldo Twilio</span>
        </div>
        <div className="health-intro">
          <strong>💬 Custo & Crédito do WhatsApp (Twilio)</strong>
          <p>
            {saldoUsd !== null
              ? `Dá para enviar cerca de ${mensagensRestantes?.toLocaleString("pt-BR")} mensagens com o saldo atual.`
              : "Carregando saldo..."}
          </p>
        </div>
      </div>

      {baixo ? (
        <p className="mon-list crit" style={{ listStyle: "none", padding: "10px 12px" }}>
          🚨 Crédito Twilio baixo ({`$${saldoUsd?.toFixed(2)}`}). Recarregue para o robô de mensagens não parar.
        </p>
      ) : null}

      <MetricGrid
        items={[
          { label: "Custo por lead (não compra)", value: brl(custoLeadNaoCompra), tone: "yellow" },
          { label: "Custo por lead (compra)", value: brl(custoLeadCompra), tone: "gold" },
          { label: "Projeção p/ 1.000 leads", value: brl(custoTotal1000Usd), tone: "red" },
        ]}
      />

      <p className="hdesc" style={{ margin: "10px 0 6px", fontWeight: 600, color: "#fff" }}>
        Quantas mensagens o Twilio dispara por lead, por fase:
      </p>
      <div className="list">
        {FLUXO_MSGS.map((f) => (
          <div className="list-row" key={f.fase}>
            <div>
              <strong>{f.fase}</strong>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>{f.gatilho}</span>
            </div>
            <b>{f.msgs} msg</b>
          </div>
        ))}
      </div>
      <p className="health-foot">
        Lead que não compra ≈ <b>{msgsNaoCompra} mensagens</b> · lead que compra ≈ <b>{msgsCompra} mensagens</b>.
        Estimativa de {`$${COST_PER_MSG_USD.toFixed(2)}`}/msg — ajustável conforme a fatura real.
      </p>
    </div>
  );
}

function ProjectHealthPanel({ live }: { live?: LivePulse }) {
  const [status, setStatus] = useState<MonitorStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const t = window.localStorage.getItem(operacaoTokenStorageKey) || "";
    if (!t) {
      setErr("Sem token da operação para checar a saúde ao vivo.");
      return;
    }
    setLoading(true);
    try {
      const r = await fetch(`/api/automation/monitor?token=${encodeURIComponent(t)}`, { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) setErr(d.error || "Falha ao checar a saúde.");
      else {
        setStatus(d as MonitorStatus);
        setErr("");
      }
    } catch {
      setErr("Erro de rede ao checar a saúde.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 30000);
    return () => window.clearInterval(t);
  }, [load]);

  const sev = status?.severity;
  const verdict = !status
    ? { tone: "gold", icon: "⏳", title: "Checando o sistema ao vivo…", sub: err || "Lendo o estado real do projeto." }
    : sev === "ok"
      ? { tone: "green", icon: "✅", title: "Projeto em perfeito funcionamento", sub: "Nenhuma falha detectada — motor saudável e rodando 24h." }
      : sev === "warn"
        ? { tone: "gold", icon: "⚠️", title: "Funcionando, com avisos", sub: "Roda normal, mas tem ponto(s) de atenção abaixo." }
        : { tone: "red", icon: "🔴", title: "Precisa de ajuste agora", sub: "Há falha(s) ativa(s). O sistema tenta consertar sozinho e te avisa no Telegram." };

  const c = status?.counts || {};
  const motorTone =
    (c.automation_error_total || 0) > 0
      ? "red"
      : (c.automation_due_pending || 0) > 0 || (c.automation_waiting_clicks || 0) > 0
        ? "gold"
        : "green";
  const toneLabel: Record<string, string> = { green: "OK", gold: "Atenção", red: "Falha", none: "—" };
  const areas: Array<{ nome: string; tone: string; texto: string }> = [
    {
      nome: "🤖 Motor de mensagens (WhatsApp)",
      tone: status ? motorTone : "none",
      texto: !status
        ? "Aguardando leitura ao vivo."
        : motorTone === "green"
          ? "Fila limpa, enviando normalmente."
          : `${c.automation_error_total || 0} erro(s) · ${c.automation_due_pending || 0} vencida(s) · ${c.automation_waiting_clicks || 0} aguardando clique.`,
    },
    { nome: "🎯 Captação de leads", tone: (live?.leads || 0) > 0 ? "green" : "gold", texto: `${live?.leads || 0} leads captados (meta ${live?.leadGoal || 1000}).` },
    { nome: "💰 Vendas", tone: (live?.sales || 0) > 0 ? "green" : "none", texto: `${live?.sales || 0} venda(s) hoje · ${(live?.revenue || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.` },
    { nome: "🌐 Site & rastreamento", tone: "green", texto: "Landing no ar · Pixel + GA + tracker próprio medindo a origem das leads." },
    { nome: "📸 Conteúdo (posts/reels)", tone: "gold", texto: "Roteiros dos 10 dias prontos; criativos em produção." },
    { nome: "📣 Tráfego pago", tone: "none", texto: "Não ligado — aquecimento é orgânico por enquanto." },
  ];

  return (
    <div className="health-card">
      <div className={`verdict ${verdict.tone}`}>
        <span className="verdict-icon">{verdict.icon}</span>
        <div className="verdict-body">
          <strong>{verdict.title}</strong>
          <p>{verdict.sub}</p>
        </div>
        <button className="mon-refresh" onClick={() => void load()} disabled={loading} aria-label="Atualizar">
          {loading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
        </button>
      </div>

      {status && status.problems.length > 0 ? (
        <ul className="mon-list crit">{status.problems.map((p, i) => <li key={i}>🚨 {p}</li>)}</ul>
      ) : null}
      {status && status.warnings.length > 0 ? (
        <ul className="mon-list warn">{status.warnings.map((w, i) => <li key={i}>⚠️ {w}</li>)}</ul>
      ) : null}

      <div className="health-bars">
        {areas.map((a) => (
          <div className="hrow" key={a.nome}>
            <div className="hrow-top">
              <span className="hname">{a.nome}</span>
              <b className={`hpct ${a.tone === "none" ? "" : a.tone}`}>{toneLabel[a.tone]}</b>
            </div>
            <p className="hdesc">{a.texto}</p>
          </div>
        ))}
      </div>

      <p className="health-foot">
        Veredito <b>ao vivo</b> (atualiza a cada 30s). Quando dá problema, o sistema tenta consertar sozinho e te avisa no Telegram.
      </p>
    </div>
  );
}

const PHASE_META: Record<string, { label: string; date: string }> = {
  pre: { label: "Pré-lançamento", date: "até 23/jun" },
  dur: { label: "Durante o pré", date: "23–30/jun" },
  lanc: { label: "Lançamento", date: "30/jun" },
};
const DEPT_PHASE: Record<string, string[]> = {
  "TECH OPS": ["pre"],
  "CONVERSION ENGINE": ["pre", "dur"],
  "TRAFFIC HUNTER": ["dur", "lanc"],
  "CONTENT CREATOR": ["pre", "dur"],
  "SALES CLOSER": ["dur", "lanc"],
  "DATA ANALYST": ["dur", "lanc"],
  "FINANCE / CFO": ["dur", "lanc"],
  "INTELIGÊNCIA DE MERCADO": ["dur", "lanc"],
};
function deptProgress(d: Department) {
  const total = d.check.length || 1;
  const score = d.check.reduce((a, c) => a + (c.s === "d" ? 1 : c.s === "p" ? 0.5 : 0), 0);
  return Math.round((score / total) * 100);
}

type LivePulse = {
  leads: number;
  leadGoal: number;
  googleLeads: number;
  sales: number;
  revenue: number;
};

function CommandSection({ live, hidePulse }: { live?: LivePulse; hidePulse?: boolean }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [phase, setPhase] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);
  const copy = (text: string, label: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2200);
    });
  };
  const phases = ["all", "pre", "dur", "lanc"];
  const list = DEPARTMENTS.filter((d) => phase === "all" || (DEPT_PHASE[d.name] || []).includes(phase));
  const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return (
    <>
      {live && !hidePulse ? (
        <div className="cmd-pulse">
          <div className="cmd-pulse-item"><span>Leads</span><b>{live.leads}<i>/{live.leadGoal}</i></b></div>
          <div className="cmd-pulse-item"><span>Vindos do Google</span><b className="g">{live.googleLeads}</b></div>
          <div className="cmd-pulse-item"><span>Vendas hoje</span><b>{live.sales}</b></div>
          <div className="cmd-pulse-item"><span>Receita hoje</span><b>{money(live.revenue)}</b></div>
        </div>
      ) : null}

      <div className="cmd-phases">
        {phases.map((p) => (
          <button key={p} className={`cmd-phase-chip ${phase === p ? "on" : ""}`} onClick={() => setPhase(p)}>
            {p === "all" ? "Tudo" : PHASE_META[p].label}
            {p !== "all" ? <i>{PHASE_META[p].date}</i> : null}
          </button>
        ))}
      </div>

      <div className="cmd-grid2">
        {list.map((d) => {
          const prog = deptProgress(d);
          const isOpen = open === d.name;
          return (
            <article className={`cmd-card2 ${isOpen ? "open" : ""}`} key={d.name}>
              <button className="cmd-card2-head" onClick={() => setOpen(isOpen ? null : d.name)}>
                <span className="cmd-ico2">{d.icon}</span>
                <span className="cmd-c2-title"><strong>{d.name}</strong><span>{d.agent}</span></span>
                <span className={`cmd-status ${d.status}`}>{STATUS_LABEL[d.status]}</span>
              </button>
              <div className="cmd-prog">
                <div className="cmd-prog-bar"><span style={{ width: `${prog}%` }} /></div>
                <b>{prog}%</b>
              </div>
              <p className="cmd-c2-report">{d.report}</p>
              <div className="cmd-c2-btns">
                <button className="c2b urg" onClick={() => copy(`🚨 URGÊNCIA — ${d.name}: pare tudo e me diga AGORA, em português simples, se tem algo quebrado, travado ou que vai me fazer perder lead/venda neste setor. Se tiver, conserte na hora e me reporte.`, `${d.name}-urg`)}>
                  {copied === `${d.name}-urg` ? "✓ copiado" : "🚨 Urgência"}
                </button>
                <button className="c2b act" onClick={() => copy(d.cmd, d.name)}>
                  {copied === d.name ? "✓ copiado" : "⚡ Acionar"}
                </button>
                <button className="c2b rep" onClick={() => copy(`📊 RELATÓRIO — ${d.name}: me dê um resumo curto e didático (linguagem simples) do estado deste setor: o que está pronto, o que falta e o próximo passo. Com números se tiver.`, `${d.name}-rep`)}>
                  {copied === `${d.name}-rep` ? "✓ copiado" : "📊 Relatório"}
                </button>
              </div>
              {isOpen ? (
                <div className="cmd-c2-detail">
                  <p className="cmd-domain">{d.domain}</p>
                  <div className="cmd-chips">{d.skills.map((s) => <span className="chip chip-skill" key={s}>{s}</span>)}</div>
                  <div className="cmd-chips">{d.conn.map((c) => <span className="chip chip-conn" key={c}>{c}</span>)}</div>
                  <ul className="cmd-check">
                    {d.check.map((c, i) => (
                      <li className={c.s === "d" ? "done" : ""} key={i}>
                        <span className={`check-mark ${c.s}`}>{c.s === "d" ? "✓" : c.s === "p" ? "~" : "!"}</span>
                        {c.t}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
      <p className="cmd-hint">
        Toque num setor pra abrir os detalhes. <b>🚨 Urgência</b> = checar/consertar problema agora · <b>⚡ Acionar</b> = pôr o setor pra trabalhar · <b>📊 Relatório</b> = pedir resumo simples.
      </p>
    </>
  );
}

const STRAT_PLAN = [
  { icon: <Users size={16} />, t: "Pra quem anunciar", d: "Mulheres de 25 a 44 anos que já tentaram emagrecer e desistiram. Mães, ocupadas, cansadas de dieta que não encaixa na rotina." },
  { icon: <Eye size={16} />, t: "O que mostrar no anúncio", d: "A mesma frase da página: \"Você não falhou. O método é que falhou.\" Um vídeo curto seu falando isso + um antes/depois real." },
  { icon: <Target size={16} />, t: "Pra onde mandar o clique", d: "Direto pra página /nova — não pro perfil do Instagram. Quanto menos passos até o formulário, mais barato sai cada lead." },
  { icon: <Zap size={16} />, t: "Quanto investir pra começar", d: "R$20 a R$30 por dia, por uns 5 dias, testando 2 ou 3 anúncios. O que performar melhor a gente aumenta." },
];

const STRAT_FUNNEL = [
  { label: "Entraram na página", v: 1000, pct: 100, note: "100%", lead: false },
  { label: "Rolaram até a oferta", v: 550, pct: 55, note: "55%", lead: false },
  { label: "Clicaram no botão", v: 250, pct: 25, note: "25%", lead: false },
  { label: "Preencheram o form", v: 120, pct: 12, note: "12% · LEAD", lead: true },
  { label: "Foram pro checkout", v: 120, pct: 12, note: "12%", lead: false },
  { label: "Compraram", v: 24, pct: 2.4, note: "2,4%", lead: false },
];

const STRAT_KPI = [
  { t: "Custo por lead (quanto custa cada cadastro)", bom: "até R$8", ruim: "acima de R$15" },
  { t: "Taxa do formulário (quem entra e preenche)", bom: "acima de 10%", ruim: "abaixo de 5%" },
  { t: "Quem rola até ver a oferta", bom: "acima de 50%", ruim: "abaixo de 30%" },
  { t: "Custo por venda", bom: "até R$40", ruim: "acima de R$80" },
];

const STRAT_GOAL = [
  { label: "CPL R$5 (ótimo)", invest: 5000 },
  { label: "CPL R$8 (bom)", invest: 8000 },
  { label: "CPL R$12 (atenção)", invest: 12000 },
];

function StrategyPanel() {
  const maxInvest = 12000;
  return (
    <div className="strat">
      <div className="strat-intro">
        <BarChart3 size={18} />
        <div>
          <strong>Comando 4 — Plano de Jogo do Tráfego Pago</strong>
          <span>
            Em português simples: pra quem anunciar, o caminho da cliente até a compra e quais
            números olhar. Os percentuais são <b>referência (benchmark)</b> — viram reais assim que
            o anúncio rodar com as câmeras de medição já instaladas na página.
          </span>
        </div>
      </div>

      <h4 className="strat-h">📣 O plano de campanha</h4>
      <div className="strat-plan">
        {STRAT_PLAN.map((p) => (
          <div className="strat-plan-card" key={p.t}>
            <span className="strat-ico">{p.icon}</span>
            <strong>{p.t}</strong>
            <p>{p.d}</p>
          </div>
        ))}
      </div>

      <h4 className="strat-h">🛤️ O caminho da cliente (funil)</h4>
      <p className="strat-sub">De cada <b>1.000 mulheres</b> que entram na página, quantas chegam até a compra:</p>
      <div className="strat-funnel">
        {STRAT_FUNNEL.map((f) => (
          <div className="strat-fn-row" key={f.label}>
            <span className="strat-fn-label">{f.label}</span>
            <div className="strat-fn-bar">
              <span className={f.lead ? "lead" : ""} style={{ width: `${f.pct}%` }}>
                <b>{f.v.toLocaleString("pt-BR")}</b>
              </span>
            </div>
            <span className="strat-fn-pct">{f.note}</span>
          </div>
        ))}
      </div>
      <p className="strat-tip">💡 Cada degrau que cai muito é onde estamos perdendo dinheiro. As câmeras na página mostram <b>exatamente</b> em qual degrau a cliente desiste.</p>

      <h4 className="strat-h">📊 Mapa de números — o que é bom e o que é alerta</h4>
      <div className="strat-kpi">
        {STRAT_KPI.map((k) => (
          <div className="strat-kpi-row" key={k.t}>
            <span className="strat-kpi-t">{k.t}</span>
            <span className="strat-kpi-good">✓ bom: {k.bom}</span>
            <span className="strat-kpi-bad">✗ alerta: {k.ruim}</span>
          </div>
        ))}
      </div>
      <p className="strat-tip">⚠️ O ticket é R$37,89. Por isso a conta fecha melhor com <b>recompra</b> (o cupom de 50% pra continuar) e <b>indicação</b>. Vender só uma vez por cliente aperta a margem.</p>

      <h4 className="strat-h">🎯 Quanto custa chegar na meta de 1.000 leads</h4>
      <div className="strat-goal">
        {STRAT_GOAL.map((g) => (
          <div className="strat-goal-row" key={g.label}>
            <span className="strat-goal-label">{g.label}</span>
            <div className="strat-goal-bar">
              <span style={{ width: `${(g.invest / maxInvest) * 100}%` }}>R$ {g.invest.toLocaleString("pt-BR")}</span>
            </div>
          </div>
        ))}
      </div>
      <p className="strat-tip">Quanto mais barato o lead (CPL), menos você investe pra bater 1.000. Melhorar a página (Comando 3) e mirar o público certo <b>derruba o CPL</b> — por isso medir é tão importante.</p>

      <p className="cmd-hint"><b>Reporte ao Comando:</b> medição instalada na /nova (Pixel + GA4). Próximo passo: ligar o anúncio e este painel vira números reais.</p>
    </div>
  );
}

type CFItem = {
  id: string;
  tipo: string;
  tema?: string | null;
  roteiro_ref?: string | null;
  status: string;
  data_post?: string | null;
  hora_post?: string | null;
  skills?: string[] | null;
  asset_url?: string | null;
  legenda?: string | null;
};

// legenda guarda a CAPTION do post + (opcional) a galeria de slides do carrossel,
// separada por uma linha "---SLIDES---". Aqui a gente separa os dois.
function parseLegenda(legenda?: string | null): { caption: string; slides: string[] } {
  if (!legenda) return { caption: "", slides: [] };
  const [cap, gal] = legenda.split("---SLIDES---");
  const slides = (gal || "")
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//.test(s));
  return { caption: (cap || "").trim(), slides };
}
// Força download no Cloudinary (fl_attachment) em vez de abrir no navegador.
function toDownload(url: string): string {
  return url.includes("/upload/") ? url.replace("/upload/", "/upload/fl_attachment/") : url;
}
const CF_SKILLS_BY_TYPE: Record<string, string[]> = {
  story: ["ckm-banner-design", "ckm-design", "trinca-high-end-visual-design", "ui-ux-pro-max", "frontend-design", "trinca-marketing-psychology", "content-instagram-rv", "trinca-copywriting"],
  feed: ["ckm-design", "ckm-design-system", "trinca-high-end-visual-design", "ui-ux-pro-max", "frontend-design", "trinca-marketing-psychology", "trinca-copywriting", "brand-positioning-rv"],
  carrossel: ["ckm-design", "ckm-design-system", "ui-ux-pro-max", "frontend-design", "trinca-high-end-visual-design", "trinca-marketing-psychology", "objection-handling-rv", "trinca-copywriting"],
  reel: ["content-instagram-rv", "trinca-copywriting", "trinca-marketing-psychology", "trinca-high-end-visual-design", "ui-ux-pro-max", "audience-segmentation-rv"],
};
const CF_STATUS_LABEL: Record<string, string> = {
  solicitado: "Solicitado", criando: "Criando", em_aprovacao: "Aguardando aprovação",
  aprovado: "Aprovado", agendado: "Agendado", publicado: "Publicado", rejeitado: "Rejeitado", erro: "Erro",
};

const fmtToTipo = (format: string): string => {
  const f = (format || "").toLowerCase();
  if (f.includes("carrossel")) return "carrossel";
  if (f.includes("reel")) return "reel";
  if (f.includes("stor")) return "story";
  return "feed";
};
// "D1 · 18/06" + "07:30" -> data ISO e hora
const parseDia = (day: string): string => {
  const m = day.match(/(\d{2})\/(\d{2})/);
  return m ? `2026-${m[2]}-${m[1]}` : "";
};

type VipLead = { nome: string; whatsapp: string; email: string; instagram: string; objetivo: string; origem_label: string; capturado_em: string | null };
type VipData = { ok?: boolean; total?: number; novas24h?: number; porOrigem?: Array<{ origem: string; origem_label: string; count: number }>; leads?: VipLead[] };

function VipPanel() {
  const [data, setData] = useState<VipData | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = (typeof window !== "undefined" && window.localStorage.getItem(operacaoTokenStorageKey)) || "";
      const r = await fetch("/api/vip-leads", t ? { headers: { authorization: `Bearer ${t}` } } : undefined);
      setData((await r.json()) as VipData);
    } catch {
      setData(null);
    }
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const total = data?.total ?? 0;
  const novas = data?.novas24h ?? 0;
  const porOrigem = data?.porOrigem ?? [];
  const leads = data?.leads ?? [];
  const fmt = (s: string | null) => {
    if (!s) return "—";
    try { return new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
  };
  const card: React.CSSProperties = { background: "#16161a", border: "1px solid #26262c", borderRadius: 14, padding: 16 };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ ...card, flex: 1, minWidth: 150 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#f0c969" }}>{total}</div>
          <div style={{ fontSize: 13, color: "#a3a09a" }}>leads na Lista VIP</div>
        </div>
        <div style={{ ...card, flex: 1, minWidth: 150 }}>
          <div style={{ fontSize: 30, fontWeight: 800, color: "#5fd08a" }}>{novas}</div>
          <div style={{ fontSize: 13, color: "#a3a09a" }}>novos nas últimas 24h</div>
        </div>
        <button onClick={() => void load()} style={{ ...card, cursor: "pointer", color: "#f0c969", fontWeight: 700, fontSize: 13 }}>
          {loading ? "Atualizando…" : "🔄 Atualizar"}
        </button>
      </div>

      <div style={{ ...card, marginBottom: 16 }}>
        <strong style={{ fontSize: 14, color: "#f5f3ef" }}>📍 Por qual link chegaram</strong>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {porOrigem.length === 0 ? (
            <span style={{ color: "#8a867e", fontSize: 13 }}>Nenhum lead ainda.</span>
          ) : porOrigem.map((o) => (
            <span key={o.origem} style={{ background: "rgba(212,162,60,0.12)", border: "1px solid rgba(212,162,60,0.3)", borderRadius: 100, padding: "7px 13px", fontSize: 12.5, color: "#f0c969", fontWeight: 600 }}>
              {o.origem_label} <b style={{ color: "#f5f3ef" }}>· {o.count}</b>{o.origem ? <span style={{ color: "#7a766e" }}> ({o.origem})</span> : null}
            </span>
          ))}
        </div>
      </div>

      <div style={{ ...card, overflowX: "auto" }}>
        <strong style={{ fontSize: 14, color: "#f5f3ef" }}>👥 Leads ({leads.length})</strong>
        {leads.length === 0 ? (
          <p style={{ color: "#8a867e", fontSize: 13, marginTop: 10 }}>Assim que alguém entrar pelo /vip, aparece aqui com nome e dados.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10, fontSize: 13 }}>
            <thead>
              <tr style={{ color: "#8a867e", textAlign: "left" }}>
                <th style={{ padding: "8px 10px" }}>Nome</th>
                <th style={{ padding: "8px 10px" }}>WhatsApp</th>
                <th style={{ padding: "8px 10px" }}>@Instagram</th>
                <th style={{ padding: "8px 10px" }}>Email</th>
                <th style={{ padding: "8px 10px" }}>Objetivo</th>
                <th style={{ padding: "8px 10px" }}>Origem</th>
                <th style={{ padding: "8px 10px" }}>Quando</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l, i) => (
                <tr key={i} style={{ borderTop: "1px solid #26262c", color: "#e9e7e2" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 600 }}>{l.nome}</td>
                  <td style={{ padding: "8px 10px" }}>{l.whatsapp ? <a href={`https://wa.me/${l.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" style={{ color: "#5fd08a", textDecoration: "none" }}>{l.whatsapp}</a> : "—"}</td>
                  <td style={{ padding: "8px 10px", color: "#f0c969" }}>{l.instagram || "—"}</td>
                  <td style={{ padding: "8px 10px", color: "#a3a09a" }}>{l.email || "—"}</td>
                  <td style={{ padding: "8px 10px" }}>{l.objetivo || "—"}</td>
                  <td style={{ padding: "8px 10px", color: "#a3a09a" }}>{l.origem_label}</td>
                  <td style={{ padding: "8px 10px", color: "#7a766e" }}>{fmt(l.capturado_em)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Seção Conteúdo: o dia selecionado é compartilhado entre o painel do dia e a fila.
// A "Fábrica de Conteúdo" abaixo passa a mostrar SÓ os materiais daquele dia (filtra por data).
function ContentDaySection() {
  // Abre no dia de HOJE (Brasília) por padrão — não no D1. Senão o Ruriá via
  // os materiais de ontem e achava que os de hoje não tinham sido criados.
  const hojeBRT = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const hojeId = contentCalendar.find((d) => parseDia(d.day) === hojeBRT)?.id;
  const [sel, setSel] = useState(hojeId || contentCalendar[0]?.id || "");
  const dia = contentCalendar.find((d) => d.id === sel) || contentCalendar[0];
  const filterDate = dia ? parseDia(dia.day) : "";
  const dayShort = dia?.day?.split(" · ")[0] || "—";
  return (
    <>
      <h3 className="block-title">📅 Conteúdos por dia</h3>
      <ContentByDayPanel sel={sel} onSel={setSel} />
      <h3 className="block-title">🏭 Materiais de {dayShort} (criar / aprovar / publicar)</h3>
      <ContentFactoryPanel filterDate={filterDate} dayShort={dayShort} />
    </>
  );
}

function ContentByDayPanel({ sel: selProp, onSel }: { sel?: string; onSel?: (id: string) => void } = {}) {
  const [selInternal, setSelInternal] = useState(contentCalendar[0]?.id || "");
  const sel = selProp ?? selInternal;
  const setSel = onSel ?? setSelInternal;
  const [cbdMsg, setCbdMsg] = useState("");
  const dia = contentCalendar.find((d) => d.id === sel) || contentCalendar[0];
  const plan = dia ? DIA_PLANS[dia.id] : undefined;
  const faseInfo = plan ? FASES[plan.fase] : null;
  const fase = faseInfo ? { n: faseInfo.nome, c: faseInfo.cor } : { n: "Aquecimento", c: "#d4a23c" };
  const posts = (dia?.format || "").split(/[+,]/).map((s) => s.trim()).filter(Boolean);

  const acionarCriacao = async () => {
    if (!dia) return;
    const tipo = fmtToTipo(dia.format);
    const skills = CF_SKILLS_BY_TYPE[tipo] || CF_SKILLS_BY_TYPE.feed;
    const cmd = [
      `CRIAR CONTEÚDO PREMIUM — TRINCA RV21 · ${dia.day} (${dia.format})`,
      `Use a análise estratégica do projeto como base obrigatória: docs/estrategia-v2.md (audiência hoje é maioria homem → conteúdo CIRÚRGICO p/ mulher 25-44, gerar SAVE/COMPARTILHAMENTO pra reclassificar o algoritmo).`,
      `PROPÓSITO (pré-lançamento): aquecer + qualificar + ENCHER a lista VIP (/vip). NÃO vender ainda.`,
      `OBJETIVO DO DIA: ${dia.objective}`,
      `ÊNFASE: ${plan?.enfase || ""}`,
      ``,
      `CRIATIVOS A PRODUZIR (nível agência, preto+ouro, tipografia editorial, thumbnails com design gráfico/3D quando fizer sentido):`,
      ...(plan?.criativos || []).map((s) => `- ${s}`),
      ``,
      `STORIES DO DIA (5-10): produzir os cards criativos que acompanham os stories orgânicos do roteiro abaixo:`,
      ...(plan?.organico.roteiro || []).map((s) => `- ${s}`),
      ``,
      dia.roteiro ? `ROTEIRO DO REEL (take-a-take):\n${dia.roteiro}` : "",
      tipo === "reel" ? `REEL gravado em SELFIE pelo Ruriá → preparar direção de EDIÇÃO PROFISSIONAL pro Remotion (cortes, legendas dinâmicas sincronizadas, ganchos visuais, b-roll/texto na tela, trilha).` : "",
      ``,
      `SKILLS PREMIUM + ARSENAL A USAR: ${skills.join(", ")}. Pode usar Canva API e Adobe (ckm-design/banner) pros criativos.`,
      `AO TERMINAR: suba os materiais e marque o pedido como "em_aprovacao" no cockpit (fila abaixo) pra eu aprovar e agendar.`,
    ].filter(Boolean).join("\n");
    try {
      await navigator.clipboard?.writeText(cmd);
    } catch {}
    try {
      await fetch("/api/content-factory", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tipo,
          tema: `${dia.title} — ${dia.objective}`,
          roteiro_ref: dia.day,
          data_post: parseDia(dia.day),
          hora_post: dia.time,
          skills,
        }),
      });
    } catch {}
    setCbdMsg(`📋 ${dia.day}: comando PREMIUM copiado + pedido criado na fila. Cole no Claude Code pra gerar os criativos.`);
  };

  return (
    <div className="cbd">
      <div className="cbd-days">
        {contentCalendar.map((d) => (
          <button key={d.id} className={`cbd-chip ${d.id === sel ? "on" : ""}`} onClick={() => setSel(d.id)}>
            {d.day.split(" — ")[0]}
          </button>
        ))}
      </div>
      {dia ? (
        <div className="cbd-detail">
          <div className="cbd-head">
            <span className="cbd-fase" style={{ color: fase.c, borderColor: fase.c }}>{fase.n}</span>
            <span className="cbd-time">🕒 {dia.time}</span>
          </div>
          <h3>{dia.title}</h3>
          {faseInfo ? <p className="cbd-fasewhy"><b>{faseInfo.nome} ({faseInfo.dias}):</b> {faseInfo.significado}</p> : null}
          {plan?.significado ? <p className="cbd-signif"><b>📌 O que ESTE dia significa:</b> {plan.significado}</p> : null}
          <p className="cbd-obj">{dia.objective}</p>
          <div className="cbd-posts">
            <strong>Posts deste dia:</strong>
            {posts.map((p, i) => <span key={i} className="cbd-post">{p}</span>)}
          </div>
          {dia.script?.length ? (
            <div className="cbd-block">
              <strong>Roteiro (resumo)</strong>
              <ul>{dia.script.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          ) : null}
          {dia.roteiro ? (
            <details className="cbd-roteiro">
              <summary>📝 Roteiro take-a-take completo</summary>
              <pre>{dia.roteiro}</pre>
            </details>
          ) : null}
          {plan ? (
            <>
              <div className="cbd-emph"><b>🎯 Ênfase do dia:</b> {plan.enfase}</div>
              <div className="cbd-block cbd-org">
                <strong>📱 Stories ORGÂNICOS (selfie, a partir das 04:30)</strong>
                <p className="cbd-bomdia"><b>Bom dia:</b> {plan.organico.bomDia}</p>
                <p className="cbd-bomdia" style={{ color: "#f0c969", borderLeft: "2px solid #d4a23c", paddingLeft: 10, marginTop: 6 }}>{CTA_AUTOMACAO_STORY}</p>
                <ul>{plan.organico.roteiro.map((s, i) => <li key={i}>{s}</li>)}</ul>
                <span className="cbd-qtd">{plan.organico.qtd}</span>
              </div>
              <div className="cbd-block">
                <strong>🎨 Criativos (o Claude cria pra você)</strong>
                <ul>{plan.criativos.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
              <div className="cbd-traf"><b>📣 Tráfego do dia:</b> {plan.trafego}</div>
              <div className="cbd-block cbd-check">
                <strong>✅ Checklist do dia (siga de cima pra baixo)</strong>
                <ul>{plan.checklist.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
            </>
          ) : null}
          <p className="cbd-cta">
            🎯 Todo post chama pra LISTA VIP (/vip). No aquecimento NÃO se vende — captura-se. O motor manda os 3 toques de nutrição sozinho.
          </p>
          <div className="cbd-actions">
            <button className="cbd-act primary" onClick={() => void acionarCriacao()}>🎨 Acionar criação (skills premium)</button>
            <button className="cbd-act" onClick={() => window.open("/upload", "_blank")}>📤 Enviar vídeo bruto (Reels → Remotion)</button>
            <button className="cbd-act" onClick={() => document.querySelector(".cf")?.scrollIntoView({ behavior: "smooth" })}>👀 Ver materiais criados</button>
          </div>
          {cbdMsg ? <p className="cbd-done">{cbdMsg}</p> : null}
        </div>
      ) : null}
      <style jsx>{`
        .cbd { margin-bottom: 18px; }
        .cbd-days { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 6px; margin-bottom: 12px; }
        .cbd-chip { flex-shrink: 0; background: #16161a; border: 1px solid #26262c; color: #a3a09a; font-size: 12px; font-weight: 700; padding: 8px 12px; border-radius: 10px; cursor: pointer; }
        .cbd-chip.on { background: rgba(212,162,60,.14); border-color: rgba(212,162,60,.4); color: #f0c969; }
        .cbd-detail { background: #16161a; border: 1px solid #26262c; border-radius: 14px; padding: 16px; }
        .cbd-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .cbd-fase { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 100px; border: 1px solid; text-transform: uppercase; letter-spacing: .04em; }
        .cbd-time { font-size: 12px; color: #a3a09a; }
        .cbd-detail h3 { font-size: 17px; font-weight: 800; color: #f5f3ef; margin: 0 0 4px; }
        .cbd-obj { font-size: 13px; color: #a3a09a; margin-bottom: 12px; }
        .cbd-fasewhy { font-size: 12px; color: #cfccc6; background: rgba(212,162,60,.06); border-left: 2px solid #d4a23c; padding: 7px 10px; border-radius: 6px; margin-bottom: 8px; line-height: 1.45; }
        .cbd-fasewhy b { color: #f0c969; }
        .cbd-signif { font-size: 13px; color: #e8e6e1; background: #0f0f12; border: 1px solid #26262c; padding: 9px 11px; border-radius: 8px; margin-bottom: 12px; line-height: 1.5; }
        .cbd-signif b { color: #5fd08a; }
        .cbd-posts { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; margin-bottom: 12px; }
        .cbd-posts strong { font-size: 12px; color: #d8d5cf; margin-right: 4px; }
        .cbd-post { background: #1d1d22; border: 1px solid #26262c; color: #f0c969; font-size: 12px; font-weight: 600; padding: 5px 11px; border-radius: 100px; }
        .cbd-block { margin-bottom: 10px; }
        .cbd-block strong { font-size: 12.5px; color: #d8d5cf; }
        .cbd-block ul { margin: 6px 0 0 16px; }
        .cbd-block li { font-size: 13px; color: #c9c6c0; margin-bottom: 4px; }
        .cbd-roteiro { margin: 8px 0; }
        .cbd-roteiro summary { cursor: pointer; font-size: 12.5px; font-weight: 700; color: #f0c969; }
        .cbd-roteiro pre { white-space: pre-wrap; font-size: 12px; color: #c9c6c0; background: #0f0f12; border: 1px solid #26262c; border-radius: 10px; padding: 12px; margin-top: 8px; font-family: inherit; }
        .cbd-cta { font-size: 12px; color: #6f6c66; background: rgba(212,162,60,.06); border: 1px solid rgba(212,162,60,.18); border-radius: 10px; padding: 9px 11px; margin-top: 6px; }
        .cbd-emph { font-size: 13px; color: #f0c969; background: rgba(212,162,60,.08); border: 1px solid rgba(212,162,60,.22); border-radius: 10px; padding: 10px 12px; margin: 10px 0; }
        .cbd-emph b { color: #f5f3ef; }
        .cbd-org { background: rgba(95,208,138,.05); border: 1px solid rgba(95,208,138,.2); border-radius: 10px; padding: 10px 12px; }
        .cbd-bomdia { font-size: 12.5px; color: #c9c6c0; margin: 6px 0; }
        .cbd-bomdia b { color: #5fd08a; }
        .cbd-qtd { font-size: 12px; color: #6f6c66; font-style: italic; }
        .cbd-traf { font-size: 12.5px; color: #d8d5cf; background: #1d1d22; border-radius: 10px; padding: 9px 11px; margin: 8px 0; }
        .cbd-traf b { color: #6fa8ff; }
        .cbd-check { background: rgba(240,201,105,.05); border: 1px solid rgba(240,201,105,.2); border-radius: 10px; padding: 10px 12px; }
        .cbd-check strong { color: #f0c969; }
        .cbd-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .cbd-act { background: #1d1d22; border: 1px solid #26262c; color: #d8d5cf; font-size: 12.5px; font-weight: 700; padding: 11px 14px; border-radius: 10px; cursor: pointer; }
        .cbd-act.primary { background: linear-gradient(135deg,#d4a23c,#e8b04a); color: #1a1206; border: none; }
        .cbd-done { font-size: 12.5px; color: #5fd08a; background: rgba(95,208,138,.08); border: 1px solid rgba(95,208,138,.25); border-radius: 10px; padding: 9px 11px; margin-top: 8px; }
      `}</style>
    </div>
  );
}

function ContentFactoryPanel({ filterDate, dayShort }: { filterDate?: string; dayShort?: string } = {}) {
  const [items, setItems] = useState<CFItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/content-factory");
      const j = (await r.json()) as { items?: CFItem[] };
      setItems(Array.isArray(j.items) ? j.items : []);
    } catch {
      /* silencioso */
    }
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const patch = async (id: string, status: string) => {
    await fetch("/api/content-factory", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    void load();
  };

  // Define o horário agendado (HH:MM, Brasília). Ao Aprovar, o motor posta nesse horário.
  const setHora = async (id: string, hora_post: string) => {
    await fetch("/api/content-factory", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, hora_post }),
    });
    void load();
  };

  // 1.1 — Aciona a criação de um DIA do roteiro fixo, travando o contexto do pré-lançamento
  const acionarDia = async (c: (typeof contentCalendar)[number]) => {
    const tipo = fmtToTipo(c.format);
    const skills = CF_SKILLS_BY_TYPE[tipo] || CF_SKILLS_BY_TYPE.feed;
    const data_post = parseDia(c.day);
    const contexto = [
      `CRIAR CONTEÚDO TRINCA RV21 — ${c.day} (${c.format})`,
      `PROPÓSITO PRÉ-LANÇAMENTO: aquecer leads, qualificar a mulher 25-44 que já desistiu, e gerar dados/métricas pro lançamento. NÃO fuja deste contexto.`,
      `OBJETIVO DO DIA: ${c.objective}`,
      `TÍTULO: ${c.title}`,
      `ROTEIRO/DIREÇÃO:`,
      ...c.script.map((s) => `- ${s}`),
      c.roteiro ? `\nROTEIRO DETALHADO (timecode):\n${c.roteiro}` : "",
      `\nPADRÃO: nível premium da landing /nova (preto+ouro, tipografia editorial). Aplique psicologia de conversão e a voz do Ruriá.`,
      `SKILLS A USAR: ${skills.join(", ")}.`,
      `AO TERMINAR: suba o material e marque o pedido como "em_aprovacao" no cockpit.`,
    ].filter(Boolean).join("\n");
    void navigator.clipboard?.writeText(contexto);
    // registra o pedido na fila (com contexto travado)
    await fetch("/api/content-factory", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        tipo,
        tema: `${c.title} — ${c.objective}`,
        roteiro_ref: c.day,
        data_post,
        hora_post: c.time,
        skills,
      }),
    }).catch(() => {});
    setMsg(`📋 ${c.day}: comando copiado (contexto travado) + pedido criado na fila. Cole no Claude Code pra gerar.`);
    void load();
  };

  // Mostra SÓ os materiais do dia selecionado (filtra por data). Sem filtro = mostra todos.
  const shown = filterDate ? items.filter((it) => (it.data_post || "") === filterDate) : items;

  return (
    <div className="cf">
      {msg ? <p className="cf-msg">{msg}</p> : null}

      <div className="cf-intro">
        <strong>📥 Materiais{dayShort ? ` de ${dayShort}` : ""}</strong>
        <span>Clique em “Ver material” pra visualizar o card pronto. Depois aprove, deixe em aprovação ou rejeite.</span>
      </div>
      <div className="cf-list">
        {loading ? (
          <p className="cf-empty">Carregando…</p>
        ) : shown.length === 0 ? (
          <p className="cf-empty">Nenhum material{dayShort ? ` em ${dayShort}` : ""} ainda. Use “Acionar criação” no dia acima.</p>
        ) : (
          shown.map((it) => (
            <div className="cf-item" key={it.id}>
              <div className="cf-item-top">
                <span className="cf-tipo">{it.tipo}</span>
                <strong>{it.roteiro_ref ? `${it.roteiro_ref} · ` : ""}{it.tema || "—"}</strong>
                <span className={`cmd-status ${it.status === "publicado" || it.status === "aprovado" ? "ok" : it.status === "rejeitado" || it.status === "erro" ? "wait" : "run"}`}>
                  {CF_STATUS_LABEL[it.status] || it.status}
                </span>
              </div>
              <div className="cf-item-meta">{it.data_post || "sem data"} {it.hora_post || ""}</div>
              {it.asset_url ? (
                (() => {
                  const { caption, slides } = parseLegenda(it.legenda);
                  const gallery = slides.length ? slides : [it.asset_url as string];
                  const isCarrossel = it.tipo === "carrossel" && slides.length > 1;
                  return (
                    <div style={{ margin: "8px 0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <a href={it.asset_url} target="_blank" rel="noopener noreferrer">
                          <img src={it.asset_url} alt={it.tema || "material"} style={{ width: 78, height: 138, objectFit: "cover", borderRadius: 8, border: "1px solid #2a2a30", display: "block" }} />
                        </a>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          <a href={it.asset_url} target="_blank" rel="noopener noreferrer" style={{ color: "#1a1206", background: "linear-gradient(135deg,#d4a23c,#f0c969)", fontWeight: 800, fontSize: 12.5, padding: "9px 14px", borderRadius: 10, textDecoration: "none", textAlign: "center" }}>👁️ Ver material</a>
                          <a href={toDownload(it.asset_url as string)} download style={{ color: "#f0c969", background: "rgba(212,162,60,.12)", border: "1px solid rgba(212,162,60,.4)", fontWeight: 800, fontSize: 12.5, padding: "9px 14px", borderRadius: 10, textDecoration: "none", textAlign: "center" }}>⬇️ Baixar {isCarrossel ? "capa" : "criativo"}</a>
                        </div>
                      </div>
                      {isCarrossel ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
                          {gallery.map((u, i) => (
                            <a key={i} href={toDownload(u)} download style={{ color: "#d8d5cf", background: "#1a1a1f", border: "1px solid #2a2a30", fontSize: 12, fontWeight: 700, padding: "7px 11px", borderRadius: 9, textDecoration: "none" }}>⬇️ Slide {i + 1}</a>
                          ))}
                        </div>
                      ) : null}
                      {caption ? (
                        <details style={{ marginTop: 10 }}>
                          <summary style={{ cursor: "pointer", color: "#8a867e", fontSize: 12.5, fontWeight: 700 }}>📋 Ver legenda do post</summary>
                          <textarea readOnly value={caption} style={{ width: "100%", minHeight: 120, marginTop: 8, background: "#0a0a0f", color: "#d8d5cf", border: "1px solid #2a2a30", borderRadius: 10, padding: 12, fontSize: 13, lineHeight: 1.5, fontFamily: "inherit", resize: "vertical" }} />
                        </details>
                      ) : null}
                    </div>
                  );
                })()
              ) : (
                <div style={{ fontSize: 12, color: "#8a867e", margin: "6px 0" }}>Sem material ainda — aparece aqui quando o Claude produz.</div>
              )}
              {it.tipo !== "story" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "10px 0 4px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: "#8a867e", fontWeight: 700 }}>⏰ Agendado p/</span>
                  <input
                    type="time"
                    defaultValue={(it.hora_post || "").slice(0, 5)}
                    onChange={(e) => void setHora(it.id, e.target.value)}
                    style={{ background: "#0a0a0f", color: "#f0c969", border: "1px solid #2a2a30", borderRadius: 8, padding: "6px 10px", fontWeight: 700, fontSize: 13 }}
                  />
                  <span style={{ fontSize: 11.5, color: it.status === "aprovado" && it.hora_post ? "#5fd08a" : "#8a867e" }}>
                    {it.status === "aprovado" && it.hora_post
                      ? "✅ aprovado — o motor posta no horário (Brasília)"
                      : it.tipo === "reel"
                        ? "reel: sobe o vídeo gravado antes de aprovar"
                        : "defina o horário e clique Aprovar p/ agendar"}
                  </span>
                </div>
              ) : (
                <div style={{ fontSize: 11.5, color: "#8a867e", margin: "8px 0 4px" }}>📲 Story é postado manual (a Meta não permite auto-post de stories).</div>
              )}
              <div className="cf-item-btns">
                <button onClick={() => void patch(it.id, "aprovado")}>✅ Aprovar {it.tipo !== "story" && it.hora_post ? `(posta ${(it.hora_post || "").slice(0, 5)})` : ""}</button>
                <button onClick={() => void patch(it.id, "em_aprovacao")}>👀 Em aprovação</button>
                <button onClick={() => void patch(it.id, "rejeitado")}>❌ Rejeitar</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ComandoHub({ live }: { live?: LivePulse }) {
  const [view, setView] = useState<"setores" | "saude" | "estrategia" | "conteudo" | "inteligencia">("setores");
  const tabs = [
    { key: "setores", icon: <LayoutGrid size={22} />, label: "Setores", desc: "Os 8 departamentos e o que falta em cada um", tone: "gold" },
    { key: "saude", icon: <Radio size={22} />, label: "Saúde", desc: "Está tudo no ar? Erros e avisos", tone: "green" },
    { key: "estrategia", icon: <BarChart3 size={22} />, label: "Estratégia", desc: "Tráfego, funil e a meta de 1.000", tone: "blue" },
    { key: "conteudo", icon: <CalendarDays size={22} />, label: "Conteúdo", desc: "Ir pra Fábrica de posts", tone: "purple" },
    { key: "inteligencia", icon: <Sparkles size={22} />, label: "Inteligência", desc: "Especialistas e skills pra acionar", tone: "gold" },
  ] as const;
  return (
    <div className="hub">
      {live ? (
        <div className="cmd-pulse hub-pulse">
          <div className="cmd-pulse-item"><span>Leads</span><b>{live.leads}<i>/{live.leadGoal}</i></b></div>
          <div className="cmd-pulse-item"><span>Do Google</span><b className="g">{live.googleLeads}</b></div>
          <div className="cmd-pulse-item"><span>Vendas hoje</span><b>{live.sales}</b></div>
          <div className="cmd-pulse-item"><span>Receita hoje</span><b>{live.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</b></div>
        </div>
      ) : null}
      <div className="hub-nav">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`hub-btn ${t.tone} ${view === t.key ? "on" : ""}`}
            onClick={() => setView(t.key)}
          >
            <span className="hub-ico">{t.icon}</span>
            <strong>{t.label}</strong>
            <span className="hub-desc">{t.desc}</span>
          </button>
        ))}
      </div>
      <div className="hub-view">
        {view === "setores" ? <CommandSection live={live} hidePulse /> : null}
        {view === "saude" ? (<><ProjectHealthPanel live={live} /><MonitorPanel /></>) : null}
        {view === "estrategia" ? <StrategyPanel /> : null}
        {view === "conteudo" ? (
          <p className="hub-hint">📅 A criação de posts está na aba <b>Conteúdo</b> (barra de baixo). Lá você aciona o roteiro dos 13 dias com 1 toque.</p>
        ) : null}
        {view === "inteligencia" ? <IntelligenceSection /> : null}
      </div>
    </div>
  );
}

function IntelligenceSection() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (text: string, label: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    });
  };
  return (
    <>
      <div className="intel-head">
        <Sparkles size={16} /> Experts premium — atuam sobre todos os setores
      </div>
      <div className="expert-grid">
        {EXPERTS.map((e) => (
          <button className="expert-card" key={e.name} onClick={() => copy(e.cmd, e.name)}>
            <span className="expert-top">
              {e.icon}
              <strong>{e.name}</strong>
            </span>
            <span className="expert-tag">{e.tag}</span>
            <p>{e.desc}</p>
            <span className="expert-atua">{copied === e.name ? "✓ Comando copiado" : `Atua: ${e.atua}`}</span>
          </button>
        ))}
      </div>
      <div className="intel-head" style={{ marginTop: 18 }}>
        <LayoutGrid size={16} /> Arsenal de skills — clique para designar
      </div>
      <div className="arsenal-grid">
        {ARSENAL.map((c) => (
          <div className="ars-col" key={c.col}>
            <h4>{c.col}</h4>
            {c.items.map((it) => (
              <button
                className="ars-skill"
                key={it.n}
                onClick={() => copy(`Use a skill ${it.n} para a próxima tarefa do TRINCA RV21 que eu vou descrever.`, it.n)}
              >
                <span className="ars-skill-n">{it.n}</span>
                <span className="ars-skill-d">{copied === it.n ? "✓ copiado" : it.d}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
    </>
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
        grid-template-columns: repeat(9, 1fr);
        gap: 2px;
        background: rgba(10, 10, 15, 0.94);
        border-top: 1px solid #1e1e2e;
        padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
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

      /* ===== MONITOR / SAÚDE ===== */
      .monitor-card {
        background: linear-gradient(180deg, #16161f, #101015);
        border: 1px solid #1e1e2e;
        border-radius: 16px;
        padding: 16px;
        margin-top: 14px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .mon-head {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .mon-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex: none;
        background: rgba(255, 255, 255, 0.3);
      }
      .mon-dot.ok {
        background: #00e676;
        box-shadow: 0 0 10px rgba(0, 230, 118, 0.6);
      }
      .mon-dot.warn {
        background: #ffd740;
        box-shadow: 0 0 10px rgba(255, 215, 0, 0.6);
      }
      .mon-dot.critical {
        background: #ff5252;
        box-shadow: 0 0 10px rgba(255, 82, 82, 0.7);
      }
      .mon-title {
        flex: 1;
        min-width: 0;
      }
      .mon-title strong {
        display: block;
        font-size: 13px;
      }
      .mon-title span {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.54);
      }
      .mon-refresh {
        flex: none;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid #1e1e2e;
        color: rgba(255, 255, 255, 0.7);
        border-radius: 9px;
        padding: 8px;
        cursor: pointer;
      }
      .mon-hint {
        font-size: 11.5px;
        color: #ffd740;
      }
      .mon-list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12px;
      }
      .mon-list.crit li {
        color: #ff8a80;
      }
      .mon-list.warn li {
        color: rgba(255, 215, 64, 0.9);
      }
      .mon-ok {
        font-size: 12px;
        color: #00e676;
      }
      .mon-actions {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }
      .mon-test {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: rgba(255, 215, 64, 0.1);
        border: 1px solid rgba(255, 215, 0, 0.28);
        color: #ffd740;
        border-radius: 10px;
        padding: 9px 14px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
      .mon-test:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .mon-testmsg {
        font-size: 11.5px;
        color: rgba(255, 255, 255, 0.7);
      }

      /* ===== COMANDO ===== */
      .cmd-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        margin-top: 14px;
      }
      .cmd-card {
        background: linear-gradient(180deg, #16161f, #101015);
        border: 1px solid #1e1e2e;
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .cmd-card-head {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .cmd-ico {
        width: 38px;
        height: 38px;
        border-radius: 11px;
        display: grid;
        place-items: center;
        background: rgba(255, 215, 0, 0.1);
        color: #ffd740;
        flex: none;
      }
      .cmd-card-title {
        flex: 1;
        min-width: 0;
      }
      .cmd-card-title strong {
        display: block;
        font-size: 14px;
        letter-spacing: 0.3px;
      }
      .cmd-card-title span {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.54);
      }
      .cmd-status {
        font-size: 9.5px;
        font-weight: 800;
        letter-spacing: 0.5px;
        padding: 5px 9px;
        border-radius: 999px;
        flex: none;
      }
      .cmd-status.ok {
        background: rgba(0, 230, 118, 0.12);
        color: #00e676;
      }
      .cmd-status.run {
        background: rgba(255, 215, 0, 0.14);
        color: #ffd740;
      }
      .cmd-status.wait {
        background: rgba(255, 82, 82, 0.13);
        color: #ff8a80;
      }
      .cmd-status.new {
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.7);
      }
      .cmd-domain {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.62);
        border-left: 2px solid rgba(255, 215, 0, 0.5);
        padding-left: 9px;
      }
      .cmd-report {
        font-size: 11.5px;
        color: rgba(255, 255, 255, 0.68);
        line-height: 1.5;
        background: rgba(255, 215, 0, 0.06);
        border: 1px solid rgba(255, 215, 0, 0.18);
        border-radius: 8px;
        padding: 9px 11px;
      }
      .cmd-report b {
        display: block;
        font-size: 9px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        color: #ffd740;
        margin-bottom: 3px;
      }
      .cmd-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
      }
      .chip {
        font-size: 10.5px;
        padding: 3px 8px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid #1e1e2e;
      }
      .chip-skill {
        color: #ffd740;
        border-color: rgba(255, 215, 0, 0.24);
      }
      .chip-conn {
        color: rgba(255, 255, 255, 0.7);
      }
      .cmd-check {
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 5px;
        font-size: 12px;
        margin: 0;
        padding: 0;
      }
      .cmd-check li {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        color: rgba(255, 255, 255, 0.66);
      }
      .cmd-check li.done {
        color: rgba(255, 255, 255, 0.4);
        text-decoration: line-through;
      }
      .check-mark {
        flex: none;
        width: 16px;
        height: 16px;
        border-radius: 5px;
        display: grid;
        place-items: center;
        font-size: 9px;
        font-weight: 900;
        margin-top: 1px;
      }
      .check-mark.d {
        background: rgba(0, 230, 118, 0.16);
        color: #00e676;
      }
      .check-mark.p {
        background: rgba(255, 215, 0, 0.14);
        color: #ffd740;
      }
      .check-mark.x {
        background: rgba(255, 82, 82, 0.13);
        color: #ff8a80;
      }
      .cmd-actions {
        display: flex;
        gap: 8px;
        margin-top: 2px;
      }
      .cmd-btn {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        background: linear-gradient(180deg, #FFD700, #ffb300);
        color: #1a1407;
        border: 0;
        border-radius: 10px;
        padding: 11px;
        font-size: 12.5px;
        font-weight: 800;
        cursor: pointer;
      }
      .cmd-btn-upd {
        flex: none;
        display: inline-grid;
        place-items: center;
        background: rgba(255, 215, 64, 0.1);
        border: 1px solid rgba(255, 215, 0, 0.28);
        color: #ffd740;
        border-radius: 10px;
        padding: 0 14px;
        cursor: pointer;
      }
      .cmd-hint {
        font-size: 11.5px;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 12px;
      }

      /* ===== INTELIGÊNCIA ===== */
      .intel-head {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 800;
        color: #ffd740;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin: 14px 0 10px;
      }
      .expert-grid,
      .arsenal-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
      }
      .expert-card {
        text-align: left;
        background: linear-gradient(180deg, #16161f, #101015);
        border: 1px solid #1e1e2e;
        border-top: 2px solid rgba(255, 215, 0, 0.5);
        border-radius: 14px;
        padding: 14px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .expert-top {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #ffd740;
      }
      .expert-top strong {
        font-size: 13px;
        color: #fff;
      }
      .expert-tag {
        font-size: 10px;
        color: rgba(255, 215, 0, 0.8);
        font-family: ui-monospace, Menlo, monospace;
      }
      .expert-card p {
        font-size: 11.5px;
        color: rgba(255, 255, 255, 0.62);
        line-height: 1.45;
        margin: 2px 0;
      }
      .expert-atua {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.5);
        border-top: 1px solid #1e1e2e;
        padding-top: 7px;
      }
      .ars-col {
        background: #13131a;
        border: 1px solid #1e1e2e;
        border-radius: 14px;
        padding: 14px;
      }
      .ars-col h4 {
        font-size: 12px;
        color: #ffd740;
        margin: 0 0 9px;
      }
      .ars-skill {
        width: 100%;
        text-align: left;
        display: flex;
        flex-direction: column;
        gap: 1px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid #1e1e2e;
        border-radius: 9px;
        padding: 8px 10px;
        margin-bottom: 6px;
        cursor: pointer;
      }
      .ars-skill-n {
        font-size: 11.5px;
        color: #fff;
        font-weight: 600;
      }
      .ars-skill-d {
        font-size: 10px;
        color: rgba(255, 255, 255, 0.5);
      }

      .health-card {
        background: linear-gradient(180deg, #13131a, #0f0f15);
        border: 1px solid #1e1e2e;
        border-left: 3px solid #FFD700;
        border-radius: 16px;
        padding: 18px;
        margin-bottom: 14px;
      }
      .health-top {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
      }
      .health-score {
        flex: none;
        width: 92px;
        height: 92px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        text-align: center;
        border: 3px solid rgba(255, 215, 0, 0.3);
        background: rgba(255, 215, 0, 0.06);
      }
      .health-score.green {
        border-color: rgba(0, 230, 118, 0.4);
        background: rgba(0, 230, 118, 0.08);
      }
      .health-score.red {
        border-color: rgba(255, 82, 82, 0.4);
        background: rgba(255, 82, 82, 0.08);
      }
      .health-score strong {
        font-size: 26px;
        line-height: 1;
        color: #ffd740;
      }
      .health-score.green strong {
        color: #00e676;
      }
      .health-score.red strong {
        color: #ff8a80;
      }
      .health-score span {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: rgba(255, 255, 255, 0.54);
        margin-top: 3px;
      }
      .health-intro strong {
        font-size: 16px;
        color: #fff;
      }
      .health-intro p {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.62);
        margin-top: 4px;
      }
      .health-bars {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .hrow-top {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 8px;
      }
      .hname {
        font-size: 12.5px;
        color: #fff;
        font-weight: 600;
      }
      .hpct {
        font-size: 12.5px;
        font-variant-numeric: tabular-nums;
      }
      .hpct.green {
        color: #00e676;
      }
      .hpct.gold {
        color: #ffd740;
      }
      .hpct.red {
        color: #ff8a80;
      }
      .hbar {
        height: 8px;
        background: #0a0a0f;
        border: 1px solid #1e1e2e;
        border-radius: 99px;
        overflow: hidden;
        margin: 5px 0 4px;
      }
      .hbar span {
        display: block;
        height: 100%;
        border-radius: 99px;
        background: #ffd740;
      }
      .hbar span.green {
        background: #00e676;
      }
      .hbar span.red {
        background: #ff5252;
      }
      .hdesc {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.54);
        line-height: 1.45;
      }
      .health-two {
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
        margin-top: 16px;
      }
      .health-col {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid #1e1e2e;
        border-radius: 12px;
        padding: 13px 15px;
      }
      .health-col.ok {
        border-left: 2px solid #00e676;
      }
      .health-col.todo {
        border-left: 2px solid #ffd740;
      }
      .health-col strong {
        font-size: 12.5px;
        color: #fff;
        display: block;
        margin-bottom: 8px;
      }
      .health-col ul,
      .health-col ol {
        margin: 0;
        padding-left: 18px;
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .health-col li {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.68);
        line-height: 1.4;
      }
      .health-foot {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.5);
        margin-top: 12px;
        text-align: center;
      }

      @media (min-width: 720px) {
        .health-two {
          grid-template-columns: 1fr 1fr;
        }
        .cmd-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .expert-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .arsenal-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
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

      /* === Comando 1.5 — HUB interativo da Central de Comando === */
      .hub { display: flex; flex-direction: column; gap: 14px; }
      .hub-pulse { margin-bottom: 2px; }
      .hub-nav { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
      .hub-btn { position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; background: #141418; border: 1px solid #26262e; border-radius: 16px; padding: 15px 16px; cursor: pointer; font-family: inherit; color: #f6f4ef; transition: transform .18s cubic-bezier(.34,1.56,.64,1), border-color .18s, background .18s; }
      .hub-btn:hover { transform: translateY(-3px); }
      .hub-btn .hub-ico { display: inline-flex; width: 44px; height: 44px; border-radius: 12px; align-items: center; justify-content: center; margin-bottom: 6px; transition: transform .25s; }
      .hub-btn:hover .hub-ico { transform: scale(1.08) rotate(-3deg); }
      .hub-btn strong { font-size: 15px; }
      .hub-btn .hub-desc { font-size: 11.5px; color: #a09c94; }
      .hub-btn.gold .hub-ico { background: rgba(212,162,60,0.16); color: #f0c969; }
      .hub-btn.green .hub-ico { background: rgba(91,187,95,0.16); color: #5bbb5f; }
      .hub-btn.blue .hub-ico { background: rgba(96,165,250,0.16); color: #7eb6ff; }
      .hub-btn.purple .hub-ico { background: rgba(186,140,255,0.16); color: #c4a2ff; }
      .hub-btn.on { background: linear-gradient(160deg, rgba(212,162,60,0.10), #141418); border-color: rgba(212,162,60,0.5); }
      .hub-btn.green.on { border-color: rgba(91,187,95,0.5); background: linear-gradient(160deg, rgba(91,187,95,0.10), #141418); }
      .hub-btn.blue.on { border-color: rgba(96,165,250,0.5); background: linear-gradient(160deg, rgba(96,165,250,0.10), #141418); }
      .hub-btn.purple.on { border-color: rgba(186,140,255,0.5); background: linear-gradient(160deg, rgba(186,140,255,0.10), #141418); }
      .hub-btn.on::after { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: currentColor; opacity: .5; }
      .hub-view { animation: hubfade .35s ease; }
      .hub-hint { background: rgba(186,140,255,0.07); border: 1px solid rgba(186,140,255,0.25); border-radius: 12px; padding: 14px 16px; font-size: 13px; color: #cfcabf; line-height: 1.5; }
      .hub-hint b { color: #c4a2ff; }
      @keyframes hubfade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      @media (min-width: 720px) { .hub-nav { grid-template-columns: repeat(4, 1fr); } }

      /* === Comando 4.5 — Aba Comando reorganizada (fases + cards + pulso) === */
      .cmd-pulse { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 12px; }
      .cmd-pulse-item { background: #141418; border: 1px solid #26262e; border-radius: 12px; padding: 11px 13px; }
      .cmd-pulse-item span { display: block; font-size: 10.5px; color: #a09c94; text-transform: uppercase; letter-spacing: .04em; }
      .cmd-pulse-item b { font-size: 20px; font-weight: 800; color: #f0c969; font-variant-numeric: tabular-nums; }
      .cmd-pulse-item b i { font-style: normal; font-size: 12px; color: #6c6962; }
      .cmd-pulse-item b.g { color: #5bbb5f; }
      .cmd-phases { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
      .cmd-phase-chip { display: inline-flex; flex-direction: column; align-items: flex-start; background: #141418; border: 1px solid #26262e; border-radius: 11px; padding: 8px 13px; color: #a09c94; font-size: 12.5px; font-weight: 700; cursor: pointer; transition: .18s; font-family: inherit; }
      .cmd-phase-chip i { font-style: normal; font-size: 10px; font-weight: 600; color: #6c6962; }
      .cmd-phase-chip.on { border-color: #d4a23c; background: rgba(212,162,60,0.1); color: #f0c969; }
      .cmd-phase-chip.on i { color: #d4a23c; }
      .cmd-grid2 { display: grid; grid-template-columns: 1fr; gap: 11px; }
      .cmd-card2 { background: #141418; border: 1px solid #26262e; border-radius: 15px; padding: 13px 15px; }
      .cmd-card2.open { border-color: rgba(212,162,60,0.4); }
      .cmd-card2-head { display: flex; align-items: center; gap: 11px; width: 100%; background: none; border: none; cursor: pointer; font-family: inherit; text-align: left; padding: 0; }
      .cmd-ico2 { display: inline-flex; width: 36px; height: 36px; border-radius: 10px; background: rgba(212,162,60,0.12); color: #f0c969; align-items: center; justify-content: center; flex-shrink: 0; }
      .cmd-c2-title { flex: 1; min-width: 0; }
      .cmd-c2-title strong { display: block; font-size: 14px; color: #f6f4ef; }
      .cmd-c2-title span { font-size: 11px; color: #a09c94; }
      .cmd-prog { display: flex; align-items: center; gap: 9px; margin: 11px 0 9px; }
      .cmd-prog-bar { flex: 1; height: 8px; background: #0f0f12; border-radius: 5px; overflow: hidden; }
      .cmd-prog-bar span { display: block; height: 100%; background: linear-gradient(90deg,#a06f1e,#d4a23c); border-radius: 5px; transition: width .8s ease; }
      .cmd-prog b { font-size: 12px; color: #f0c969; font-weight: 800; font-variant-numeric: tabular-nums; min-width: 36px; text-align: right; }
      .cmd-c2-report { font-size: 12.5px; color: #a09c94; line-height: 1.5; margin-bottom: 11px; }
      .cmd-c2-btns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; }
      .c2b { padding: 9px 6px; border-radius: 10px; font-size: 11.5px; font-weight: 700; cursor: pointer; font-family: inherit; border: 1px solid #26262e; background: #0f0f12; color: #f6f4ef; transition: .16s; }
      .c2b.urg { border-color: rgba(229,115,115,0.4); color: #e57373; }
      .c2b.urg:hover { background: rgba(229,115,115,0.1); }
      .c2b.act { border-color: rgba(212,162,60,0.45); color: #f0c969; }
      .c2b.act:hover { background: rgba(212,162,60,0.1); }
      .c2b.rep:hover { background: rgba(255,255,255,0.04); }
      .cmd-c2-detail { margin-top: 12px; padding-top: 12px; border-top: 1px solid #26262e; }
      @media (min-width: 720px) {
        .cmd-pulse { grid-template-columns: repeat(4, 1fr); }
        .cmd-grid2 { grid-template-columns: repeat(2, 1fr); }
      }

      .legacy-notion { margin-top: 16px; background: #0f0f12; border: 1px solid #26262e; border-radius: 12px; padding: 12px 14px; }
      .legacy-notion summary { cursor: pointer; font-size: 13px; font-weight: 700; color: #a09c94; }
      .legacy-note { font-size: 12px; color: #6c6962; line-height: 1.5; margin: 10px 0; }
      .block-title { font-size: 14px; font-weight: 700; color: #f0c969; margin: 22px 0 4px; }
      .verdict { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 16px; border: 1px solid #26262c; background: #16161a; margin-bottom: 14px; }
      .verdict.green { border-color: rgba(95,208,138,.4); background: rgba(95,208,138,.08); }
      .verdict.gold { border-color: rgba(232,176,74,.4); background: rgba(232,176,74,.08); }
      .verdict.red { border-color: rgba(240,122,122,.45); background: rgba(240,122,122,.1); }
      .verdict-icon { font-size: 30px; line-height: 1; flex-shrink: 0; }
      .verdict-body { flex: 1; }
      .verdict-body strong { display: block; font-size: 17px; font-weight: 800; color: #f5f3ef; }
      .verdict-body p { font-size: 13px; color: #a3a09a; margin-top: 3px; }

      /* === Motor 24/7 — Fábrica de Conteúdo === */
      .cf { display: flex; flex-direction: column; gap: 12px; margin-top: 14px; }
      .cf-intro { background: rgba(212,162,60,0.06); border: 1px solid rgba(212,162,60,0.2); border-radius: 13px; padding: 13px 15px; }
      .cf-intro strong { display: block; color: #f0c969; font-size: 14px; margin-bottom: 4px; }
      .cf-intro span { color: #a09c94; font-size: 12.5px; line-height: 1.5; }
      .cf-form { display: grid; grid-template-columns: 1fr; gap: 8px; }
      .cf-form select, .cf-form input { background: #0f0f12; border: 1px solid #26262e; border-radius: 10px; padding: 11px 12px; color: #f6f4ef; font-size: 13px; font-family: inherit; }
      .cf-btn { background: linear-gradient(135deg,#d4a23c,#f0c969); color: #1a1206; font-weight: 800; border: none; border-radius: 10px; padding: 12px; cursor: pointer; font-family: inherit; font-size: 13.5px; }
      .cf-skills { font-size: 11.5px; color: #a09c94; }
      .cf-skills b { color: #f0c969; }
      .cf-msg { font-size: 12.5px; color: #5bbb5f; background: rgba(91,187,95,0.08); border-radius: 8px; padding: 8px 11px; }
      .cf-list { display: flex; flex-direction: column; gap: 9px; }
      .cf-empty { font-size: 12.5px; color: #a09c94; background: #141418; border: 1px dashed #26262e; border-radius: 11px; padding: 14px; }
      .cf-empty b { color: #f0c969; }
      .cf-item { background: #141418; border: 1px solid #26262e; border-radius: 12px; padding: 11px 13px; }
      .cf-item-top { display: flex; align-items: center; gap: 9px; }
      .cf-item-top strong { flex: 1; font-size: 13px; color: #f6f4ef; }
      .cf-tipo { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; color: #1a1206; background: #d4a23c; border-radius: 6px; padding: 3px 7px; }
      .cf-item-meta { font-size: 11px; color: #6c6962; margin: 6px 0 9px; }
      .cf-when { font-size: 11px; font-weight: 800; color: #f0c969; background: rgba(212,162,60,0.12); border-radius: 6px; padding: 3px 8px; }
      .cf-objective { font-size: 12.5px; color: #cfcabf; line-height: 1.5; margin: 8px 0 4px; }
      .cf-item-btns.one { grid-template-columns: 1fr; }
      .cf-item-btns.one button { background: linear-gradient(135deg,#d4a23c,#f0c969); color: #1a1206; border: none; font-weight: 800; }
      .cf-item-btns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
      .cf-item-btns button { background: #0f0f12; border: 1px solid #26262e; color: #f6f4ef; border-radius: 9px; padding: 8px 6px; font-size: 11.5px; font-weight: 700; cursor: pointer; font-family: inherit; }
      .cf-item-btns button:hover { border-color: #d4a23c; }
      @media (min-width: 720px) {
        .cf-form { grid-template-columns: 130px 1fr 150px 110px auto; align-items: center; }
      }

      /* === Comando 4 — Painel de Estratégia (gráficos didáticos) === */
      .strat { display: flex; flex-direction: column; gap: 14px; margin-top: 6px; }
      .strat-intro { display: flex; gap: 12px; background: rgba(212,162,60,0.06); border: 1px solid rgba(212,162,60,0.2); border-radius: 14px; padding: 14px 16px; }
      .strat-intro svg { flex-shrink: 0; color: #f0c969; }
      .strat-intro strong { display: block; color: #f0c969; font-size: 14px; margin-bottom: 4px; }
      .strat-intro span { color: #a09c94; font-size: 12.5px; line-height: 1.5; }
      .strat-intro b { color: #f6f4ef; }
      .strat-h { font-size: 15px; font-weight: 800; margin-top: 6px; }
      .strat-sub { color: #a09c94; font-size: 12.5px; }
      .strat-sub b { color: #f6f4ef; }
      .strat-plan { display: grid; grid-template-columns: 1fr; gap: 10px; }
      .strat-plan-card { background: #141418; border: 1px solid #26262e; border-radius: 13px; padding: 13px 15px; }
      .strat-ico { display: inline-flex; width: 30px; height: 30px; border-radius: 8px; background: rgba(212,162,60,0.12); color: #f0c969; align-items: center; justify-content: center; margin-bottom: 8px; }
      .strat-plan-card strong { display: block; font-size: 13.5px; margin-bottom: 4px; }
      .strat-plan-card p { color: #a09c94; font-size: 12.5px; line-height: 1.5; }
      .strat-funnel { display: flex; flex-direction: column; gap: 8px; background: #141418; border: 1px solid #26262e; border-radius: 14px; padding: 14px; }
      .strat-fn-row { display: grid; grid-template-columns: 110px 1fr 66px; align-items: center; gap: 8px; }
      .strat-fn-label { font-size: 11px; color: #a09c94; }
      .strat-fn-bar { background: #0f0f12; border-radius: 7px; overflow: hidden; height: 26px; }
      .strat-fn-bar span { display: flex; align-items: center; justify-content: flex-end; height: 100%; background: linear-gradient(90deg,#a06f1e,#d4a23c); border-radius: 7px; padding: 0 8px; min-width: 36px; transition: width .8s ease; }
      .strat-fn-bar span.lead { background: linear-gradient(90deg,#2e7d32,#5bbb5f); }
      .strat-fn-bar b { font-size: 11px; color: #1a1206; font-weight: 800; }
      .strat-fn-pct { font-size: 10.5px; color: #f0c969; font-weight: 700; text-align: right; }
      .strat-tip { background: rgba(255,255,255,0.03); border-left: 3px solid #d4a23c; border-radius: 0 8px 8px 0; padding: 9px 12px; color: #a09c94; font-size: 12px; line-height: 1.5; }
      .strat-tip b { color: #f6f4ef; }
      .strat-kpi { display: flex; flex-direction: column; gap: 8px; }
      .strat-kpi-row { display: grid; grid-template-columns: 1fr; gap: 4px; background: #141418; border: 1px solid #26262e; border-radius: 11px; padding: 11px 13px; }
      .strat-kpi-t { font-size: 12.5px; font-weight: 700; }
      .strat-kpi-good { font-size: 11.5px; color: #5bbb5f; }
      .strat-kpi-bad { font-size: 11.5px; color: #e57373; }
      .strat-goal { display: flex; flex-direction: column; gap: 9px; background: #141418; border: 1px solid #26262e; border-radius: 14px; padding: 14px; }
      .strat-goal-row { display: grid; grid-template-columns: 120px 1fr; align-items: center; gap: 10px; }
      .strat-goal-label { font-size: 11.5px; color: #a09c94; }
      .strat-goal-bar { background: #0f0f12; border-radius: 7px; overflow: hidden; height: 24px; }
      .strat-goal-bar span { display: flex; align-items: center; justify-content: flex-end; height: 100%; background: linear-gradient(90deg,#a06f1e,#d4a23c); border-radius: 7px; padding: 0 8px; color: #1a1206; font-weight: 800; font-size: 11px; min-width: 60px; transition: width .8s ease; }
      @media (min-width: 720px) {
        .strat-plan { grid-template-columns: repeat(2, 1fr); }
        .strat-kpi-row { grid-template-columns: 1.6fr 1fr 1fr; align-items: center; }
      }
    `}</style>
  );
}
