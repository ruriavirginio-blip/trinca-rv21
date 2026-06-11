# CHECKPOINT DE RETOMADA - TRINCA RV21

Atualizado em: 2026-06-02

Este arquivo existe para reduzir dependencia do historico gigante da conversa e permitir retomadas rapidas, sem perder contexto estrategico ou tecnico.

## Estado atual do projeto

O projeto TRINCA RV21 esta em fase de estruturacao final do fluxo de automacao via WhatsApp, com Twilio escolhido como provedor principal.

O objetivo central e manter um fluxo premium, seguro e sincronizado para conversao de leads, compra confirmada, recuperacao de pagamento e entrada no Grupo Oficial.

## Provedor escolhido

- Provedor atual: Twilio WhatsApp
- Provedores descartados: 360dialog e Z-API
- Motivo da escolha: uso remoto via WhatsApp Business Platform, sem depender de WhatsApp fisico logado no celular para disparos automatizados.

## Sender Twilio

- Nome de exibicao: TRINCA RV21
- Numero do projeto: +55 84 9925-7144
- Status visto na Twilio: Online
- WhatsApp Business Account ID: 1283163093983938
- Meta Business Manager ID: 178572176187682

## Templates Twilio ja criados ou identificados

### Compra confirmada

- Nome: trinca_rv21_compra_confirmada
- Content SID principal: HX08f4184e637809935c6e541a54ca1c0e
- Tipo: Quick Reply
- Botao: Estou pronta
- Button ID: compra_confirmada_estou_pronta
- Observacao: existe duplicidade antiga com SID HX18e25553ab8ec9a07cd7e1953d44f293. Preferir o SID principal.

Mensagem atual:

```text
Sua inscricao no TRINCA RV21 foi confirmada com sucesso pela equipe RV.

Para continuar, toque no botao abaixo e receba o video de boas-vindas.
```

### Orientacoes iniciais

- Nome: trinca_rv21_orientacoes_iniciais
- Content SID: HX23f2de44593d23156c67e901e82cefd
- Tipo: Text

### Materiais do desafio

- Nome: trinca_rv21_materiais_desafio
- Content SID: HXb4b62a94f3e79006249d09ac5cbfcd6
- Tipo: Text

### Dieta e treino

- Nome: trinca_rv21_dieta_treino
- Content SID: HXb2393b281d491d8a4fb7a22972aa9cdd
- Tipo: Text

### Video de boas-vindas ao grupo oficial

- Nome: trinca_rv21_video_grupo_oficial
- Content SID: HX8c1bece081b38a41162656b314606cc3
- Tipo: Quick Reply
- Botao sugerido: Assistir boas-vindas
- Button ID sugerido: assistir_boas_vindas_grupo

Mensagem sugerida:

```text
Parabens por chegar ate aqui.

Agora voce ja recebeu os materiais principais que vao te acompanhar durante todo o processo do TRINCA RV21.

E uma alegria enorme ter voce conosco neste momento tao importante.

Antes de entrar no Grupo Oficial, preparei um video de boas-vindas para te receber com carinho e te orientar sobre os proximos passos.

Quando estiver pronta, toque no botao abaixo.
```

### Link do grupo oficial

- Nome sugerido: trinca_rv21_link_grupo_oficial
- Tipo sugerido: Call to action ou Text com link
- Status: precisa confirmar/criar template final
- Link atual do grupo: https://chat.whatsapp.com/GFgMskDS6DfK5Ujf29N4PE?mode=gi_t

Mensagem sugerida:

```text
Sua entrada no Grupo Oficial TRINCA RV21 esta pronta.

Esse sera o nosso canal de avisos, orientacoes e comunicados importantes durante o desafio.

Toque no botao abaixo para entrar no grupo e concluir sua entrada no ambiente oficial.
```

## Videos obrigatorios do fluxo

1. Video de boas-vindas pos compra confirmada
   - Enviado individualmente no WhatsApp.
   - Deve ser disparado somente depois da mensagem de compra confirmada e do clique em "Estou pronta".

