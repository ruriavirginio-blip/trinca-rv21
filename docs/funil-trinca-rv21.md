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
- `purchase_approved`: recebido via webhook da Kiwify.
- `purchase_refused`: recebido via webhook da Kiwify para recuperacao.
- `group_joined`: atualizado manualmente ou por automacao.

## Proximo encaixe com Kiwify

Quando o checkout estiver criado, salvar o link em uma variavel de ambiente e trocar os CTAs de compra para uma pagina intermediaria de rastreio. Isso permite marcar quem clicou no checkout mesmo antes da compra.

Variavel preparada na landing:

- `NEXT_PUBLIC_KIWIFY_CHECKOUT_URL`: link publico do checkout Kiwify.
- `NEXT_PUBLIC_WHATSAPP_GROUP_URL`: link do grupo oficial enviado no pos-compra.

## Grupo oficial recomendado

Nome principal:

- `TRINCA RV21 | Desafio Oficial`

Link atual:

- `https://chat.whatsapp.com/GFgMskDS6DfK5Ujf29N4PE?mode=gi_t`

Alternativas:

- `TRINCA RV21 | Alunas Oficiais`
- `TRINCA RV21 | Início 21 Dias`
