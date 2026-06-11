# Runbook de lancamento - TRINCA RV21

Este runbook fecha a etapa de automacao premium do TRINCA RV21. Ele deve ser usado antes do lancamento, durante os testes internos e no dia da abertura oficial.

## Objetivo operacional

Garantir que o funil funcione com controle real de ponta a ponta:

1. Captura de lead na landing.
2. Recuperacao de lead que nao gera evento Kiwify.
3. Recebimento de eventos Kiwify.
4. Cancelamento de recuperacoes quando compra e aprovada.
5. Sequencia pos-compra individual.
6. Gates de clique antes dos videos e do link do grupo.
7. Monitoramento rapido de erros, pendencias e gargalos.

## Arquivos de referencia

- `docs/supabase-twilio-interactions.sql`
- `docs/teste-fluxo-twilio-cliques.md`
- `docs/twilio-integracao.md`
- `docs/funil-trinca-rv21.md`
- `docs/whatsapp-api-templates.md`
- `CHECKPOINT_RETOMADA_TRINCA_RV21.md`

## 1. Supabase

Aplicar no Supabase:

```sql
-- arquivo: docs/supabase-twilio-interactions.sql
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

Verificacao:

```sql
select count(*) from public.twilio_interactions;
```

Resultado esperado: consulta responde sem erro.

## 2. Vercel

Configurar ou revisar as variaveis:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_KIWIFY_CHECKOUT_URL=
NEXT_PUBLIC_WHATSAPP_GROUP_URL=
KIWIFY_WEBHOOK_SECRET=
AUTOMATION_API_SECRET=
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WEBHOOK_SECRET=
TWILIO_WHATSAPP_FROM=
TWILIO_MESSAGING_SERVICE_SID=
TWILIO_BASE_URL=https://api.twilio.com
TWILIO_SEND_MODE=content
TWILIO_SEND_MEDIA=false
TWILIO_CONTENT_SID_RETOMADA_INSCRICAO=
TWILIO_CONTENT_SID_COMPRA_CONFIRMADA=HX08f4184e637809935c6e541a54ca1c0e
TWILIO_CONTENT_SID_BOAS_VINDAS_VIDEO=
TWILIO_CONTENT_SID_ORIENTACOES_INICIAIS=HX23f2de44593d23156c67e901e82cefd
TWILIO_CONTENT_SID_MATERIAIS_DESAFIO=HXb4b62a94f3e79006249d09ac5cbfcd6
TWILIO_CONTENT_SID_DIETA_EBOOKS=HXb2393b281d491d8a4fb7a22972aa9cdd
TWILIO_CONTENT_SID_GRUPO_OFICIAL_PREPARACAO=HX8c1bece081b38a41162656b314606cc3
TWILIO_CONTENT_SID_GRUPO_OFICIAL_FINAL=HX8c1bece081b38a41162656b314606cc3
TWILIO_CONTENT_SID_GRUPO_OFICIAL_LINK=
TRINCA_WELCOME_VIDEO_URL=
TRINCA_ABANDONMENT_VIDEO_URL=
TRINCA_GROUP_WELCOME_VIDEO_URL=
TRINCA_ORIENTATION_URL=
TRINCA_MATERIALS_URL=
TRINCA_DIET_URL=
TRINCA_EBOOK_RV_URL=
TRINCA_EBOOK_NUTRITION_URL=
```

Obrigatorio antes de lancar:

- `TWILIO_CONTENT_SID_BOAS_VINDAS_VIDEO` preenchido.
- `TWILIO_CONTENT_SID_GRUPO_OFICIAL_LINK` preenchido ou template final confirmado por fallback.
- URLs de videos e materiais em HTTPS publico.
- `TWILIO_WEBHOOK_SECRET` e `AUTOMATION_API_SECRET` fortes e diferentes.

## 3. Twilio

Configurar webhook inbound de mensagens recebidas:

```text
POST https://trinca-rv21.vercel.app/api/twilio/webhook?token=SEU_TWILIO_WEBHOOK_SECRET
```

Payloads que precisam chegar corretamente:

- `compra_confirmada_estou_pronta`
- `assistir_boas_vindas_grupo`

Se a Twilio enviar texto em vez de payload, a rota tambem aceita:

- `Estou pronta`
- `Assistir boas-vindas`

Teste de saude:

```bash
curl "https://trinca-rv21.vercel.app/api/twilio/webhook?token=SEU_TWILIO_WEBHOOK_SECRET"
```

Resultado esperado:

- `ok: true`
- `supabase_configured: true`
- `webhook_secret_configured: true`

## 4. Kiwify

Configurar webhook:

```text
POST https://trinca-rv21.vercel.app/api/kiwify/webhook?token=SEU_KIWIFY_WEBHOOK_SECRET
```

Eventos desejados:

- Compra aprovada.
- Compra recusada.
- Carrinho abandonado.
- Pix gerado.
- Boleto gerado.

Verificar no Supabase:

```sql
select evento, status, etapa_funil, email, order_id, recebido_em
from public.kiwify_events
order by recebido_em desc
limit 20;
```

## 5. Rotina de teste antes do lancamento

### 5.0 Teste automatizado controlado

