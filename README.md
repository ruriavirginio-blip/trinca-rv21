# TRINCA RV21

Landing, funil operacional e automacao WhatsApp do projeto TRINCA RV21.

## Visao Geral

O TRINCA RV21 e um desafio feminino de 21 dias com:

- landing page principal em Next.js;
- pagina de bio para Instagram;
- checkout Kiwify;
- captura de leads em Supabase;
- fluxo WhatsApp via Twilio;
- painel operacional em `/operacao`;
- Meta Pixel, Meta CAPI preparada e Google Analytics 4;
- videos, dietas e ebooks hospedados em `public/`.

## Stack

- Next.js 16
- React 19
- TypeScript
- Supabase
- Twilio WhatsApp
- Kiwify Webhooks
- Vercel

## Rotas Principais

- `/`: landing principal.
- `/bio`: pagina para link da bio/Instagram.
- `/obrigado`: pagina pos-compra informativa.
- `/aluna`: central estrutural da aluna.
- `/operacao`: painel operacional protegido por token.

## APIs Principais

- `/api/leads`: captura e atualiza leads.
- `/api/kiwify/webhook`: recebe eventos da Kiwify.
- `/api/twilio/webhook`: recebe cliques/respostas do WhatsApp Twilio.
- `/api/twilio/sync-inbound`: sincroniza mensagens inbound do Twilio.
- `/api/automation/run`: executa sincronizacao, recuperacao e disparos.
- `/api/automation/dispatch`: dispara mensagens pendentes.
- `/api/automation/dashboard`: alimenta o painel operacional.
- `/api/automation/readiness`: diagnostico de ambiente.

## Fluxo Pos-Compra

1. Kiwify confirma pagamento aprovado.
2. Sistema cria fila pos-compra no Supabase.
3. Lead recebe mensagem de confirmacao com botao `Estou pronta`.
4. Clique libera video pos-compra.
5. Depois sao enviados materiais, dieta por objetivo, Ebook RV e Ebook Nutricional.
6. Lead recebe mensagem de preparacao para grupo com botao `Assistir boas-vindas`.
7. Clique libera video do grupo.
8. Depois e enviado o link final do grupo oficial.

## Variaveis de Ambiente

Copie `.env.example` e preencha os valores reais no ambiente local/Vercel.

Nunca publique `.env.local`.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Documentacao para Assistentes

Antes de alterar o projeto, leia:

- `ASSISTANT_INTEGRATION_HANDOFF.md`
- `CHECKPOINT_RETOMADA_TRINCA_RV21.md`
- `AUDITORIA_TECNICA_COMPLETA_TRINCA_RV21.md`
- `RELATORIO_IMPLEMENTACAO_META_PIXEL_TRINCA_RV21.md`
- `RELATORIO_IMPLEMENTACAO_GA4_TRINCA_RV21.md`

