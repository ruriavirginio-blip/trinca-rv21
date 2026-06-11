# Integracao Twilio WhatsApp - TRINCA RV21

## Objetivo

Usar a Twilio como provedor oficial/remoto de WhatsApp sem alterar o fluxo do projeto.

O fluxo permanece:

1. Kiwify confirma ou atualiza o pedido.
2. `/api/kiwify/webhook` registra o evento.
3. O Supabase cria a fila em `automation_messages`.
4. `/api/automation/dispatch` busca mensagens pendentes.
5. A Twilio envia para o WhatsApp da lead.
6. `/api/twilio/webhook` recebe cliques de botoes enviados pela lead.
7. O sistema atualiza o status da etapa e libera a proxima mensagem da fila.

## Por que a Twilio encaixa

- Nao exige WhatsApp fisico conectado por QR Code.
- Funciona por API oficial.
- Envia mensagens e midia.
- Possui webhooks para status e respostas.
- Permite manter o Supabase como fonte da verdade.
- Permite trocar de provedor depois sem reconstruir o funil.

## Variaveis de ambiente

```env
WHATSAPP_PROVIDER=twilio
AUTOMATION_API_SECRET=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WEBHOOK_SECRET=
TWILIO_WHATSAPP_FROM=
TWILIO_MESSAGING_SERVICE_SID=
TWILIO_BASE_URL=https://api.twilio.com
TWILIO_SEND_MODE=content
TWILIO_SEND_MEDIA=false
TWILIO_DEFAULT_CONTENT_SID=
TWILIO_CONTENT_SID_RETOMADA_INSCRICAO=
TWILIO_CONTENT_SID_COMPRA_CONFIRMADA=HX08f4184e637809935c6e541a54ca1c0e
TWILIO_CONTENT_SID_BOAS_VINDAS_VIDEO=
TWILIO_CONTENT_SID_ORIENTACOES_INICIAIS=HX23f2de44593d23156c67e901e82cefd
TWILIO_CONTENT_SID_MATERIAIS_DESAFIO=HXb4b62a94f3e79006249d09ac5cbfcd6
TWILIO_CONTENT_SID_DIETA_EBOOKS=HXb2393b281d491d8a4fb7a22972aa9cdd
TWILIO_CONTENT_SID_GRUPO_OFICIAL_PREPARACAO=HX8c1bece081b38a41162656b314606cc3
TWILIO_CONTENT_SID_GRUPO_OFICIAL_FINAL=HX8c1bece081b38a41162656b314606cc3
TWILIO_CONTENT_SID_GRUPO_OFICIAL_LINK=
```

## Modo de envio

### `TWILIO_SEND_MODE=content`

Modo recomendado para producao.

Usa templates aprovados no Twilio Content Template Builder. Cada etapa pode ter seu proprio `ContentSid`:

- `TWILIO_CONTENT_SID_BOAS_VINDAS_VIDEO`
- `TWILIO_CONTENT_SID_ORIENTACOES_INICIAIS`
- `TWILIO_CONTENT_SID_MATERIAIS_DESAFIO`
- `TWILIO_CONTENT_SID_DIETA_EBOOKS`
- `TWILIO_CONTENT_SID_GRUPO_OFICIAL_PREPARACAO`
- `TWILIO_CONTENT_SID_GRUPO_OFICIAL_FINAL`
- `TWILIO_CONTENT_SID_GRUPO_OFICIAL_LINK`

Se uma etapa nao tiver ContentSid especifico, a rota usa `TWILIO_DEFAULT_CONTENT_SID`.

As variaveis sao enviadas como:

```json
{
  "1": "Nome",
  "2": "Metodo de pagamento",
  "3": "Produto"
}
```

### `TWILIO_SEND_MODE=text`

Modo de teste.

Envia o campo `mensagem` como texto simples. Deve ser usado apenas em testes controlados ou dentro da janela permitida de atendimento do WhatsApp.

## Videos e arquivos

