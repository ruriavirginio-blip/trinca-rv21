# Auditoria de retomada - TRINCA RV21

Data da retomada: 2026-05-30

## Estado geral

O projeto esta preservado, conectado no diretorio correto e com Git limpo.

Diretorio correto:

`/Users/admin/Documents/Documentos - MacBook Pro Ruria virginio/trinca-rv21`

Diretorio antigo que causou o alerta:

`/Users/admin/Documents/trinca-rv21`

O erro de "diretorio de trabalho atual ausente" foi um problema de referencia local do Codex, nao perda de projeto.

## Ja construido

- Landing page principal do desafio TRINCA RV21.
- Hero com identidade, promessa dos 21 dias, CTA e resumo da oferta.
- Secoes de dor, autoridade de Ruria Virginio, metodo, jornada, resultados, oferta, FAQ e CTA final.
- Galeria de resultados reais com imagens locais.
- Formulario de inscricao com nome, email, WhatsApp, objetivo e consentimento.
- Redirecionamento para checkout Kiwify apos captura do lead.
- Pagina de obrigado orientando a acompanhar a sequencia individual pelo WhatsApp antes do acesso ao grupo oficial.
- Layout responsivo e ajustes mobile do header.
- Schema Supabase para `leads`, `kiwify_events` e `automation_messages`.
- API `/api/leads` para salvar leads da landing.
- API `/api/kiwify/webhook` para receber eventos da Kiwify.
- Normalizacao de eventos de compra aprovada, pagamento pendente, pagamento recusado e carrinho abandonado.
- Registro historico dos eventos Kiwify.
- Fila de mensagens automaticas para recuperacao e boas-vindas.
- Cancelamento de recuperacoes pendentes quando a compra e aprovada.
- API `/api/automation/messages` para Make/n8n buscar mensagens pendentes.
- Endpoint para Make/n8n marcar mensagens como enviadas, erro ou canceladas.
- Templates planejados para WhatsApp Business API.
- Documentacao do funil, mensagens de recuperacao e templates oficiais.
- Variaveis de ambiente preparadas para Supabase, Kiwify, grupo, webhook e automacao.

## Validado na retomada

- `git status` limpo.
- `npm run lint` aprovado.
- `npm run build` aprovado.
- Servidor local Next.js subiu em `http://localhost:3000`.
- Landing `/` respondeu HTTP 200.
- Pagina `/obrigado` respondeu HTTP 200.
- `.env.local` existe com variaveis principais.
- Imagens do projeto existem em `public/images`.

## Pontos que ainda nao estao fechados

- A recuperacao do lead que preenche o formulario e nao gera evento Kiwify ainda precisa ser implementada.
- O envio real pelo WhatsApp API ainda depende da conta/numero serem liberados pela Meta.
- Os templates ainda precisam ser criados/aprovados no WhatsApp Manager.
- O cenario final do Make/n8n ainda precisa ser fechado de ponta a ponta.
- Links finais de video, dieta, Ebook RV e Ebook Nutricional ainda estao como placeholders.
- A entrega operacional da dieta individual ainda precisa ser definida.
- O cupom pos-desafio precisa ter destino final confirmado.
- A estrategia completa de Instagram ainda precisa ser documentada e conectada ao funil.

## Dados recuperados da conversa antiga

Status antigo confirmado:

- Landing publicada e funcionando.
- Formulario capturando lead.
- Supabase criado para leads, eventos e mensagens.
- Kiwify conectado ao projeto.
- Webhook da Kiwify preparado.
- Make iniciado para buscar mensagens pendentes.
- WhatsApp API criado na Meta.
- Conta WhatsApp `TRINCA RV21` criada.
- Numero API adicionado, mas pendente.
- Status da conta WhatsApp: `Analise em andamento`.

Orientacao confirmada na conversa antiga:

- Nao alterar mais o nome `TRINCA RV21` enquanto a Meta analisa.
- Nao excluir a conta WhatsApp.
- Nao tentar cadastrar outro numero na mesma conta durante a analise.
- Continuar com o que independe da Meta: Make, templates, landing, mobile e estrategia.

Proximo passo tecnico recomendado na conversa antiga:

`lead preencheu formulario` -> `foi para checkout` -> `nao comprou / nao gerou Pix / nao gerou boleto / nao teve evento Kiwify`

Esse fluxo ainda precisa de recuperacao propria, porque hoje o sistema recupera eventos que chegam da Kiwify, mas nao cobre com precisao a lead que some antes de virar evento Kiwify.

## Fluxo ideal completo

1. Lead acessa a landing.
2. Lead preenche nome, email, WhatsApp e objetivo.
3. Lead e salvo no Supabase.
4. Lead e enviado para o checkout Kiwify.
5. Kiwify dispara evento de Pix, boleto, cartao recusado, carrinho abandonado ou compra aprovada.
6. Webhook recebe o evento.
7. Sistema normaliza o status do funil.
8. Sistema cria mensagens pendentes na fila.
9. Make/n8n busca mensagens pendentes.
10. WhatsApp API envia template aprovado.
11. Make/n8n marca mensagem como enviada.
12. Se compra for aprovada, recuperacoes pendentes sao canceladas.
13. Aluna recebe sequencia individual de boas-vindas, video, orientacoes, materiais, dieta, ebooks e so depois acesso ao grupo oficial.
14. Pos-desafio libera cupom `TRINCA PREMIUM50%`.

## Estrategia Instagram a construir

O Instagram deve girar em torno do TRINCA RV21 em quatro frentes:

- Bio e link: promessa clara, prova, chamada para entrar no desafio e link da landing.
- Conteudo organico: stories diarios, reels de dor/desejo/prova, feed com autoridade e resultados.
- Direct: palavra-chave, qualificacao, resposta automatica e envio para landing.
- Comentarios: gatilho por palavra-chave para iniciar conversa no direct.
- Trafego: anuncios levando para landing ou direct, com retargeting de engajadas e visitantes.
- Prova social: antes/depois, bastidores, depoimentos, prints autorizados, rotina do grupo e transformacoes.

Para fazer a leitura exata do Instagram, ainda e necessario informar o @ ou link publico da pagina.

## Proxima ordem recomendada

1. Implementar recuperacao de lead capturada sem evento Kiwify.
2. Revisar/confirmar status atual da Meta WhatsApp API.
3. Criar templates no WhatsApp Manager.
4. Finalizar cenario Make/n8n.
5. Inserir links finais de video e materiais.
6. Testar fluxo real ponta a ponta.
7. Auditar Instagram e criar plano completo de vendas, stories, feed, direct, comentarios e trafego.
