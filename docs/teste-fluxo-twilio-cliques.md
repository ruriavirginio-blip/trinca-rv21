# Teste do fluxo Twilio com gates de clique

Use este roteiro para homologar o fluxo pos-compra do TRINCA RV21 antes de liberar producao.

## Teste automatizado controlado

O projeto possui um harness local para testar a logica do fluxo completo sem enviar WhatsApp real:

```bash
npm run dev
npm run test:flow
```

Ele valida:

- recuperacao de lead capturada sem evento Kiwify;
- criacao da fila pos-compra por webhook Kiwify sintetico;
- bloqueio do video pos-compra antes do clique `Estou pronta`;
- conclusao do gate por `/api/twilio/webhook`;
- bloqueio do video do grupo antes do clique `Assistir boas-vindas`;
- liberacao do link do grupo somente depois do video do grupo.

O teste cria dados sinteticos no Supabase e limpa os registros ao final.

## 1. Preparar ambiente

- Aplicar `docs/supabase-twilio-interactions.sql` no Supabase.
- Configurar `TWILIO_WEBHOOK_SECRET` na Vercel.
- Configurar na Twilio o webhook inbound:

```text
POST https://trinca-rv21.vercel.app/api/twilio/webhook?token=SEU_TWILIO_WEBHOOK_SECRET
```

- Confirmar `AUTOMATION_API_SECRET` na Vercel.
- Confirmar Content SIDs na Vercel:
  - `TWILIO_CONTENT_SID_COMPRA_CONFIRMADA`
  - `TWILIO_CONTENT_SID_BOAS_VINDAS_VIDEO`
  - `TWILIO_CONTENT_SID_ORIENTACOES_INICIAIS`
  - `TWILIO_CONTENT_SID_MATERIAIS_DESAFIO`
  - `TWILIO_CONTENT_SID_DIETA_EBOOKS`
  - `TWILIO_CONTENT_SID_GRUPO_OFICIAL_PREPARACAO`
  - `TWILIO_CONTENT_SID_GRUPO_OFICIAL_FINAL`
  - `TWILIO_CONTENT_SID_GRUPO_OFICIAL_LINK`

## 2. Verificar endpoint inbound

Antes de testar cliques reais, confirme se a rota inbound esta viva:

```bash
curl "https://trinca-rv21.vercel.app/api/twilio/webhook?token=SEU_TWILIO_WEBHOOK_SECRET"
```

Resultado esperado:

- `ok: true`
- `supabase_configured: true`
- `webhook_secret_configured: true`
- `mapped_button_payloads` contem `compra_confirmada_estou_pronta` e `assistir_boas_vindas_grupo`

## 3. Criar fila com compra aprovada

Faça uma compra teste aprovada na Kiwify ou envie um webhook de teste para `/api/kiwify/webhook`.

No Supabase, confira `automation_messages`:

```sql
select etapa, status, enviar_em, metadata
from public.automation_messages
where email = 'EMAIL_DA_COMPRA_TESTE'
order by created_at asc;
```

Resultado esperado:

- `compra-confirmada`: `pendente`
- `clique-compra-confirmada-estou-pronta`: `aguardando-clique`
- `boas-vindas-video`: `pendente`
- `orientacoes-iniciais`: `pendente`
- `materiais-desafio`: `pendente`
- `dieta-ebooks`: `pendente`
- `grupo-oficial-preparacao`: `pendente`
- `clique-grupo-assistir-boas-vindas`: `aguardando-clique`
- `grupo-oficial-final`: `pendente`
- `grupo-oficial-link`: `pendente`

## 4. Disparar compra confirmada

```bash
curl -X POST "https://trinca-rv21.vercel.app/api/automation/dispatch?token=SEU_AUTOMATION_API_SECRET&limit=5"
```

Resultado esperado:

- `compra-confirmada` vira `enviada`.
- `boas-vindas-video` continua bloqueada porque depende de `clique-compra-confirmada-estou-pronta`.

## 5. Testar clique Estou pronta

Clique no botao no WhatsApp ou simule:

```bash
curl -X POST "https://trinca-rv21.vercel.app/api/twilio/webhook?token=SEU_TWILIO_WEBHOOK_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "WaId=55DDDNUMERO" \
  --data-urlencode "ButtonPayload=compra_confirmada_estou_pronta" \
  --data-urlencode "ButtonText=Estou pronta" \
  --data-urlencode "MessageSid=SM_TESTE_COMPRA"
```

Resultado esperado:

- `clique-compra-confirmada-estou-pronta` vira `concluida`.
- Um registro aparece em `twilio_interactions`.

## 6. Disparar video pos-compra e materiais

Rode o dispatch novamente.

```bash
curl -X POST "https://trinca-rv21.vercel.app/api/automation/dispatch?token=SEU_AUTOMATION_API_SECRET&limit=10"
```

Resultado esperado:

- `boas-vindas-video` pode ser enviado.
- Etapas seguintes avançam em ordem conforme `enviar_em` e `required_previous_steps`.
- `grupo-oficial-final` e `grupo-oficial-link` continuam bloqueadas ate o segundo clique.

## 7. Testar clique Assistir boas-vindas

Clique no botao no WhatsApp ou simule:

```bash
curl -X POST "https://trinca-rv21.vercel.app/api/twilio/webhook?token=SEU_TWILIO_WEBHOOK_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "WaId=55DDDNUMERO" \
  --data-urlencode "ButtonPayload=assistir_boas_vindas_grupo" \
  --data-urlencode "ButtonText=Assistir boas-vindas" \
  --data-urlencode "MessageSid=SM_TESTE_GRUPO"
```

Resultado esperado:

- `clique-grupo-assistir-boas-vindas` vira `concluida`.
- `grupo-oficial-final` fica liberada para envio.

## 8. Liberar video do grupo e link final

Rode o dispatch novamente:

```bash
curl -X POST "https://trinca-rv21.vercel.app/api/automation/dispatch?token=SEU_AUTOMATION_API_SECRET&limit=10"
```

Resultado esperado:

- `grupo-oficial-final` e enviado.
- `grupo-oficial-link` so e enviado depois de `grupo-oficial-final`.

## 9. Consulta final

```sql
select etapa, status, metadata->>'completed_at' as completed_at
from public.automation_messages
where email = 'EMAIL_DA_COMPRA_TESTE'
order by created_at asc;
```

O fluxo aprovado deve terminar com os dois gates `concluida` e as mensagens de conteudo `enviada`, sem antecipar video nem link do grupo.