`TWILIO_SEND_MEDIA=true` envia `metadata.asset_url` como `MediaUrl`.

Para producao premium, o mais seguro e:

1. Criar templates de midia no Content Template Builder quando a mensagem for iniciada pela empresa.
2. Hospedar videos em URL HTTPS estavel.
3. Testar tamanho, formato, tempo de carregamento e compressao no WhatsApp.
4. Se o video for longo ou tiver qualidade essencial, enviar link para uma pagina/video hospedado em vez do arquivo direto.

## Rota de disparo

Envio real:

```http
POST /api/automation/dispatch?token=SEU_TOKEN&limit=5
```

Teste sem envio real:

```http
POST /api/automation/dispatch?token=SEU_TOKEN&limit=5&dry_run=true
```

## Rota de respostas e cliques

Configure na Twilio o webhook de mensagens recebidas para:

```http
POST https://trinca-rv21.vercel.app/api/twilio/webhook?token=SEU_TWILIO_WEBHOOK_SECRET
```

O valor de `SEU_TWILIO_WEBHOOK_SECRET` deve ser o mesmo de `TWILIO_WEBHOOK_SECRET`.

A rota reconhece os payloads de botao abaixo:

- `compra_confirmada_estou_pronta`: conclui `clique-compra-confirmada-estou-pronta` e libera o video de boas-vindas pos-compra.
- `assistir_boas_vindas_grupo`: conclui `clique-grupo-assistir-boas-vindas` e libera o video de boas-vindas ao Grupo Oficial.

Se a Twilio enviar o texto do botao em vez do payload tecnico, a rota tambem reconhece `Estou pronta` e `Assistir boas-vindas`.

Todo evento recebido tambem e registrado em `twilio_interactions` para auditoria.

## Teste local do clique

Depois que uma compra aprovada criar a fila e houver um gate com status `aguardando-clique`, simule o clique assim:

```bash
curl -X POST "http://localhost:3000/api/twilio/webhook?token=SEU_TWILIO_WEBHOOK_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "WaId=558499257144" \
  --data-urlencode "ButtonPayload=compra_confirmada_estou_pronta" \
  --data-urlencode "ButtonText=Estou pronta" \
  --data-urlencode "MessageSid=SM_TESTE_COMPRA"
```

Depois rode o dispatch:

```bash
curl -X POST "http://localhost:3000/api/automation/dispatch?token=SEU_AUTOMATION_API_SECRET&limit=5"
```

O resultado esperado e o envio da etapa `boas-vindas-video`. O mesmo teste pode ser repetido com `ButtonPayload=assistir_boas_vindas_grupo` para liberar o video final do grupo.

## Checklist antes de producao

- Criar conta Twilio.
- Ativar WhatsApp Sender ou Messaging Service.
- Validar empresa/WhatsApp conforme exigido pela Twilio/Meta.
- Criar templates no Content Template Builder.
- Salvar ContentSid de cada etapa na Vercel.
- Configurar webhook inbound `/api/twilio/webhook`.
- Criar a tabela `twilio_interactions` no Supabase.
- Rodar `dry_run=true`.
- Fazer compra teste na Kiwify.
- Enviar para numero interno.
- Conferir ordem: compra confirmada, clique Estou pronta, video, orientacoes, materiais, dieta/ebooks, clique Assistir boas-vindas, video grupo, link grupo.

Arquivos de apoio:

- `docs/supabase-twilio-interactions.sql`: SQL isolado para criar apenas a tabela de interacoes Twilio.
- `docs/teste-fluxo-twilio-cliques.md`: roteiro de homologacao do fluxo completo com os dois gates de clique.
- `docs/runbook-lancamento-trinca-rv21.md`: checklist operacional para deploy, testes e lancamento.

## Fontes

- https://www.twilio.com/docs/whatsapp
- https://www.twilio.com/docs/messaging/api/message-resource
- https://www.twilio.com/docs/content
- https://www.twilio.com/en-us/whatsapp/pricing
