# Funil TRINCA RV21

## Recomendacao de stack

- Banco de leads: Supabase.
- Checkout: Kiwify.
- Automacao: Make ou n8n no inicio; WhatsApp API oficial ou Evolution API quando o volume pedir.
- Landing: Next.js, com rota propria para capturar leads antes do envio ao WhatsApp.

## Etapas do lead

1. `captacao`: lead preenche o formulario da landing.
2. `whatsapp`: lead e direcionada para o WhatsApp oficial do desafio.
3. `grupo`: lead entra no grupo oficial do TRINCA RV21.
4. `aquecimento`: lead recebe conteudos, provas e chamadas para compra.
5. `checkout`: lead clica para a pagina de pagamento Kiwify.
6. `comprou`: pagamento aprovado na Kiwify.
7. `pos-desafio`: aluna recebe oferta da Plataforma RV ONLINE.

## Eventos futuros

- `lead_created`: disparado quando a landing salva um novo lead.
- `checkout_started`: disparado quando a lead clica no link da Kiwify.
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
- `AUTOMATION_WEBHOOK_URL`: URL futura do Make, n8n ou plataforma de WhatsApp.

## Ponte com Make/n8n

URL para buscar mensagens prontas para envio:

- `GET https://trinca-rv21.vercel.app/api/automation/messages?token=SEU_TOKEN&limit=10`

Resposta esperada:

- `messages`: lista de mensagens com `id`, `nome`, `whatsapp`, `email`, `mensagem`, `etapa` e `enviar_em`.

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

## Grupo oficial recomendado

Nome principal:

- `TRINCA RV21 | Desafio Oficial`

Link atual:

- `https://chat.whatsapp.com/GFgMskDS6DfK5Ujf29N4PE?mode=gi_t`

Alternativas:

- `TRINCA RV21 | Alunas Oficiais`
- `TRINCA RV21 | Início 21 Dias`
