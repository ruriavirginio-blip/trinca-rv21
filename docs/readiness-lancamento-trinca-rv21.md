# Readiness de lancamento - TRINCA RV21

Esta checagem valida se o ambiente esta pronto para um teste completo e para lancamento com Twilio, Kiwify, Supabase e conteudos oficiais.

## Endpoint

```text
GET /api/automation/readiness?token=SEU_TOKEN
```

O token aceito e o mesmo usado nas rotas de automacao:

- `AUTOMATION_API_SECRET`
- ou `KIWIFY_WEBHOOK_SECRET`, como fallback

## O que a rota valida

### Base tecnica

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTOMATION_API_SECRET`
- `KIWIFY_WEBHOOK_SECRET`

### Checkout e grupo

- `NEXT_PUBLIC_KIWIFY_CHECKOUT_URL`
- `NEXT_PUBLIC_WHATSAPP_GROUP_URL`

### Twilio WhatsApp

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WEBHOOK_SECRET`
- `TWILIO_WHATSAPP_FROM` ou `TWILIO_MESSAGING_SERVICE_SID`

Observacao: o sistema aceita `TWILIO_WHATSAPP_FROM` ou `TWILIO_MESSAGING_SERVICE_SID`, mas pelo menos um dos dois precisa estar configurado para envio real.

### Templates Twilio

- `TWILIO_CONTENT_SID_COMPRA_CONFIRMADA`
- `TWILIO_CONTENT_SID_BOAS_VINDAS_VIDEO`
- `TWILIO_CONTENT_SID_ORIENTACOES_INICIAIS`
- `TWILIO_CONTENT_SID_MATERIAIS_DESAFIO`
- `TWILIO_CONTENT_SID_DIETA_EBOOKS`
- `TWILIO_CONTENT_SID_GRUPO_OFICIAL_PREPARACAO`
- `TWILIO_CONTENT_SID_GRUPO_OFICIAL_FINAL`
- `TWILIO_CONTENT_SID_GRUPO_OFICIAL_LINK`

### Conteudo premium

- `TRINCA_WELCOME_VIDEO_URL`
- `TRINCA_ABANDONMENT_VIDEO_URL`
- `TRINCA_GROUP_WELCOME_VIDEO_URL`
- `TRINCA_ORIENTATION_URL`
- `TRINCA_MATERIALS_URL`
- `TRINCA_DIET_URL`
- `TRINCA_EBOOK_RV_URL`
- `TRINCA_EBOOK_NUTRITION_URL`

## Criterio de pronto

`launch_ready` so sera `true` quando nao houver nenhum bloqueio.

Bloqueios comuns:

- variavel ausente;
- link ainda como placeholder;
- URL sem HTTPS publico;
- Content SID de template ainda nao preenchido.

## Uso no dia do teste completo

1. Subir o ambiente local ou validar a URL da Vercel.
2. Rodar:

```text
GET /api/automation/readiness?token=SEU_TOKEN
```

3. Corrigir todos os itens em `blockers`.
4. Rodar:

```text
GET /api/automation/health?token=SEU_TOKEN
```

5. Rodar o teste automatizado controlado:

```bash
npm run test:flow
```

6. Fazer um teste real com lead interno somente depois que `launch_ready` estiver `true`.