2. Video de pagamento abandonado
   - Enviado individualmente no WhatsApp.
   - Usado nos fluxos de pagamento recusado, pendente ou carrinho abandonado.

3. Video de boas-vindas ao Grupo Oficial TRINCA RV21
   - Enviado individualmente no WhatsApp.
   - Deve ser disparado antes do link do grupo.
   - O link do grupo deve ser enviado somente depois desse video.

## Fluxo correto aprovado

1. Lead entra na landing page.
2. Lead preenche formulario.
3. Dados sao salvos no Supabase.
4. Lead vai para checkout Kiwify.
5. Kiwify envia evento para o webhook do projeto.
6. Se pagamento estiver pendente, recusado ou abandonado:
   - entrar no fluxo de recuperacao;
   - enviar mensagem de recuperacao;
   - enviar video de pagamento abandonado;
   - seguir com lembretes planejados.
7. Se compra for aprovada:
   - enviar mensagem de compra confirmada;
   - esperar clique em "Estou pronta";
   - enviar video de boas-vindas pos compra;
   - enviar orientacoes iniciais;
   - enviar materiais do desafio;
   - enviar dieta e treino;
   - enviar mensagem preparando a entrada no grupo oficial;
   - esperar clique em "Assistir boas-vindas";
   - enviar video de boas-vindas ao grupo oficial;
   - enviar link do grupo oficial;
   - registrar conclusao da entrada no fluxo.

## Ponto tecnico critico

O fluxo ja possui uma rota para receber respostas/cliques da Twilio e liberar as proximas etapas por confirmacao real da lead.

Rota implementada:

```text
/api/twilio/webhook
```

Essa rota deve:

- receber eventos da Twilio;
- identificar clique em botoes;
- reconhecer Button ID ou payload equivalente;
- marcar gates internos como `concluida`;
- liberar a proxima etapa correta da fila via `required_previous_steps`;
- registrar interacoes no Supabase na tabela `twilio_interactions`.

Button payloads atualmente mapeados:

- `compra_confirmada_estou_pronta` -> conclui `clique-compra-confirmada-estou-pronta`;
- `assistir_boas_vindas_grupo` -> conclui `clique-grupo-assistir-boas-vindas`.

## Ajustes tecnicos recomendados antes da producao

1. Criar rota inbound da Twilio. Feito.
2. Separar etapa "compra-confirmada" da etapa "boas-vindas-video". Feito.
3. Garantir que o video pos compra so seja enviado depois do clique "Estou pronta". Feito.
4. Garantir que o video do grupo so seja enviado depois do clique "Assistir boas-vindas". Feito.
5. Garantir que o link do grupo so seja enviado depois do video do grupo. Feito.
6. Confirmar URLs publicas HTTPS dos videos e materiais.
7. Mapear todos os Content SIDs no ambiente da Vercel.
8. Aplicar schema `twilio_interactions` no Supabase.
9. Configurar webhook inbound na Twilio.
10. Rodar teste completo com lead interno.

## Arquivos importantes

- docs/funil-trinca-rv21.md
- docs/twilio-integracao.md
- docs/runbook-lancamento-trinca-rv21.md
- docs/supabase-twilio-interactions.sql
- docs/teste-fluxo-twilio-cliques.md
- docs/whatsapp-api-templates.md
- docs/roteiros-videos-trinca-rv21.md
- src/app/api/kiwify/webhook/route.ts
- src/app/api/automation/dispatch/route.ts
- src/app/api/automation/health/route.ts
- src/app/api/automation/recover-leads/route.ts
- src/app/api/twilio/webhook/route.ts
- src/lib/whatsapp/twilio.ts
- .env.example

## Como retomar rapidamente em uma nova conversa

Use esta mensagem:

```text
Quero retomar o projeto TRINCA RV21. Leia primeiro o arquivo CHECKPOINT_RETOMADA_TRINCA_RV21.md na raiz do projeto e continue exatamente do ponto tecnico atual: ajustar o fluxo Twilio para depender dos cliques corretos antes de enviar videos, materiais e link do grupo.
```

