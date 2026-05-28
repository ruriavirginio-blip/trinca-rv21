create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  whatsapp text not null,
  objetivo text not null,
  origem text not null default 'landing-trinca-rv21',
  status text not null default 'novo-lead',
  etapa_funil text not null default 'captacao',
  utm text,
  capturado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists leads_email_idx on public.leads (email);
create index if not exists leads_whatsapp_idx on public.leads (whatsapp);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_etapa_funil_idx on public.leads (etapa_funil);

create table if not exists public.kiwify_events (
  id uuid primary key default gen_random_uuid(),
  email text,
  whatsapp text,
  nome text,
  evento text not null,
  status text not null,
  etapa_funil text not null,
  order_id text,
  order_status text,
  payment_method text,
  product_name text,
  payload jsonb not null,
  recebido_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists kiwify_events_email_idx on public.kiwify_events (email);
create index if not exists kiwify_events_order_id_idx on public.kiwify_events (order_id);
create index if not exists kiwify_events_evento_idx on public.kiwify_events (evento);
create index if not exists kiwify_events_status_idx on public.kiwify_events (status);
create index if not exists kiwify_events_recebido_em_idx on public.kiwify_events (recebido_em desc);

create table if not exists public.automation_messages (
  id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  email text,
  whatsapp text,
  nome text,
  order_id text,
  payment_method text,
  trigger_event text not null,
  etapa text not null,
  canal text not null default 'whatsapp',
  mensagem text not null,
  delay_minutos integer not null default 0,
  enviar_em timestamptz not null,
  status text not null default 'pendente',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists automation_messages_email_idx on public.automation_messages (email);
create index if not exists automation_messages_whatsapp_idx on public.automation_messages (whatsapp);
create index if not exists automation_messages_order_id_idx on public.automation_messages (order_id);
create index if not exists automation_messages_status_idx on public.automation_messages (status);
create index if not exists automation_messages_enviar_em_idx on public.automation_messages (enviar_em);
