# Funil TRINCA RV21

## Recomendacao de stack

- Banco de leads: Supabase.
- Checkout: Kiwify.
- Automacao: fila propria em Supabase, com envio por Twilio como provedor WhatsApp Business API.
- Landing: Next.js, com rota propria para capturar leads antes do envio ao WhatsApp.

## Etapas do lead

1. `captacao`: lead preenche o formulario da landing.
2. `whatsapp`: lead e direcionada para o WhatsApp oficial do desafio.
3. `aquecimento`: lead recebe conteudos, provas e chamadas para compra.
4. `checkout`: lead clica para a pagina de pagamento Kiwify.
5. `comprou`: pagamento aprovado na Kiwify.
6. `boas-vindas`: aluna recebe a sequencia individual de boas-vindas pelo WhatsApp.
7. `grupo`: aluna recebe, no fim da sequencia individual, a mensagem final de boas-vindas ao Grupo Oficial TRINCA RV21.
8. `pos-desafio`: aluna recebe oferta da Plataforma RV ONLINE.

## Eventos futuros

- `lead_created`: disparado quando a landing salva um novo lead.
- `checkout_started`: disparado quando a lead clica no link da Kiwify.

## Rastreio de origem e campanha

A landing preserva parametros de campanha no momento da captura e tambem os repassa para o checkout Kiwify.

O campo `utm` da tabela `leads` guarda um JSON serializado com:

- URL da landing acessada;
- query string original;
- parametros `utm_*`, `fbclid`, `gclid`, `ttclid`, `src`, `source` e `ref`;
- pagina de origem/referrer;
- user agent e timezone;
- checkout_url usado no redirecionamento.

Quando a Kiwify envia o webhook, o sistema atualiza o lead e preserva o rastreio inicial em `landing_tracking`, dentro do novo pacote `utm` vinculado ao evento Kiwify.

Se a mesma pessoa reenviar o formulario com o mesmo e-mail ou WhatsApp, a API atualiza o lead existente em vez de criar duplicidade.
- `purchase_approved`: recebido via webhook da Kiwify e marcado como `comprou`.
- `payment_pending`: recebido via webhook quando Pix ou boleto forem gerados.
- `cart_abandoned`: recebido via webhook da Kiwify e marcado para recuperacao.
- `purchase_refused`: recebido via webhook da Kiwify para recuperacao.
- `group_joined`: atualizado manualmente ou por automacao.

## Webhook da Kiwify

URL de producao:

- `https://trinca-rv21.vercel.app/api/kiwify/webhook`

Eventos recomendados:

- `Compra aprovada`
- `Compra recusada`
- `Carrinho abandonado`
- `Pix gerado`
- `Boleto gerado`

O token gerado pela Kiwify deve ser salvo como `KIWIFY_WEBHOOK_SECRET` no ambiente da Vercel. Enquanto a variavel estiver vazia, a rota recebe os eventos sem bloquear por token, o que ajuda nos primeiros testes.

## Variaveis preparadas

Variavel preparada na landing:

- `NEXT_PUBLIC_KIWIFY_CHECKOUT_URL`: link publico do checkout Kiwify.
- `NEXT_PUBLIC_WHATSAPP_GROUP_URL`: link do grupo oficial enviado no pos-compra.
- `KIWIFY_WEBHOOK_SECRET`: token do webhook criado na Kiwify.
- `AUTOMATION_API_SECRET`: token para Make/n8n buscar mensagens pendentes e atualizar status.
- `AUTOMATION_WEBHOOK_URL`: URL futura do Make, n8n ou plataforma oficial de WhatsApp.
- `WHATSAPP_PROVIDER`: provedor de envio. Valor atual: `twilio`.
- `TWILIO_ACCOUNT_SID`: Account SID da Twilio.
- `TWILIO_AUTH_TOKEN`: Auth Token da Twilio.
- `TWILIO_WHATSAPP_FROM`: numero WhatsApp remetente aprovado na Twilio.
- `TWILIO_MESSAGING_SERVICE_SID`: alternativa ao numero remetente, se usarmos Messaging Service.
- `TWILIO_SEND_MODE`: `content` em producao com templates aprovados ou `text` para testes controlados.
- `TWILIO_SEND_MEDIA`: `true` para enviar `asset_url` como midia quando permitido.

## Ponte com Make/n8n

URL para buscar mensagens prontas para envio:

- `GET https://trinca-rv21.vercel.app/api/automation/messages?token=SEU_TOKEN&limit=10`

Resposta esperada:

- `messages`: lista de mensagens com `id`, `nome`, `whatsapp`, `email`, `mensagem`, `etapa`, `enviar_em`, `whatsapp_digits`, `whatsapp_link`, `whatsapp_template_name`, `whatsapp_template_language`, `whatsapp_template_body_variables` e `whatsapp_template_buttons`.

Depois que o Make/n8n enviar a mensagem, marcar como enviada:

- `POST https://trinca-rv21.vercel.app/api/automation/messages?token=SEU_TOKEN`

Corpo:

```json
{
  "action": "mark_sent",
  "ids": ["id-da-mensagem"]
}
```

Acoes aceitas:

