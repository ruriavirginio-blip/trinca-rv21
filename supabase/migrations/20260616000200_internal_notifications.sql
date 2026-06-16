create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.internal_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  dedupe_key text not null unique,
  recipient_whatsapp text not null,
  message text not null,
  status text not null default 'pending',
  provider text not null default 'twilio',
  provider_response jsonb,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists internal_notifications_type_idx
  on public.internal_notifications (type);

create index if not exists internal_notifications_status_idx
  on public.internal_notifications (status);

drop trigger if exists set_internal_notifications_updated_at on public.internal_notifications;

create trigger set_internal_notifications_updated_at
before update on public.internal_notifications
for each row
execute function public.set_updated_at();

alter table public.internal_notifications enable row level security;
