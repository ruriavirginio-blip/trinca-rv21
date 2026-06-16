create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.content_queue (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  status text not null default 'aguardando_aprovacao',
  source text not null default 'make_video_pipeline',
  video_url text,
  cloudinary_public_id text,
  remotion_render_url text,
  drive_file_id text,
  briefing jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_queue_status_idx
  on public.content_queue (status);

create index if not exists content_queue_created_at_idx
  on public.content_queue (created_at desc);

drop trigger if exists set_content_queue_updated_at on public.content_queue;

create trigger set_content_queue_updated_at
before update on public.content_queue
for each row
execute function public.set_updated_at();

alter table public.content_queue enable row level security;