Com o servidor local rodando, execute:

```bash
npm run test:flow
```

Se o ambiente local nao tiver secrets configurados, rode servidor e teste com tokens temporarios iguais:

```bash
AUTOMATION_API_SECRET=seu-token-local KIWIFY_WEBHOOK_SECRET=seu-token-local TWILIO_WEBHOOK_SECRET=seu-token-local npm run dev
AUTOMATION_API_SECRET=seu-token-local KIWIFY_WEBHOOK_SECRET=seu-token-local TWILIO_WEBHOOK_SECRET=seu-token-local npm run test:flow
```

Esse teste nao envia WhatsApp real. Ele valida recuperacao pre-Kiwify, fila pos-compra, gates de clique e liberacao do link final usando dados sinteticos que sao limpos ao final.

### 5.1 Saude do funil

```bash
curl "https://trinca-rv21.vercel.app/api/automation/health?token=SEU_AUTOMATION_API_SECRET"
```

Resultado esperado antes dos testes:

- `ok: true`
- `automation_error_total: 0`
- nenhum alerta critico inesperado em `warnings`

### 5.2 Recuperacao de lead sem evento Kiwify

Primeiro, dry-run:

```bash
curl -X POST "https://trinca-rv21.vercel.app/api/automation/recover-leads?token=SEU_AUTOMATION_API_SECRET&limit=25&min_age_minutes=5&dry_run=true"
```

Resultado esperado:

- `ok: true`
- `messages` mostra o que seria criado.
- nenhuma mensagem e criada quando `dry_run: true`.

Depois, execucao real se estiver correto:

```bash
curl -X POST "https://trinca-rv21.vercel.app/api/automation/recover-leads?token=SEU_AUTOMATION_API_SECRET&limit=25&min_age_minutes=5"
```

### 5.3 Dispatch de mensagens

Dry-run:

```bash
curl -X POST "https://trinca-rv21.vercel.app/api/automation/dispatch?token=SEU_AUTOMATION_API_SECRET&limit=10&dry_run=true"
```

Envio real:

```bash
curl -X POST "https://trinca-rv21.vercel.app/api/automation/dispatch?token=SEU_AUTOMATION_API_SECRET&limit=10"
```

## 6. Teste pos-compra completo

Seguir o roteiro:

```text
docs/teste-fluxo-twilio-cliques.md
```

Ordem obrigatoria:

1. `compra-confirmada`
2. `clique-compra-confirmada-estou-pronta`
3. `boas-vindas-video`
4. `orientacoes-iniciais`
5. `materiais-desafio`
6. `dieta-ebooks`
7. `grupo-oficial-preparacao`
8. `clique-grupo-assistir-boas-vindas`
9. `grupo-oficial-final`
10. `grupo-oficial-link`

Regra de aceite:

- O video pos-compra nao pode ser enviado antes do clique `Estou pronta`.
- O video do grupo nao pode ser enviado antes do clique `Assistir boas-vindas`.
- O link do grupo nao pode ser enviado antes do video do grupo.

## 7. Operacao no dia do lancamento

Antes de abrir:

1. Rodar `automation/health`.
2. Confirmar `automation_error_total: 0`.
3. Confirmar URLs finais de videos, materiais e grupo.
4. Confirmar templates aprovados e Content SIDs salvos.
5. Fazer uma compra interna.
6. Confirmar mensagens no WhatsApp.
7. Confirmar cliques registrados em `twilio_interactions`.

Durante o lancamento:

1. Rodar `automation/health` a cada bloco de vendas ou a cada pico de trafego.
2. Rodar `recover-leads` em dry-run antes de executar real.
3. Rodar `dispatch` em lotes pequenos se o volume estiver alto.
4. Monitorar `automation_error_total`.
5. Monitorar gates aguardando clique para saber se a experiencia esta fluindo.

Depois do lancamento:

1. Conferir leads capturadas.
2. Conferir compras aprovadas.
3. Conferir recuperacoes geradas.
4. Conferir mensagens com erro.
5. Conferir alunas que nao clicaram nos gates.
6. Ajustar copy, timing e templates com base nos gargalos reais.

## 8. Criterios de pronto para lancar

O funil tecnico esta pronto quando:

- Landing salva lead no Supabase.
- Kiwify envia evento e aparece em `kiwify_events`.
- Compra aprovada cria fila pos-compra completa.
- Recuperacao de lead sem evento Kiwify cria fila propria.
- Dispatch envia pela Twilio.
- Webhook Twilio registra cliques.
- Gates passam para `concluida`.
- Link do grupo so sai no fim.
- `automation/health` responde sem erros criticos.
- `npm run lint` passa.
- `npm run build` passa.

## 9. Bloqueios atuais para conclusao da automacao

- Confirmar/criar Content SID do video pos-compra.
- Confirmar/criar Content SID do link do grupo oficial.
- Confirmar URL HTTPS final do video pos-compra.
- Confirmar URL HTTPS final do video de pagamento abandonado.
- Confirmar URL HTTPS final do video de boas-vindas ao grupo.
- Confirmar URLs finais de orientacoes, materiais, dieta e ebooks.

Quando estes itens forem preenchidos, a automacao esta pronta para homologacao real.