- `mark_sent`: marca como `enviada`.
- `mark_failed`: marca como `erro`.
- `cancel`: marca como `cancelada`.

## WhatsApp Business API

O numero API novo sera usado para avisos oficiais, recuperacao de pagamento, carrinho abandonado e boas-vindas. O numero atual do grupo permanece para relacionamento humano e comunidade.

Sequencia individual obrigatoria apos compra aprovada:

1. Confirmar pagamento aprovado via Kiwify.
2. Enviar video de boas-vindas apos pagamento.
3. Enviar orientacoes iniciais do TRINCA RV21.
4. Enviar arquivos e materiais necessarios do desafio.
5. Enviar dieta, ebooks e demais links prometidos, conforme a estrutura final definida.
6. Enviar a mensagem final de boas-vindas ao Grupo Oficial TRINCA RV21.

A mensagem do Grupo Oficial TRINCA RV21 nao deve ser antecipada. Ela e a ultima etapa da sequencia individual de boas-vindas, enviada somente depois que todas as mensagens e arquivos necessarios do TRINCA ja tiverem sido disparados.

Documentacao dos templates preparados:

- [`docs/whatsapp-api-templates.md`](./whatsapp-api-templates.md)

Fluxo recomendado no Make:

1. Buscar mensagens pendentes em `/api/automation/messages`.
2. Iterar cada mensagem.
3. Enviar template pelo WhatsApp Business API usando `whatsapp_template_name`.
4. Marcar como enviada com `mark_sent` apenas se a API confirmar o envio.
5. Marcar como erro com `mark_failed` quando a API rejeitar o disparo.

## Envio direto pela Twilio

O projeto tambem possui uma rota propria para disparar mensagens pendentes pela Twilio sem reconstruir o fluxo em ferramenta externa:

- `POST https://trinca-rv21.vercel.app/api/automation/dispatch?token=SEU_TOKEN&limit=5`

Teste sem envio real:

- `POST https://trinca-rv21.vercel.app/api/automation/dispatch?token=SEU_TOKEN&limit=5&dry_run=true`

Comportamento:

1. Busca mensagens `pendente` com `enviar_em` vencido.
2. Respeita `required_previous_steps` antes de enviar cada etapa.
3. Envia pela Twilio.
4. Marca como `enviada` apenas se a Twilio aceitar o disparo.
5. Marca como `erro` e salva o motivo em `metadata.whatsapp_provider_error` se a API rejeitar.

Em producao, mensagens iniciadas pela empresa devem usar templates aprovados. O modo `text` deve ficar restrito a testes controlados ou conversas dentro da janela permitida de atendimento.

## Recuperacao de lead sem evento Kiwify

O projeto tambem cobre a lead que preenche o formulario da landing, e enviada ao checkout, mas nao gera nenhum evento Kiwify. Esse cenario e diferente de Pix pendente, boleto gerado, carrinho abandonado ou pagamento recusado, porque a Kiwify ainda nao confirmou nenhum estado de checkout.

Rota:

- `POST https://trinca-rv21.vercel.app/api/automation/recover-leads?token=SEU_TOKEN&limit=25&min_age_minutes=5`

Teste sem criar fila:

- `POST https://trinca-rv21.vercel.app/api/automation/recover-leads?token=SEU_TOKEN&limit=25&min_age_minutes=5&dry_run=true`

Comportamento:

1. Busca leads de `landing-trinca-rv21` com status `novo-lead`, `lead-capturado` ou `checkout-iniciado`.
2. Considera apenas leads capturadas ha pelo menos `min_age_minutes`.
3. Ignora emails que ja possuem evento em `kiwify_events`.
4. Ignora emails que ja possuem recuperacao `lead_sem_evento_kiwify` na fila.
5. Cria tres mensagens: 5 minutos, 2 horas e 24 horas.
6. Usa dedupe por email, evento e etapa para evitar duplicidade.

Template recomendado:

- `trinca_retomada_inscricao`
- Content SID opcional no ambiente: `TWILIO_CONTENT_SID_RETOMADA_INSCRICAO`

## Saude operacional da automacao

Para operacao premium no lancamento, existe uma rota de diagnostico rapido:

- `GET https://trinca-rv21.vercel.app/api/automation/health?token=SEU_TOKEN`

Ela retorna:

- leads capturadas nas ultimas 24 horas;
- eventos Kiwify nas ultimas 24 horas;
- interacoes Twilio nas ultimas 24 horas;
- mensagens pendentes vencidas;
- mensagens pendentes totais;
- mensagens enviadas;
- mensagens com erro;
- gates aguardando clique;
- recuperacoes de lead sem evento Kiwify ainda pendentes;
- amostras recentes de erros e gates aguardando clique.

Uso recomendado:

1. Rodar antes de cada teste ponta a ponta.
2. Rodar depois de cada compra teste.
3. Monitorar durante o lancamento para identificar gargalo rapidamente.

## Grupo oficial recomendado

Nome principal:

- `TRINCA RV21 | Desafio Oficial`

Link atual:

- `https://chat.whatsapp.com/GFgMskDS6DfK5Ujf29N4PE?mode=gi_t`

Alternativas:

- `TRINCA RV21 | Alunas Oficiais`
- `TRINCA RV21 | Início 21 Dias`
