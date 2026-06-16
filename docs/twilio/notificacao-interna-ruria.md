# Template Twilio — notificacao_interna_ruria

Objetivo: enviar apenas notificações internas para o número pessoal do Ruriá:

```text
+5584999390488
```

Este template não faz parte do fluxo operacional das leads.

## Template

Nome:

```text
notificacao_interna_ruria
```

Categoria sugerida:

```text
UTILITY
```

Idioma:

```text
pt_BR
```

Corpo:

```text
{{1}}
```

A variável `{{1}}` recebe a mensagem consolidada completa, por exemplo:

```text
🎬 *TRINCA RV21 — Ação necessária*

Seu vídeo está pronto e aguarda aprovação.

👉 Acesse o Cockpit, aba Conteúdo:
protocolorv.com.br/cockpit
```

## Variáveis Vercel

Depois que a Twilio aprovar o template, copiar o Content SID e preencher:

```env
TWILIO_TEMPLATE_NAME_NOTIFICACAO_INTERNA_RURIA=notificacao_interna_ruria
TWILIO_CONTENT_SID_NOTIFICACAO_INTERNA_RURIA=HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Também precisam existir:

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
TWILIO_MESSAGING_SERVICE_SID=
TWILIO_SEND_MODE=content
```

## Gatilhos implementados

1. Vídeo pronto no Cockpit:
   - via `POST /api/internal-notifications`
   - `trigger=video_ready`

2. Nova venda confirmada:
   - disparado automaticamente em `/api/kiwify/webhook`
   - dedupe por `order_id` ou e-mail

3. Marco de leads:
   - disparado automaticamente em `/api/leads`
   - apenas quando uma lead nova faz o total acumulado chegar em múltiplo de 10

4. Alerta crítico:
   - via `POST /api/internal-notifications`
   - `trigger=critical_alert`

## Teste manual

```bash
curl -X POST https://protocolorv.com.br/api/internal-notifications \
  -H "Authorization: Bearer SEU_AUTOMATION_API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "trigger": "critical_alert",
    "description": "Teste de notificação interna do TRINCA RV21",
    "dedupeKey": "teste-notificacao-interna-001"
  }'
```