## Recuperacao de lead sem evento Kiwify

Foi criada a rota:

```text
POST /api/automation/recover-leads
```

Objetivo:

- localizar leads capturadas pela landing sem evento Kiwify;
- considerar leads em `novo-lead`, `lead-capturado` ou `checkout-iniciado`;
- evitar duplicidade se ja houver `kiwify_events`;
- evitar duplicidade se a recuperacao ja estiver na fila;
- enfileirar mensagens em 5 minutos, 2 horas e 24 horas;
- usar trigger `lead_sem_evento_kiwify`.

## Rastreio de origem, UTM e deduplicacao de lead

A landing agora monta um pacote de rastreio antes de enviar o lead:

- URL completa da landing;
- query string original;
- parametros `utm_*`, `fbclid`, `gclid`, `ttclid`, `src`, `source` e `ref`;
- referrer;
- user agent;
- timezone;
- checkout_url final usado no redirecionamento.

O checkout Kiwify recebe os parametros atuais da URL para manter atribuicao de campanha.

A rota `/api/leads` atualiza lead existente por e-mail ou WhatsApp antes de criar um novo registro, reduzindo duplicidade.

Quando o webhook Kiwify atualiza um lead existente, ele preserva o rastreio inicial da landing dentro de `landing_tracking`.

Teste sem criar fila:

```text
POST /api/automation/recover-leads?token=SEU_TOKEN&limit=25&min_age_minutes=5&dry_run=true
```

## Saude operacional

Foi criada a rota:

```text
GET /api/automation/health?token=SEU_TOKEN
```

Ela retorna contadores de leads, eventos Kiwify, interacoes Twilio, mensagens pendentes, erros, gates aguardando clique e recuperacoes pendentes.

## Readiness de lancamento

Foi criada a rota:

```text
GET /api/automation/readiness?token=SEU_TOKEN
```

Ela valida se o ambiente esta pronto para teste completo e lancamento:

- base Supabase/Kiwify/automacao;
- checkout Kiwify e link do grupo;
- credenciais Twilio;
- Content SIDs dos templates;
- URLs HTTPS de videos, materiais, dieta, treino e ebooks.

Tambem foi integrado um resumo no endpoint:

```text
GET /api/automation/health?token=SEU_TOKEN
```

Arquivo de apoio:

```text
docs/readiness-lancamento-trinca-rv21.md
```

## Painel operacional

Foi criada a tela:

```text
/operacao
```

Ela permite acompanhar o funcionamento do fluxo sem abrir o Supabase manualmente.

API protegida:

```text
GET /api/automation/dashboard?token=SEU_TOKEN&limit=120
```

O painel mostra:

- total de leads;
- leads das ultimas 24 horas;
- leads com pagamento confirmado;
- leads sem pagamento confirmado;
- leads que precisam de atencao;
- eventos Kiwify;
- mensagens da automacao;
- gates aguardando clique;
- links do grupo enviados;
- readiness de lancamento;
- origem por canal;
- situacao de pagamento por lead;
- leitura de possivel abandono ou travamento no fluxo;
- regua visual da jornada da landing ate o link do grupo;
- linha do tempo de cada lead;
- status humano de cada mensagem Twilio: aguardando disparo, enviada, aguardando clique, confirmada ou erro;
- ultimo clique Twilio registrado.

Tambem gera links rastreados para Instagram Story, Direct e Feed.

Arquivo de apoio:

```text
docs/painel-operacional-trinca-rv21.md
```

## Link da bio e dominio

Foi criada a pagina:

```text
/bio
```

Ela funciona como link oficial da bio do Instagram e direciona para:

- landing com rastreio `utm_source=instagram&utm_medium=bio`;
- WhatsApp da equipe RV;
- landing explicativa/rastreada para direct.

Arquivo de apoio:

```text
docs/dominio-instagram-trafego-trinca-rv21.md
```

