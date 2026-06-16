# Guia Make.com D1 — importar blueprints TRINCA RV21

Arquivos:

- `docs/make/blueprints/scenario-1-lead-meta-capi-gmail.json`
- `docs/make/blueprints/scenario-2-kiwify-purchase-capi-sheets-gmail.json`
- `docs/make/blueprints/scenario-3-daily-report-gmail.json`
- `docs/make/blueprints/cenario4-pipeline-video.json`

## Passo 1 — importar o JSON

1. Abra o Make.com.
2. Entre em `Scenarios`.
3. Clique em `Create a new scenario`.
4. Menu de três pontos no canto inferior.
5. Clique em `Import Blueprint`.
6. Selecione o arquivo JSON correspondente.
7. Salve, conecte credenciais e rode `Run once`.

## Cenário 1 — Lead nova → CAPI Lead

Blueprint: `scenario-1-lead-meta-capi-gmail.json`

Mapa:

```text
[1] Custom Webhook
        ↓
[2] HTTP Meta CAPI Lead
        ↓
[3] HTTP protocolorv.com.br/api/leads
```

Configuração visual dos módulos:

```text
┌─────────────────────────────────────────────┐
│ [1] Custom Webhook                          │
├─────────────────────────────────────────────┤
│ Nome: TRINCA RV21 Lead Webhook              │
│ Saída esperada: nome, email, whatsapp,      │
│ objetivo, origem, utm, checkoutUrl          │
└─────────────────────────────────────────────┘
```

```text
┌─────────────────────────────────────────────┐
│ [2] HTTP - Meta CAPI Lead                   │
├─────────────────────────────────────────────┤
│ URL: https://graph.facebook.com/v20.0/      │
│      __META_PIXEL_ID__/events               │
│ Query: access_token=__META_CAPI_ACCESS_TOKEN│
│ Method: POST                                │
│ Header: Content-Type: application/json      │
│ Event: Lead                                 │
└─────────────────────────────────────────────┘
```

```text
┌─────────────────────────────────────────────┐
│ [3] HTTP - Registrar lead                   │
├─────────────────────────────────────────────┤
│ URL: https://protocolorv.com.br/api/leads   │
│ Method: POST                                │
│ Header: Content-Type: application/json      │
│ Body: nome, email, whatsapp, objetivo, utm  │
└─────────────────────────────────────────────┘
```

Variáveis:

- `META_PIXEL_ID`
- `META_CAPI_ACCESS_TOKEN`

## Cenário 2 — Compra aprovada → CAPI Purchase + Supabase

Blueprint: `scenario-2-kiwify-purchase-capi-sheets-gmail.json`

Mapa:

```text
[1] Custom Webhook Kiwify
        ↓
[2] HTTP /api/kiwify/webhook
        ↓
[3] Google Sheets opcional
        ↓
[4] Gmail opcional
```

Configuração visual:

```text
┌─────────────────────────────────────────────┐
│ [1] Custom Webhook                          │
├─────────────────────────────────────────────┤
│ Usar a URL gerada pelo Make na Kiwify       │
│ Evento esperado: compra aprovada            │
└─────────────────────────────────────────────┘
```

```text
┌─────────────────────────────────────────────┐
│ [2] HTTP - Webhook oficial TRINCA           │
├─────────────────────────────────────────────┤
│ URL: https://protocolorv.com.br/api/        │
│      kiwify/webhook?token=__TOKEN__         │
│ Method: POST                                │
│ Body: payload completo da Kiwify            │
│ Resultado: Supabase + CAPI Purchase         │
└─────────────────────────────────────────────┘
```

Variáveis:

- `KIWIFY_WEBHOOK_TOKEN`
- `GOOGLE_SHEETS_CONNECTION_ID` se usar Sheets
- `SPREADSHEET_ID` se usar Sheets
- `SHEET_NAME` se usar Sheets
- `GMAIL_CONNECTION_ID` se usar Gmail
- `NOTIFICATION_EMAIL` se usar Gmail

