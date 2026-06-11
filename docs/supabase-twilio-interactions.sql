create table if not exists public.twilio_interactions (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'twilio',
  from_whatsapp text,
  message_sid text,
  button_payload text,
  button_text text,
  raw_payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists twilio_interactions_from_whatsapp_idx
  on public.twilio_interactions (from_whatsapp);

create index if not exists twilio_interactions_button_payload_idx
  on public.twilio_interactions (button_payload);

create index if not exists twilio_interactions_received_at_idx
  on public.twilio_interactions (received_at desc);