Recomendacao atual: usar subdominio na Vercel primeiro, preservando o WordPress ate validar landing, painel, Kiwify, Twilio e rastreio.

## Runbook de lancamento

Foi criado o arquivo:

```text
docs/runbook-lancamento-trinca-rv21.md
```

Ele fecha a etapa de automacao com checklist de Supabase, Vercel, Twilio, Kiwify, dry-runs, teste pos-compra completo, rotina do dia do lancamento, criterios de aceite e bloqueios atuais.

## Bloco landing premium

Inicio do refinamento da landing apos fechamento da automacao:

- Jornada atualizada para nao sugerir entrada imediata no grupo.
- Nova secao "Experiencia premium por dentro" criada na landing.
- Copy reforca que os videos, materiais e grupo seguem ordem protegida.
- Formulario e FAQ ajustados para explicar que o link do grupo chega somente depois da sequencia individual.
- Nova secao "Decisao com clareza" criada para explicitar para quem o desafio faz sentido e quais limites precisam estar claros.
- Nota de responsabilidade adicionada na prova social de resultados reais.
- Hero refinado com trilha curta de entrada: inscricao segura, boas-vindas individual e grupo no fim da sequencia.
- Oferta refinada com bloco "O que acontece depois que voce entra".
- `npm run lint` e `npm run build` aprovados apos as mudancas.

## Teste ponta a ponta controlado

Foi criado o harness:

```text
scripts/test-full-flow.mjs
```

Comando:

```text
npm run test:flow
```

Resultado em 2026-06-02:

- Recuperacao pre-Kiwify aprovada: lead `checkout-iniciado` sem evento Kiwify enfileira 3 mensagens.
- Compra aprovada sintetica cria a fila pos-compra completa.
- Video pos-compra fica bloqueado ate clique `Estou pronta`.
- Video do grupo fica bloqueado ate clique `Assistir boas-vindas`.
- Link do grupo fica bloqueado ate o video do grupo.
- Dados sinteticos sao limpos ao final do teste.

Observacao: para rodar localmente quando `.env.local` nao tiver secrets de webhook, subir o servidor e o teste com secrets temporarios iguais:

```text
AUTOMATION_API_SECRET=seu-token-local KIWIFY_WEBHOOK_SECRET=seu-token-local TWILIO_WEBHOOK_SECRET=seu-token-local npm run dev
AUTOMATION_API_SECRET=seu-token-local KIWIFY_WEBHOOK_SECRET=seu-token-local TWILIO_WEBHOOK_SECRET=seu-token-local npm run test:flow
```

## Central da aluna

Foi criada uma central base para os destinos enviados no WhatsApp:

```text
/aluna
/aluna/orientacoes
/aluna/materiais
/aluna/dieta-treino
```

Objetivo:

- receber futuramente videos, materiais, treino, dieta e ebooks finais;
- permitir que o fluxo Twilio ja tenha URLs reais de destino;
- manter a ordem da experiencia sem liberar o grupo antes da sequencia individual.

Variaveis sugeridas:

```text
TRINCA_ORIENTATION_URL=https://seu-dominio.com/aluna/orientacoes
TRINCA_MATERIALS_URL=https://seu-dominio.com/aluna/materiais
TRINCA_DIET_URL=https://seu-dominio.com/aluna/dieta-treino
```

## Proximo passo imediato

Executar o runbook `docs/runbook-lancamento-trinca-rv21.md` quando as credenciais, URLs finais e Content SIDs faltantes estiverem preenchidos.

Itens ainda pendentes para homologacao real:

- Content SID do video pos-compra.
- Content SID do link do grupo oficial.
- URLs HTTPS finais dos videos e materiais.
- Aplicacao do SQL `docs/supabase-twilio-interactions.sql` no Supabase.
- Webhook inbound da Twilio configurado para:

```text
POST https://trinca-rv21.vercel.app/api/twilio/webhook?token=SEU_TWILIO_WEBHOOK_SECRET
```

Depois disso, rodar o teste interno completo descrito em `docs/teste-fluxo-twilio-cliques.md`.