## Cenário 3 — Relatório diário 07h

Blueprint: `scenario-3-daily-report-gmail.json`

Mapa:

```text
[1] Scheduler 07h America/Fortaleza
        ↓
[2] HTTP /api/automation/dashboard
        ↓
[3] Gmail relatório diário
```

Configuração visual:

```text
┌─────────────────────────────────────────────┐
│ [1] Scheduler                               │
├─────────────────────────────────────────────┤
│ Tipo: Daily                                 │
│ Hora: 07:00                                 │
│ Timezone: America/Fortaleza                 │
└─────────────────────────────────────────────┘
```

```text
┌─────────────────────────────────────────────┐
│ [2] HTTP - Dashboard                        │
├─────────────────────────────────────────────┤
│ URL: https://protocolorv.com.br/api/        │
│      automation/dashboard?limit=250         │
│ Method: GET                                 │
│ Header: Authorization: Bearer __SECRET__    │
└─────────────────────────────────────────────┘
```

Variáveis:

- `AUTOMATION_API_SECRET`
- `GMAIL_CONNECTION_ID`
- `NOTIFICATION_EMAIL`

## Cenário 4 — Pipeline vídeo automático

Blueprint: `cenario4-pipeline-video.json`

Mapa:

```text
[1] Google Drive Watch Files: reels/brutos/
        ↓
[2] Google Drive Download File
        ↓
[3] Cloudinary Upload: reels-trinca/reels/brutos/
        ↓
[4] Railway Remotion Worker /render
        ↓
[5] Supabase REST insert content_queue
        ↓
[6] Telegram Bot notifica Ruriá
```

Configuração visual:

```text
┌─────────────────────────────────────────────┐
│ [1] Google Drive - Watch Files              │
├─────────────────────────────────────────────┤
│ Connection: Google Drive Ruriá              │
│ Folder: reels/brutos/                       │
│ Limit: 1                                    │
└─────────────────────────────────────────────┘
```

```text
┌─────────────────────────────────────────────┐
│ [3] Cloudinary Upload                       │
├─────────────────────────────────────────────┤
│ URL: /v1_1/__CLOUD_NAME__/video/upload      │
│ folder: reels-trinca/reels/brutos           │
│ upload_preset: __CLOUDINARY_UPLOAD_PRESET__ │
└─────────────────────────────────────────────┘
```

```text
┌─────────────────────────────────────────────┐
│ [4] Remotion Worker                         │
├─────────────────────────────────────────────┤
│ URL: __REMOTION_WORKER_URL__/render         │
│ Body: videoUrl, publicId, gancho, gatilho,  │
│       legenda, durationSeconds              │
└─────────────────────────────────────────────┘
```

```text
┌─────────────────────────────────────────────┐
│ [5] Supabase REST                           │
├─────────────────────────────────────────────┤
│ URL: __SUPABASE_URL__/rest/v1/content_queue │
│ Headers: apikey + Authorization Bearer      │
│ status: aguardando_aprovacao                │
└─────────────────────────────────────────────┘
```

```text
┌─────────────────────────────────────────────┐
│ [6] Telegram Bot                            │
├─────────────────────────────────────────────┤
│ Token: __TELEGRAM_BOT_TOKEN__               │
│ Chat ID: __TELEGRAM_CHAT_ID__               │
│ Mensagem: 🎬 [titulo] pronto no Cockpit     │
└─────────────────────────────────────────────┘
```

Variáveis:

- `GOOGLE_DRIVE_CONNECTION_ID`
- `DRIVE_REELS_BRUTOS_FOLDER_ID`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_UPLOAD_PRESET`
- `REMOTION_WORKER_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`

## Teste final

1. Rode cada cenário com `Run once`.
2. Envie um payload pequeno de teste.
3. Confirme `content_queue.status = aguardando_aprovacao`.
4. Abra `/cockpit`.
5. Confirme badge vermelho na aba Conteúdo.
6. Confirme mensagem Telegram.
