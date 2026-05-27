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
