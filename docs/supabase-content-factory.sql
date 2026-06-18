-- ============================================================
-- TRINCA RV21 — Motor 24/7 de Conteúdo
-- Fila de criação + métricas de pré-aquecimento
-- Rodar no Supabase (projeto xdmwxixporrhofwagvyf) via SQL Editor.
-- ============================================================

-- 1) FILA DE CRIAÇÃO DE CONTEÚDO ------------------------------
create table if not exists public.content_factory (
  id            uuid primary key default gen_random_uuid(),
  -- o que criar
  tipo          text not null check (tipo in ('story','feed','carrossel','reel')),
  tema          text,                       -- assunto/ângulo do post
  roteiro_ref   text,                       -- referência ao item do calendário (D1..D13)
  legenda       text,                       -- legenda final
  -- quais skills o especialista mandou usar nessa criação
  skills        text[] default '{}',
  -- agendamento
  data_post     date,
  hora_post     time,
  -- mídia
  asset_url     text,                       -- arquivo gerado (imagem/vídeo)
  video_bruto_url text,                     -- p/ reels: vídeo cru enviado pelo Ruriá
  -- ciclo de vida
  status        text not null default 'solicitado'
                check (status in ('solicitado','criando','em_aprovacao',
                                  'aprovado','agendado','publicado','rejeitado','erro')),
  feedback      text,                       -- ajustes pedidos pelo Ruriá
  -- publicação
  instagram_media_id text,                  -- id retornado pelo Graph após publicar
  publicado_em  timestamptz,
  erro_msg      text,
  -- auditoria
  criado_em     timestamptz default now(),
  atualizado_em timestamptz default now()
);

create index if not exists idx_cf_status   on public.content_factory(status);
create index if not exists idx_cf_data_post on public.content_factory(data_post, hora_post);

alter table public.content_factory enable row level security;
-- sem policies = só service role (servidor) acessa. Cockpit lê via API com service role.

-- 2) MÉTRICAS DE PRÉ-AQUECIMENTO (por post) -------------------
create table if not exists public.content_metrics (
  id              uuid primary key default gen_random_uuid(),
  content_id      uuid references public.content_factory(id) on delete set null,
  instagram_media_id text,
  tipo            text,                     -- story/feed/carrossel/reel
  data_post       date,
  hora_post       time,
  -- desempenho (preenchido pelo motor via Instagram Insights / GA4 / Windsor)
  alcance         int default 0,
  impressoes      int default 0,
  curtidas        int default 0,
  comentarios     int default 0,
  salvamentos     int default 0,
  compartilhamentos int default 0,
  cliques_link    int default 0,            -- cliques no link da bio atribuídos
  leads_gerados   int default 0,            -- leads com UTM desse post
  -- persona dominante atingida (do Insights)
  persona_faixa_idade text,                 -- ex: "25-34"
  persona_genero  text,                     -- ex: "feminino 92%"
  persona_top_cidade text,
  -- onde veio a interação
  interacao_canal text,                     -- "comentario" | "dm" | "misto"
  engajamento_taxa numeric,                 -- (interações / alcance) * 100
  coletado_em     timestamptz default now()
);

create index if not exists idx_cm_tipo on public.content_metrics(tipo);
create index if not exists idx_cm_data on public.content_metrics(data_post);

alter table public.content_metrics enable row level security;

-- 3) VIEW DE APRENDIZADO (o que mais converteu) --------------
create or replace view public.content_learning as
select
  tipo,
  count(*)                          as posts,
  coalesce(sum(leads_gerados),0)    as leads_total,
  round(avg(nullif(engajamento_taxa,0)),2) as engajamento_medio,
  coalesce(sum(cliques_link),0)     as cliques_total,
  -- melhor horário médio por tipo
  to_char(avg(hora_post::time)::time,'HH24:MI') as horario_medio
from public.content_metrics
group by tipo
order by leads_total desc;

-- Pronto. O cockpit lê content_factory (fila) e content_learning (aprendizado).
