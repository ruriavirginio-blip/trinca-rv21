create extension if not exists pgcrypto;

create table if not exists public.comment_leads (
  id uuid default gen_random_uuid() primary key,
  instagram_user_id text unique not null,
  gatilho_ativado text,
  media_id text,
  dm_enviada boolean default false,
  persona text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_comment_leads_gatilho
  on public.comment_leads (gatilho_ativado);

create index if not exists idx_comment_leads_created
  on public.comment_leads (created_at);

alter table public.comment_leads enable row level security;
