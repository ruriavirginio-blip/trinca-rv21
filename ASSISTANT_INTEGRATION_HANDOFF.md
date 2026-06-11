# ASSISTANT INTEGRATION HANDOFF - TRINCA RV21

Este arquivo existe para orientar qualquer assistente externo, Claude, Codex, Cursor ou outro agente tecnico que precise entender e integrar o projeto TRINCA RV21.

## Link do Repositorio

Repositorio GitHub:

`https://github.com/ruriavirginio-blip/trinca-rv21`

Remote SSH local:

`ssh://git@ssh.github.com:443/ruriavirginio-blip/trinca-rv21.git`

## Objetivo do Projeto

O TRINCA RV21 e um funil premium para captacao, venda e onboarding de mulheres em um desafio de 21 dias.

O sistema precisa conduzir a lead da landing ate:

1. cadastro;
2. checkout Kiwify;
3. compra aprovada;
4. WhatsApp pos-compra;
5. video de boas-vindas;
6. envio de dieta, ebooks e materiais;
7. video do grupo oficial;
8. link final do grupo oficial;
9. acompanhamento operacional no painel.

## Stack Tecnica

- Next.js 16
- React 19
- TypeScript
- Supabase
- Twilio WhatsApp
- Kiwify Webhook
- Meta Pixel
- Meta CAPI preparada
- GA4
- Vercel

## Arquivos e Diretorios Mais Importantes

Landing e paginas:

- `src/app/page.tsx`
- `src/app/bio/page.tsx`
- `src/app/obrigado/page.tsx`
- `src/app/operacao/page.tsx`
- `src/app/aluna/page.tsx`
- `src/app/aluna/[secao]/page.tsx`

APIs:

- `src/app/api/leads/route.ts`
- `src/app/api/kiwify/webhook/route.ts`
- `src/app/api/twilio/webhook/route.ts`
- `src/app/api/twilio/sync-inbound/route.ts`
- `src/app/api/twilio/configure-inbound/route.ts`
- `src/app/api/automation/run/route.ts`
- `src/app/api/automation/dispatch/route.ts`
- `src/app/api/automation/recover-leads/route.ts`
- `src/app/api/automation/dashboard/route.ts`
- `src/app/api/automation/readiness/route.ts`
- `src/app/api/automation/flow-test/route.ts`
- `src/app/api/automation/panel-simulation/route.ts`

Bibliotecas:

- `src/lib/whatsapp/twilio.ts`
- `src/lib/whatsapp/phone.ts`
- `src/lib/automation/readiness.ts`
- `src/lib/meta-pixel.ts`
- `src/lib/meta-capi.ts`
- `src/lib/google-analytics.ts`

Componentes globais:

- `src/components/MetaPixel.tsx`
- `src/components/GoogleAnalytics.tsx`

Conteudos:

- `public/media/01-boas-vindas-pos-compra.mp4`
- `public/media/02-recuperacao-abandono.mp4`
- `public/media/03-grupo-oficial.mp4`
- `public/materials/dieta-emagrecimento.pdf`
- `public/materials/dieta-gluteos-firmeza.pdf`
- `public/materials/dieta-autoestima.pdf`
- `public/materials/dieta-roupas-antigas.pdf`
- `public/materials/ebook-rv-trinca-rv21.pdf`
- `public/materials/ebook-nutricional-julia-macena.pdf`

## Fluxo WhatsApp Pos-Compra

A sequencia correta e:

1. `compra-confirmada`
   - mensagem apos pagamento aprovado;
   - botao: `Estou pronta`;
   - payload esperado: `compra_confirmada_estou_pronta`.

2. `clique-compra-confirmada-estou-pronta`
   - gate interno;
   - fica como `aguardando-clique`;
   - conclui quando a lead clica no botao correto.

3. `boas-vindas-video`
   - envia video pos-compra;
   - so pode sair depois do clique correto.

4. `materiais-desafio`
   - envia dieta por objetivo + Ebook RV + Ebook Nutricional;
   - delay apos video pos-compra.

5. `grupo-oficial-preparacao`
   - mensagem antes do grupo;
   - botao: `Assistir boas-vindas`;
   - payload esperado: `assistir_boas_vindas_grupo`.

6. `clique-grupo-assistir-boas-vindas`
   - gate interno;
   - fica como `aguardando-clique`;
   - conclui quando a lead clica no botao correto.

7. `grupo-oficial-final`
   - envia video de boas-vindas ao grupo.

8. `grupo-oficial-link`
   - envia link final do grupo oficial.

Regra critica:

- Nao enviar todas as mensagens de uma vez.
- Nao liberar grupo antes do segundo clique.
- Nao remover gates sem justificativa.
- Nao expor link do grupo antes do fluxo final.

## Objetivos da Lead

O formulario trabalha com 4 objetivos:

- `emagrecimento`: Emagrecer e reduzir medidas.
- `gluteos`: Melhorar gluteos e firmeza corporal.
- `autoestima`: Recuperar autoestima.
- `roupas`: Voltar a usar roupas antigas.

Cada objetivo possui dieta especifica.

## Variaveis de Ambiente Necessarias

Ver `.env.example`.

Principais grupos:

- Supabase;
- Kiwify;
- Twilio;
- videos e materiais;
- Meta Pixel/CAPI;
- GA4;
- automacao e cron.

Nunca solicitar ou publicar valores reais de:

- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_AUTH_TOKEN`
- `KIWIFY_WEBHOOK_SECRET`
- `AUTOMATION_API_SECRET`
- `CRON_SECRET`
- `META_CAPI_ACCESS_TOKEN`
- `.env.local`

## Tracking

Meta Pixel:

- componente: `src/components/MetaPixel.tsx`;
- biblioteca: `src/lib/meta-pixel.ts`;
- eventos: `PageView`, `ViewContent`, `Lead`, `InitiateCheckout`, `Purchase`, `FormStart`, `ScrollDepth`.

Meta CAPI:

- biblioteca: `src/lib/meta-capi.ts`;
- chamada no webhook Kiwify em compra aprovada;
- email e telefone hasheados com SHA256.

GA4:

- componente: `src/components/GoogleAnalytics.tsx`;
- biblioteca: `src/lib/google-analytics.ts`;
- eventos: `page_view`, `view_item`, `scroll_depth`, `form_start`, `generate_lead`, `begin_checkout`, `purchase`.

## Painel Operacional

Rota:

- `/operacao`

O painel depende de token e consulta:

- leads;
- eventos Kiwify;
- mensagens Twilio;
- cliques;
- erros;
- etapas pendentes;
- pagamentos confirmados ou nao;
- status do funil.

## Validacao Recomendada

Antes de qualquer alteracao critica:

```bash
npm run lint
npm run build
```

Para validar ambiente:

- `/api/automation/readiness`
- `/api/automation/flow-test`
- `/api/automation/panel-simulation`
- `/api/automation/run`

Use token seguro quando necessario.

## Principais Riscos

1. Quebrar ordem do fluxo Twilio.
2. Remover delay/gate e disparar mensagens em massa.
3. Expor secrets no codigo.
4. Modificar templates sem alinhar Content SID Twilio.
5. Alterar checkout/redirect sem preservar UTMs.
6. Confundir area Kiwify com fluxo principal WhatsApp.

## Regra de Ouro

Toda melhoria deve proteger estes pilares:

- captacao clara;
- rastreio correto;
- pagamento seguro;
- WhatsApp em ordem;
- grupo apenas no final;
- painel operacional fiel;
- experiencia premium para a lead.

