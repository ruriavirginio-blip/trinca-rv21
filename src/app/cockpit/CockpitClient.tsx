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

type TabKey = "hoje" | "jornada" | "alertas" | "leads" | "vendas" | "gastos" | "conteudo" | "comando" | "ia";
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

const DEPARTMENTS: Department[] = [
  {
    icon: <Wrench size={18} />, name: "TECH OPS", agent: "Agente 4 · Infraestrutura", status: "run",
    domain: "Pixel, CAPI, GA4, webhooks, WhatsApp, Supabase, deploy.",
    report: "Base sólida: Pixel, GA4 e token CAPI ativos em produção. Falta plugar o token no Cenário 2 do Make e validar o fluxo ponta a ponta. Caminho crítico.",
    skills: ["conversion-funnel-rv", "performance-metrics-rv"],
    conn: ["Vercel", "Supabase", "Meta CAPI", "Twilio"],
    check: [
      { s: "d", t: "Meta Pixel instalado e disparando" },
      { s: "d", t: "GA4 ativo em produção" },
      { s: "d", t: "Token CAPI gerado" },
      { s: "p", t: "Make.com Cenário 2 (Compra→CAPI)" },
      { s: "x", t: "Função SQL get_daily_report" },
      { s: "x", t: "Teste ponta-a-ponta completo" },
    ],
    cmd: "COMANDO TECH OPS: assuma a infraestrutura. Prioridade: (1) corrigir o Cenário 2 do Make.com (Compra→CAPI) com o token já gerado, (2) criar a função SQL get_daily_report no Supabase, (3) rodar teste ponta-a-ponta completo. Use conversion-funnel-rv e performance-metrics-rv. Reporte item por item.",
  },
  {
    icon: <Zap size={18} />, name: "CONVERSION ENGINE", agent: "Agente 2 · Funil & Automação", status: "run",
    domain: "Landing page, funil Kiwify→Supabase→Twilio, recuperação.",
    report: "Landing no ar, mas ainda fora do padrão alto exigido — falta auditoria de conversão (CRO), polish final e A/B de headline. Carrinho abandonado não existe ainda.",
    skills: ["conversion-funnel-rv", "trinca-page-cro", "objection-handling-rv"],
    conn: ["Make.com", "Kiwify", "Supabase", "Vercel"],
    check: [
      { s: "d", t: "Landing publicada (protocolorv.com.br)" },
      { s: "p", t: "Estrutura final da landing (padrão alto)" },
      { s: "p", t: "A/B test de headline + CTA" },
      { s: "x", t: "Fluxo de carrinho abandonado" },
    ],
    cmd: "COMANDO CONVERSION ENGINE: assuma o funil. Prioridade: (1) finalizar a landing no padrão premium com trinca-page-cro e trinca-final-polish, (2) A/B de headline e CTA, (3) fluxo de recuperação de carrinho. Use conversion-funnel-rv e objection-handling-rv.",
  },
  {
    icon: <Target size={18} />, name: "TRAFFIC HUNTER", agent: "Agente 1 · Aquisição", status: "wait",
    domain: "Meta Ads pago, orgânico, audiences, CPL, escala.",
    report: "Não iniciado. Nenhum anúncio rodando, gasto R$0. Aguarda o CAPI 100%. Frente mais atrasada e mais decisiva para a meta de 1.000 leads.",
    skills: ["audience-segmentation-rv", "performance-metrics-rv", "content-instagram-rv"],
    conn: ["Meta Ads", "Windsor.ai", "Motion"],
    check: [
      { s: "x", t: "Criar 3 anúncios teste (R$10/dia)" },
      { s: "x", t: "Definir 3 audiences/segmentos" },
      { s: "x", t: "Lookalike audience" },
      { s: "x", t: "Meta de CPL R$3-8" },
    ],
    cmd: "COMANDO TRAFFIC HUNTER: assuma a aquisição. Pré-requisito: CAPI funcionando. Prioridade: (1) 3 audiences de teste com audience-segmentation-rv, (2) 3 anúncios de teste (R$10/dia) com copy e criativo, (3) plano de escala dias 8-21. Puxe dados via Motion e Windsor.",
  },
  {
    icon: <Camera size={18} />, name: "CONTENT CREATOR", agent: "Agente 3 · Conteúdo IG", status: "wait",
    domain: "Posts, reels, stories, carrosséis, bio, calendário 21 dias.",
    report: "Bio não atualizada e criativos pendentes. O calendário e os roteiros vivem na aba Conteúdo. Conteúdo orgânico aquece a audiência antes do tráfego pago.",
    skills: ["content-instagram-rv", "brand-positioning-rv", "trinca-copywriting"],
    conn: ["Canva", "Adobe", "Instagram"],
    check: [
      { s: "p", t: "Calendário editorial (aba Conteúdo)" },
      { s: "x", t: "Bio Instagram atualizada" },
      { s: "x", t: "Criativos: carrossel/estático/reels" },
      { s: "p", t: "Roteiros de reels (aba Conteúdo)" },
    ],
    cmd: "COMANDO CONTENT CREATOR: assuma o conteúdo. Prioridade: (1) revisar o calendário e roteiros da aba Conteúdo, (2) reescrever a bio com trinca-copywriting, (3) gerar os 3 primeiros criativos com Canva/Adobe. Foco em captação de leads.",
  },
  {
    icon: <MessageCircle size={18} />, name: "SALES CLOSER", agent: "Agente 5 · Vendas & DMs", status: "ok",
    domain: "DMs, objeções, WhatsApp, emails de venda, fechamento.",
    report: "Pronto para ativar. Skills de objeção e copy prontas — basta o comando para gerar templates de WhatsApp e a sequência de email.",
    skills: ["objection-handling-rv", "brand-positioning-rv", "audience-segmentation-rv"],
    conn: ["Twilio", "Gmail", "Instagram"],
    check: [
      { s: "d", t: "Skills de objeção prontas" },
      { s: "p", t: "Templates WhatsApp de resposta" },
      { s: "p", t: "Sequência de email de venda" },
      { s: "x", t: "Scripts de upsell pós-desafio" },
    ],
    cmd: "COMANDO SALES CLOSER: assuma vendas. Prioridade: (1) templates de WhatsApp para as objeções comuns com objection-handling-rv, (2) sequência de email de venda, (3) script de upsell pós-desafio. Entregue pronto para colar.",
  },
  {
    icon: <BarChart3 size={18} />, name: "DATA ANALYST", agent: "Agente 6 · Métricas", status: "run",
    domain: "Relatório diário 07h, CPL/CAC/LTV/ROAS, gargalos, projeções.",
    report: "Depende da função SQL get_daily_report (Tech Ops). Conectores prontos. Quando os ads ligarem, manda relatório automático às 07h.",
    skills: ["performance-metrics-rv", "audience-segmentation-rv", "competitor-intelligence-rv"],
    conn: ["Windsor.ai", "GA4", "Supabase", "Perplexity"],
    check: [
      { s: "x", t: "Função get_daily_report (Tech Ops)" },
      { s: "p", t: "Dashboard de KPIs ao vivo (este cockpit)" },
      { s: "x", t: "Relatório diário 07:00 automático" },
      { s: "p", t: "Projeção até 1.000 leads" },
    ],
    cmd: "COMANDO DATA ANALYST: assuma métricas. Prioridade: (1) especificar get_daily_report e o relatório 07h, (2) projeção de cenários até 1.000 leads, (3) varredura de concorrentes via Perplexity + Semrush. Use performance-metrics-rv.",
  },
  {
    icon: <Wallet size={18} />, name: "FINANCE · CFO", agent: "Controle financeiro", status: "new",
    domain: "Assinaturas, gasto de tráfego, fluxo de caixa, ROI, alertas.",
    report: "Os números reais vivem na aba Gastos (Make, Twilio, Railway, Vercel...). Falta conectar gasto de Meta Ads ao vivo e definir o break-even pelo ticket de R$37,89.",
    skills: ["performance-metrics-rv", "launch-action-plan-rv"],
    conn: ["Windsor.ai", "Twilio", "Kiwify", "Vercel"],
    check: [
      { s: "d", t: "Gastos fixos mapeados (aba Gastos)" },
      { s: "x", t: "Gasto de Meta Ads ao vivo" },
      { s: "x", t: "Break-even pelo ticket R$37,89" },
      { s: "x", t: "Alertas de pagamento a vencer" },
    ],
    cmd: "COMANDO FINANCE CFO: assuma o financeiro. Prioridade: (1) revisar os gastos da aba Gastos, (2) conectar o gasto de Meta Ads ao vivo via Windsor, (3) calcular o break-even pelo ticket de R$37,89. Use performance-metrics-rv.",
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
  {
    id: "d1",
    day: "D1 · 23/06",
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
    day: "D2 · 24/06",
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
    day: "D3 · 25/06",
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
    day: "D4 · 26/06",
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
    day: "D5 · 27/06",
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
    day: "D6 · 28/06",
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
    day: "D7 · 29/06",
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
  {
    id: "d8",
    day: "D8 · 30/06",
    title: "Carrossel — As 3 mulheres que NÃO devem entrar",
    time: "08:10",
    format: "Carrossel (6 slides) + Stories",
    objective: "Qualificação reversa: filtrar lead frio e fazer a mulher certa se identificar e desejar entrar (90-100% de fit).",
    channel: "Feed (carrossel) + Stories",
    status: "RASCUNHO",
    script: [
      "Slide 1 (capa): 'O TRINCA RV21 NÃO é pra você se...' (fundo gold, tipografia forte)",
      "Slide 2: '...você quer resultado sem mudar NADA na rotina.'",
      "Slide 3: '...você desiste no primeiro dia que sai do plano.'",
      "Slide 4: '...você acha que 21 dias é pouco. (Spoiler: muda tudo.)'",
      "Slide 5: 'Mas se você é mulher real, ocupada, e SÓ precisa de direção — é exatamente pra você.'",
      "Slide 6 (CTA): 'Comenta EU SOU que eu te coloco na lista VIP.'",
      "Palavras-chave (algoritmo): emagrecer depois dos 30, protocolo feminino, rotina real, recomeçar",
      "Hashtags: #protocolorv #emagrecimentofeminino #desafio21dias #mulheresreais #vidasaudavel",
    ],
    roteiro: `[CARROSSEL — copy de cada slide acima. Direção visual: tons gold/preto da bio, fotos reais, tipografia editorial. Legenda do post abaixo:]
LEGENDA: "A maioria das mulheres NÃO deveria entrar no TRINCA RV21. 👇 Eu explico sem medo no carrossel. Se você se identificar com o último slide, comenta EU SOU — eu te mando o acesso da lista VIP antes de abrir pra todo mundo. Vagas da primeira turma são limitadas."`,
  },
  {
    id: "d9",
    day: "D9 · 01/07",
    title: "Reels — Prova social acumulada (+5.000)",
    time: "19:10",
    format: "Reels (depoimentos em sequência)",
    objective: "Empilhar prova social para quebrar a objeção 'será que funciona pra mim?' na reta do lançamento.",
    channel: "Reels + Stories",
    status: "RASCUNHO",
    script: [
      "Gancho: '5.000 mulheres. A mesma frase.'",
      "Corpo: cortes rápidos de prints/depoimentos com a frase 'achei que era tarde demais'.",
      "Virada: 'Não era tarde. Era método errado.'",
      "CTA: 'Comenta PRÓXIMA pra ser a história do mês que vem.'",
      "Melhor horário 19h (pico de mulher 25-44 no feed à noite). Palavras-chave: antes e depois, transformação real, autoestima",
    ],
    roteiro: `[00:00-00:03] CLOSE | "5.000 mulheres treinaram comigo em 14 anos. E quase todas me disseram a MESMA frase no começo."
[00:03-00:12] CORTES RÁPIDOS (prints/vídeos) | "'Ruriá, acho que é tarde demais pra mim.'" [repetir a frase em sobreposição]
[00:12-00:22] MEIO CORPO | "Não era tarde. Nunca foi. Era método feito pra todo mundo igual — e você não é todo mundo."
[00:22-00:30] CLOSE | "Semana que vem abre a primeira turma do TRINCA RV21. Comenta PRÓXIMA que eu te mando o acesso."
TEXTO NA TELA: [00:03] "+5.000 mulheres" | [00:14] "Não era tarde" | [00:25] "PRÓXIMA 👇"`,
  },
  {
    id: "d13",
    day: "D10 · 02/07 — 🚀 LANÇAMENTO",
    title: "ABERTURA OFICIAL — Reels + Stories + Bio + Link",
    time: "07:00",
    format: "Reels + Stories (dia todo) + Bio + Link",
    objective: "Converter toda a audiência aquecida em VENDA. Tráfego máximo pra landing. Foco total em vendas.",
    channel: "Reels + Stories + Bio + DM",
    status: "RASCUNHO",
    script: [
      "07h Reels de abertura: 'ABRIU. A primeira turma do TRINCA RV21 está no ar.'",
      "07h05 Stories: link na bio + caixinha + senso de urgência (vagas da turma).",
      "Ao longo do dia: 3-4 ondas de Stories com depoimento + contador de vagas + CTA.",
      "DM automática pra quem comentou QUERO/EU SOU nos dias anteriores (lista quente).",
      "20h Stories de fechamento: 'Últimas vagas da primeira turma.'",
      "CTA principal: 'Link na bio. Sua vaga te espera.'",
      "Palavras-chave: vagas limitadas, primeira turma, abriu, última chance",
    ],
    roteiro: `[00:00-00:04] CLOSE ENERGIA | "ABRIU. A primeira turma do TRINCA RV21 está oficialmente no ar."
[00:04-00:14] MEIO CORPO | "21 dias de treino, dieta e acompanhamento no seu WhatsApp pra você voltar a se reconhecer no espelho. Feito pra mulher real."
[00:14-00:24] CLOSE | "As vagas da primeira turma são limitadas — eu quero acompanhar de perto. Quem entrar hoje entra no preço de lançamento: R$37,89."
[00:24-00:32] CLOSE + APONTA | "Link na bio AGORA. Sua vaga te espera. Bora?"
TEXTO NA TELA: [00:00] "ABRIU 🚀" | [00:16] "vagas limitadas" | [00:26] "Link na bio 👇" (pulsando gold)`,
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
            description="Calendário da semana pré-lançamento com roteiro, aprovação e publicação."
            loading={contentQueueLoading}
          >
            <ContentFactoryPanel />
            <details className="legacy-notion">
              <summary>📚 Calendário/roteiros completos + sincronização Notion (avançado)</summary>
              <p className="legacy-note">
                A sincronização com o Notion ainda não está ligada (falta configurar as chaves NOTION_* no servidor).
                O roteiro completo já está disponível na Fábrica acima. Esta seção é só pra quando você quiser
                gerenciar pelo Notion.
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
  "DATA ANALYST": ["lanc"],
  "FINANCE · CFO": ["lanc"],
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
};
const CF_SKILLS_BY_TYPE: Record<string, string[]> = {
  story: ["ckm-banner-design", "trinca-marketing-psychology", "content-instagram-rv"],
  feed: ["ckm-design", "trinca-high-end-visual-design", "trinca-marketing-psychology", "trinca-copywriting"],
  carrossel: ["ckm-design", "frontend-design", "trinca-marketing-psychology", "trinca-copywriting"],
  reel: ["content-instagram-rv", "trinca-copywriting", "trinca-marketing-psychology"],
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

function ContentFactoryPanel() {
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

  return (
    <div className="cf">
      <div className="cf-intro">
        <strong>🏭 Fábrica de Conteúdo — Roteiro do Pré-lançamento</strong>
        <span>Cada dia já vem com o <b>propósito travado</b> (aquecer leads · qualificar · coletar métricas) pra criação nunca fugir do contexto. Aperte <b>⚡ Acionar criação</b> → o Claude cria com as skills certas → você aprova → o motor agenda/publica. (Publicação automática liga com as chaves do Instagram — docs/credenciais-pendentes.md.)</span>
      </div>
      {msg ? <p className="cf-msg">{msg}</p> : null}

      <div className="cf-list">
        {contentCalendar.map((c) => {
          const tipo = fmtToTipo(c.format);
          return (
            <div className="cf-item" key={c.id}>
              <div className="cf-item-top">
                <span className="cf-tipo">{tipo}</span>
                <strong>{c.day} · {c.title}</strong>
                <span className="cf-when">{c.time}</span>
              </div>
              <div className="cf-objective">🎯 {c.objective}</div>
              <div className="cf-item-meta">Skills: {(CF_SKILLS_BY_TYPE[tipo] || []).join(" · ")}</div>
              <div className="cf-item-btns one">
                <button onClick={() => void acionarDia(c)}>⚡ Acionar criação deste dia</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="cf-intro" style={{ marginTop: 14 }}>
        <strong>📥 Fila de produção</strong>
        <span>Pedidos já acionados — aprove ou rejeite o material que o Claude subir.</span>
      </div>
      <div className="cf-list">
        {loading ? (
          <p className="cf-empty">Carregando…</p>
        ) : items.length === 0 ? (
          <p className="cf-empty">Nenhum pedido na fila ainda. Acione um dia do roteiro acima.</p>
        ) : (
          items.map((it) => (
            <div className="cf-item" key={it.id}>
              <div className="cf-item-top">
                <span className="cf-tipo">{it.tipo}</span>
                <strong>{it.roteiro_ref ? `${it.roteiro_ref} · ` : ""}{it.tema || "—"}</strong>
                <span className={`cmd-status ${it.status === "publicado" || it.status === "aprovado" ? "ok" : it.status === "rejeitado" || it.status === "erro" ? "wait" : "run"}`}>
                  {CF_STATUS_LABEL[it.status] || it.status}
                </span>
              </div>
              <div className="cf-item-meta">{it.data_post || "sem data"} {it.hora_post || ""}</div>
              <div className="cf-item-btns">
                <button onClick={() => void patch(it.id, "aprovado")}>✅ Aprovar</button>
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
    { key: "setores", icon: <LayoutGrid size={22} />, label: "Setores", desc: "Os 7 times e o que falta em cada um", tone: "gold" },
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
