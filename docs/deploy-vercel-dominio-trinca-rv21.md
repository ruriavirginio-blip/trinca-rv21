# Deploy permanente - TRINCA RV21

Este documento organiza a etapa de colocar landing, bio, painel e webhooks online em dominio proprio.

## Decisao recomendada

Comecar por um subdominio dedicado:

```text
https://trinca.seudominio.com
```

Isso evita quebrar o WordPress atual e permite validar todo o lancamento com seguranca. Depois, se fizer sentido, o dominio principal pode apontar para o projeto.

## URLs finais do projeto

Ao publicar, estas serao as URLs principais:

```text
Landing:          https://trinca.seudominio.com/
Bio Instagram:    https://trinca.seudominio.com/bio
Painel:           https://trinca.seudominio.com/operacao
Readiness:        https://trinca.seudominio.com/api/automation/readiness?token=SEU_TOKEN
Teste do fluxo:   https://trinca.seudominio.com/api/automation/flow-test?token=SEU_TOKEN
Motor automacao:  https://trinca.seudominio.com/api/automation/run?token=SEU_TOKEN
Webhook Kiwify:   https://trinca.seudominio.com/api/kiwify/webhook?token=SEU_TOKEN_KIWIFY
Webhook Twilio:   https://trinca.seudominio.com/api/twilio/webhook?token=SEU_TOKEN_TWILIO
```

## Variaveis obrigatorias na Vercel

Configure em Project Settings > Environment Variables:

```text
NEXT_PUBLIC_SITE_URL=https://trinca.seudominio.com
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_KIWIFY_CHECKOUT_URL=
NEXT_PUBLIC_WHATSAPP_GROUP_URL=
AUTOMATION_API_SECRET=
CRON_SECRET=
KIWIFY_WEBHOOK_SECRET=
TWILIO_WEBHOOK_SECRET=
WHATSAPP_PROVIDER=twilio
```

Twilio:

```text
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=
TWILIO_MESSAGING_SERVICE_SID=
TWILIO_BASE_URL=https://api.twilio.com
TWILIO_SEND_MODE=content
TWILIO_SEND_MEDIA=false
TWILIO_CONTENT_SID_COMPRA_CONFIRMADA=HX08f4184e637809935c6e541a54ca1c0e
TWILIO_CONTENT_SID_BOAS_VINDAS_VIDEO=
TWILIO_CONTENT_SID_ORIENTACOES_INICIAIS=HX23f2de44593d23156c67e901e82cefd
TWILIO_CONTENT_SID_MATERIAIS_DESAFIO=HXb4b62a94f3e79006249d09ac5cbfcd6
TWILIO_CONTENT_SID_DIETA_EBOOKS=HXb2393b281d491d8a4fb7a22972aa9cdd
TWILIO_CONTENT_SID_GRUPO_OFICIAL_PREPARACAO=HX8c1bece081b38a41162656b314606cc3
TWILIO_CONTENT_SID_GRUPO_OFICIAL_FINAL=HX8c1bece081b38a41162656b314606cc3
TWILIO_CONTENT_SID_GRUPO_OFICIAL_LINK=
```

Conteudo premium, a ser preenchido na etapa final:

```text
TRINCA_WELCOME_VIDEO_URL=
TRINCA_ABANDONMENT_VIDEO_URL=
TRINCA_GROUP_WELCOME_VIDEO_URL=
TRINCA_ORIENTATION_URL=https://trinca.seudominio.com/aluna/orientacoes
TRINCA_MATERIALS_URL=https://trinca.seudominio.com/aluna/materiais
TRINCA_DIET_URL=https://trinca.seudominio.com/aluna/dieta-treino
TRINCA_EBOOK_RV_URL=
TRINCA_EBOOK_NUTRITION_URL=
```

## DNS

Na Vercel, adicionar o dominio/subdominio no projeto.

Para subdominio, normalmente a Vercel pedira um CNAME:

```text
Tipo: CNAME
Nome: trinca
Valor: cname.vercel-dns.com
```

Depois de apontar o DNS, aguardar a Vercel emitir SSL. O projeto so deve ser considerado pronto quando `https://` estiver ativo.

## Motor automatico do fluxo

Foi preparada a rota:

```text
/api/automation/run
```

Ela executa a rotina operacional do projeto:

- procura leads capturadas que nao tiveram evento Kiwify;
- enfileira recuperacao quando a lead parou antes do pagamento;
- dispara mensagens pendentes que ja chegaram no horario certo;
- respeita os gates de clique antes de liberar videos e link do grupo.

Em producao, essa rota deve rodar a cada 5 minutos:

```text
*/5 * * * *
```

Importante: contas Vercel Hobby nao permitem cron a cada 5 minutos. Neste caso, use uma destas opcoes:

- executar manualmente pelo painel durante validacao;
- usar um cron externo chamando `/api/automation/run`;
- subir para Vercel Pro antes do lancamento com volume.

Para esse agendamento funcionar com seguranca, configure `CRON_SECRET` na Vercel. O painel tambem mostra a URL manual do motor da automacao, caso seja necessario executar um ciclo sob demanda.

## Supabase antes da producao

Aplicar estes SQLs no Supabase:

```text
docs/supabase-leads.sql
docs/supabase-twilio-interactions.sql
```

A tabela `twilio_interactions` e importante para o painel mostrar os cliques reais das leads.

Guia passo a passo:

```text
docs/aplicar-tabela-cliques-twilio-supabase.md
```

## Configurar Kiwify

No painel da Kiwify, configurar o webhook de venda para:

```text
https://trinca.seudominio.com/api/kiwify/webhook?token=SEU_TOKEN_KIWIFY
```

Eventos esperados:

- compra aprovada;
- pagamento pendente;
- pagamento recusado;
- carrinho/pedido abandonado, se disponivel.

## Configurar Twilio

No sender WhatsApp da Twilio, configurar inbound/status webhook para:

```text
https://trinca.seudominio.com/api/twilio/webhook?token=SEU_TOKEN_TWILIO
```

Esse webhook e o que registra os cliques:

- `compra_confirmada_estou_pronta`;
- `assistir_boas_vindas_grupo`.

## Validacao depois do deploy

1. Abrir `https://trinca.seudominio.com/`.
2. Abrir `https://trinca.seudominio.com/bio`.
3. Abrir `https://trinca.seudominio.com/operacao?token=SEU_TOKEN`.
4. Rodar o botao `Rodar teste` no painel.
5. Conferir `readiness`:

```text
https://trinca.seudominio.com/api/automation/readiness?token=SEU_TOKEN
```

6. Fazer um lead interno pela landing.
7. Confirmar no painel:
   - origem por UTM;
   - pagamento confirmado;
   - cliques Twilio;
   - mensagem final do grupo.

## Links oficiais para Instagram

Bio:

```text
https://trinca.seudominio.com/bio
```

Story:

```text
https://trinca.seudominio.com/?utm_source=instagram&utm_medium=story&utm_campaign=trinca_rv21_lancamento
```

Direct:

```text
https://trinca.seudominio.com/?utm_source=instagram&utm_medium=direct&utm_campaign=trinca_rv21_lancamento
```

Feed:

```text
https://trinca.seudominio.com/?utm_source=instagram&utm_medium=feed&utm_campaign=trinca_rv21_lancamento
```

## Criterio de pronto

Esta etapa esta pronta quando:

- dominio HTTPS abre no celular;
- landing envia lead ao Supabase;
- painel abre com token;
- readiness nao mostra bloqueios tecnicos;
- teste controlado do fluxo retorna aprovado;
- Kiwify e Twilio apontam para URLs do dominio.
