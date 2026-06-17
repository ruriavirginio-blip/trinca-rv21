# TRINCA RV21 — Recon Técnico Para Claude Code

Data do recon: 2026-06-16  
Repo: `/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21`

## 1. Raiz Do Repo

`pwd`:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21
```

`git status`:

```bash
## main
On branch main
nothing to commit, working tree clean
```

`git remote -v`:

```bash
origin	ssh://git@ssh.github.com:443/ruriavirginio-blip/trinca-rv21.git (fetch)
origin	ssh://git@ssh.github.com:443/ruriavirginio-blip/trinca-rv21.git (push)
```

Observação: o recon foi feito sem implementação, sem commit e sem push. A branch atual ainda é `main`.

## 2. Árvore Do Projeto

Comando executado com `.next` excluído para evitar listar build gerado:

```bash
find . -type f -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.next/*' | head -100
```

Arquivos principais:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/page.tsx
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/cockpit/page.tsx
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/cockpit/CockpitClient.tsx
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/operacao/page.tsx
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/api/leads/route.ts
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/api/kiwify/webhook/route.ts
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/api/automation/dashboard/route.ts
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/lib/whatsapp/twilio.ts
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/lib/meta-capi.ts
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/components/MetaPixel.tsx
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/components/GoogleAnalytics.tsx
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/docs/supabase-leads.sql
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/.env.local
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/.env.example
```

## 3. Stack

Projeto Next.js com:

```json
{
  "next": "16.2.6",
  "react": "19.2.4",
  "react-dom": "19.2.4",
  "typescript": "^5",
  "tailwindcss": "^4",
  "@supabase/supabase-js": "^2.106.2",
  "framer-motion": "^12.40.0",
  "lucide-react": "^1.16.0",
  "@anthropic-ai/sdk": "^0.104.1",
  "remotion": "^4.0.477"
}
```

Scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "remotion": "remotion studio",
  "render": "remotion render",
  "test:flow": "node scripts/test-full-flow.mjs"
}
```

## 4. Build E Lint

`npm run build`:

```bash
✓ Compiled successfully in 2.9s
✓ Generating static pages using 7 workers (36/36)
```

Rotas relevantes:

```bash
○ /
○ /bio
○ /cockpit
○ /operacao
ƒ /api/leads
ƒ /api/kiwify/webhook
ƒ /api/automation/dashboard
```

`npm run lint`:

```bash
✖ 7 problems (0 errors, 7 warnings)
```

Warnings:

```bash
src/app/page.tsx: unused vars/functions: includedItems, painCards, methodItems, VideoProofCard, playingVideo, setPlayingVideo
src/components/PhotoMarquee.tsx: warning for raw <img>
```

## 5. Env

Arquivos encontrados:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/.env.example
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/.env.local
```

Chaves em `.env.local`:

```bash
ANTHROPIC_API_KEY
ANTHROPIC_MODEL
AUTOMATION_WEBHOOK_URL
KIWIFY_WEBHOOK_SECRET
MAKE_WEBHOOK_COMPRA_APROVADA
META_CAPI_ACCESS_TOKEN
NEXT_PUBLIC_GA4_MEASUREMENT_ID
NEXT_PUBLIC_KIWIFY_CHECKOUT_URL
NEXT_PUBLIC_META_PIXEL_ID
NEXT_PUBLIC_WHATSAPP_GROUP_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_URL
```

Chaves importantes presentes em `.env.example`, mas ausentes em `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
COCKPIT_PASSWORD
AUTOMATION_API_SECRET
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_*
NOTION_*
```

Nenhum valor/segredo foi exposto neste recon.

## 6. Integrações

### Meta Pixel

Arquivo:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/components/MetaPixel.tsx
```

Status:

- Usa `NEXT_PUBLIC_META_PIXEL_ID`.
- Injeta script Meta Pixel.
- Dispara `PageView` com `eventID`.

Referências:

```ts
const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
```

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/layout.tsx
```

```tsx
<MetaPixel />
```

### GA4

Arquivo:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/components/GoogleAnalytics.tsx
```

Status:

- Usa `NEXT_PUBLIC_GA4_MEASUREMENT_ID`.
- Injeta `gtag`.
- Dispara `page_view` por rota.

Referência:

```ts
const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
```

### Meta CAPI

Arquivo:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/lib/meta-capi.ts
```

Status:

- Usa `NEXT_PUBLIC_META_PIXEL_ID`.
- Usa `META_CAPI_ACCESS_TOKEN`.
- Envia evento server-side para Graph API.

Referência:

```ts
export async function sendServerEvent(eventName, userData, customData)
```

Compra aprovada dispara CAPI em:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/api/kiwify/webhook/route.ts
```

```ts
if (status === "compra-aprovada") {
  metaCapiEvent = await sendServerEvent("Purchase", ...)
}
```

### `/api/leads`

Arquivo:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/api/leads/route.ts
```

Status:

- Handler `POST` existe.
- Grava/atualiza Supabase na tabela `leads`.
- Faz lookup por `email`, depois por `whatsapp`.
- Usa coluna `utm` única para guardar rastreamento serializado.
- Não referencia `utm_source`, `utm_medium`, `utm_campaign` como colunas.

Colunas usadas no payload:

```ts
nome
email
whatsapp
objetivo
origem
status
etapa_funil
utm
capturado_em
```

Query de lookup:

```ts
supabase.from("leads").select("id")
```

### `/api/kiwify/webhook`

Arquivo:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/api/kiwify/webhook/route.ts
```

Status:

- Handler `POST` existe.
- Verifica `KIWIFY_WEBHOOK_SECRET` se configurado.
- Normaliza cliente, produto, tracking, status e etapa do funil.
- Encaminha evento para automação.
- Insere histórico em `kiwify_events`.
- Atualiza ou cria lead em `leads`.
- Envia `Purchase` para Meta CAPI em compra aprovada.
- Faz dispatch imediato de mensagens pós-compra quando aplicável.

Fluxo resumido:

```ts
readWebhookToken(...)
normalizeFunnel(...)
forwardToAutomation(...)
supabase.from("kiwify_events").insert(...)
supabase.from("leads").select("id,utm,objetivo")
supabase.from("leads").update(...) ou insert(...)
sendServerEvent("Purchase", ...)
dispatchImmediateDueMessages(...)
```

### Link Kiwify No Front

Arquivo:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/page.tsx
```

Status:

- Front usa variável pública `NEXT_PUBLIC_KIWIFY_CHECKOUT_URL`.
- Fallback é WhatsApp.
- Não está `SEU-LINK-AQUI` no front.

Referência:

```ts
const CHECKOUT_URL = process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL || WHATSAPP_URL;
```

Observação:

- `.env.example` ainda contém placeholder:

```bash
NEXT_PUBLIC_KIWIFY_CHECKOUT_URL=https://pay.kiwify.com.br/seu-checkout
```

### Twilio

Arquivo principal:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/lib/whatsapp/twilio.ts
```

Status:

- Integração Twilio existe.
- Suporta envio por `ContentSid` ou texto.
- Suporta media quando `TWILIO_SEND_MEDIA=true`.
- Usa `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_BASE_URL`, `TWILIO_WHATSAPP_FROM`, `TWILIO_MESSAGING_SERVICE_SID`, `TWILIO_SEND_MODE`, `TWILIO_SEND_MEDIA`.

Dispatcher:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/api/automation/dispatch/route.ts
```

Status:

- Busca `automation_messages` pendentes.
- Autoriza por `AUTOMATION_API_SECRET` ou `KIWIFY_WEBHOOK_SECRET`.
- Envia WhatsApp via `sendTwilioMessage`.
- Atualiza status para `enviada` ou `erro`.

## 7. Schema Leads / UTM

Schema documentado:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/docs/supabase-leads.sql
```

Tabela `leads` documentada:

```sql
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  whatsapp text not null,
  objetivo text not null,
  origem text not null default 'landing-trinca-rv21',
  status text not null default 'novo-lead',
  etapa_funil text not null default 'captacao',
  utm text,
  capturado_em timestamptz not null default now(),
  created_at timestamptz not null default now()
);
```

Checagem real contra Supabase usando `.env.local`, sem expor segredos:

```bash
SUPABASE_CHECK existing columns: OK
SUPABASE_CHECK utm_source/utm_medium/utm_campaign: OK
```

Conclusão:

- O erro antigo `column leads.utm_source does not exist` não aparece mais nos handlers principais.
- As queries atuais de `/api/leads`, `/api/kiwify/webhook`, `/api/automation/dashboard` e `/cockpit` não selecionam `leads.utm_source`.
- Existem referências a `utm_source`, `utm_medium`, `utm_campaign` em docs, payloads de simulação e parsing de JSON, mas não como colunas em queries atuais da tabela `leads`.

## 8. Cockpit E Operação

### `/cockpit`

Arquivos:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/cockpit/page.tsx
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/cockpit/CockpitClient.tsx
```

Auth/login:

```ts
process.env.COCKPIT_PASSWORD || "rv21"
```

O client carrega dados direto do Supabase com anon key:

```ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL_PUBLIC;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
```

Erro exato provável após login, porque `.env.local` não possui `NEXT_PUBLIC_SUPABASE_URL` nem `NEXT_PUBLIC_SUPABASE_ANON_KEY`:

```bash
Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
```

Query atual de leads no cockpit:

```ts
.from("leads")
.select("id,nome,email,whatsapp,objetivo,origem,status,utm,capturado_em,created_at")
```

Não seleciona `utm_source`.

### `/operacao`

Arquivo:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/operacao/page.tsx
```

Auth/login:

- Não usa senha de cockpit.
- Pede token operacional no painel.
- Salva token em `sessionStorage`.

Token storage:

```ts
const tokenStorageKey = "trinca-rv21-operacao-token";
```

Chamada principal:

```ts
fetch(`/api/automation/dashboard?token=${encodeURIComponent(cleanToken)}&limit=120`)
```

Se token vazio:

```bash
Informe o token da automação para abrir o painel.
```

Endpoint:

```bash
/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21/src/app/api/automation/dashboard/route.ts
```

Auth do endpoint:

```ts
process.env.AUTOMATION_API_SECRET || process.env.KIWIFY_WEBHOOK_SECRET
```

Se secret não existe:

```bash
AUTOMATION_API_SECRET ainda nao configurado.
```

Se token inválido:

```bash
Token invalido.
```

Query atual do dashboard:

```ts
.from("leads")
.select("id,nome,email,whatsapp,objetivo,origem,status,etapa_funil,utm,capturado_em,created_at")
```

Não seleciona `utm_source`.

## 9. Protocolo Para Próximas Ordens

Antes de qualquer implementação:

```bash
git checkout -b fix/handoff-claude-code
```

Regras operacionais:

1. Não editar produção direto.
2. Não fazer push/deploy sem aprovação do Claude Code.
3. Mostrar `git diff` antes de aprovação de merge.
4. Rodar `npm run build` e `npm run lint` antes de declarar pronto.
5. Nunca expor segredos.
6. Trabalhar em incrementos pequenos e reversíveis.
7. Um item por vez.

## 10. Estado Final Do Recon

```bash
RECON COMPLETO — aguardando ordens do Claude Code
```
