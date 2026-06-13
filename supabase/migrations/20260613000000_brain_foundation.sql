-- TRINCA RV21 - Brain foundation
-- Fonte unica de verdade para metricas de Instagram, conteudo, ads e snapshots diarios.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.instagram_metrics (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'windsor',
  account_id text,
  account_name text,
  metric_date date not null,
  metric_hour timestamptz,
  followers_count integer,
  reach integer,
  impressions integer,
  profile_visits integer,
  bio_link_clicks integer,
  engagement_count integer,
  engagement_rate numeric(10, 4),
  website_clicks integer,
  raw_payload jsonb not null default '{}'::jsonb,
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists instagram_metrics_unique_period_idx
  on public.instagram_metrics (
    source,
    coalesce(account_id, ''),
    metric_date,
    coalesce(metric_hour, '1970-01-01 00:00:00+00'::timestamptz)
  );

create index if not exists instagram_metrics_metric_date_idx
  on public.instagram_metrics (metric_date desc);

create index if not exists instagram_metrics_collected_at_idx
  on public.instagram_metrics (collected_at desc);

drop trigger if exists set_instagram_metrics_updated_at on public.instagram_metrics;
create trigger set_instagram_metrics_updated_at
before update on public.instagram_metrics
for each row execute function public.set_updated_at();

alter table public.instagram_metrics enable row level security;

create table if not exists public.content_performance (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'windsor',
  platform text not null default 'instagram',
  account_id text,
  account_name text,
  content_id text,
  content_type text,
  content_title text,
  caption text,
  permalink text,
  published_at timestamptz,
  metric_date date not null,
  reach integer,
  impressions integer,
  likes integer,
  comments integer,
  shares integer,
  saves integer,
  video_views integer,
  profile_visits integer,
  bio_link_clicks integer,
  engagement_count integer,
  engagement_rate numeric(10, 4),
  leads_attributed integer not null default 0,
  purchases_attributed integer not null default 0,
  revenue_brl numeric(12, 2) not null default 0,
  raw_payload jsonb not null default '{}'::jsonb,
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists content_performance_unique_metric_idx
  on public.content_performance (
    source,
    platform,
    coalesce(account_id, ''),
    coalesce(content_id, ''),
    metric_date
  );

create index if not exists content_performance_metric_date_idx
  on public.content_performance (metric_date desc);

create index if not exists content_performance_content_type_idx
  on public.content_performance (content_type);

drop trigger if exists set_content_performance_updated_at on public.content_performance;
create trigger set_content_performance_updated_at
before update on public.content_performance
for each row execute function public.set_updated_at();

alter table public.content_performance enable row level security;

create table if not exists public.ads_metrics (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'windsor',
  platform text not null default 'meta_ads',
  account_id text,
  account_name text,
  campaign_id text,
  campaign_name text,
  adset_id text,
  adset_name text,
  ad_id text,
  ad_name text,
  metric_date date not null,
  spend_brl numeric(12, 2) not null default 0,
  impressions integer,
  reach integer,
  clicks integer,
  link_clicks integer,
  landing_page_views integer,
  leads integer not null default 0,
  purchases integer not null default 0,
  revenue_brl numeric(12, 2) not null default 0,
  ctr numeric(10, 4),
  cpc_brl numeric(12, 4),
  cpm_brl numeric(12, 4),
  cpl_brl numeric(12, 4),
  roas numeric(12, 4),
  raw_payload jsonb not null default '{}'::jsonb,
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists ads_metrics_unique_metric_idx
  on public.ads_metrics (
    source,
    platform,
    coalesce(account_id, ''),
    coalesce(campaign_id, ''),
    coalesce(adset_id, ''),
    coalesce(ad_id, ''),
    metric_date
  );

create index if not exists ads_metrics_metric_date_idx
  on public.ads_metrics (metric_date desc);

create index if not exists ads_metrics_campaign_idx
  on public.ads_metrics (campaign_id, metric_date desc);

drop trigger if exists set_ads_metrics_updated_at on public.ads_metrics;
create trigger set_ads_metrics_updated_at
before update on public.ads_metrics
for each row execute function public.set_updated_at();

alter table public.ads_metrics enable row level security;

create table if not exists public.daily_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null,
  scope text not null default 'trinca-rv21',
  leads_total integer not null default 0,
  leads_qualified integer not null default 0,
  checkout_started integer not null default 0,
  purchases integer not null default 0,
  revenue_brl numeric(12, 2) not null default 0,
  spend_brl numeric(12, 2) not null default 0,
  cpl_brl numeric(12, 4),
  cac_brl numeric(12, 4),
  roas numeric(12, 4),
  instagram_reach integer,
  instagram_profile_visits integer,
  instagram_bio_clicks integer,
  best_content_id text,
  best_content_summary text,
  alerts jsonb not null default '[]'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  generated_by text not null default 'system',
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists daily_snapshots_unique_scope_date_idx
  on public.daily_snapshots (scope, snapshot_date);

create index if not exists daily_snapshots_snapshot_date_idx
  on public.daily_snapshots (snapshot_date desc);

drop trigger if exists set_daily_snapshots_updated_at on public.daily_snapshots;
create trigger set_daily_snapshots_updated_at
before update on public.daily_snapshots
for each row execute function public.set_updated_at();

alter table public.daily_snapshots enable row level security;
