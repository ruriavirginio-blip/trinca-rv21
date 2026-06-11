# Aplicar tabela de cliques Twilio no Supabase

Esta etapa cria a tabela que guarda os cliques das leads nos botoes do WhatsApp.

Sem essa tabela, o fluxo principal ainda pode funcionar, mas o painel nao consegue mostrar com clareza:

- quem clicou em `Estou pronta`;
- quem clicou em `Assistir boas-vindas`;
- horario exato do clique;
- historico de interacoes vindas da Twilio.

## Como aplicar

1. Abrir o Supabase do projeto.
2. Entrar em `SQL Editor`.
3. Criar uma nova query.
4. Colar o SQL abaixo.
5. Clicar em `Run`.

```sql
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
```

## Como confirmar

Depois de aplicar, abrir:

```text
https://trinca-rv21.vercel.app/api/automation/health?token=SEU_TOKEN
```

O retorno deve mostrar:

```json
"twilio_interactions_available": true
```

## Por que isso importa

Essa tabela e essencial para o painel operacional acompanhar o comportamento real da lead dentro do WhatsApp.

Ela transforma os cliques da Twilio em dados visiveis para operacao.
