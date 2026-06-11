# TRINCA RV21 - Resumo para auditoria externa

Data: 09/06/2026

Este documento resume o estado atual do projeto TRINCA RV21 para analise externa tecnica, estrategica e operacional. O objetivo e permitir uma avaliacao independente sobre arquitetura, fluxo, automacao, riscos, escala e oportunidades de melhoria.

## 1. Visao geral do projeto

O TRINCA RV21 e um projeto digital premium voltado para mulheres que desejam recuperar disciplina, autoestima, constancia e evolucao corporal em 21 dias.

O ecossistema atual envolve:

- Landing page de captacao e venda.
- Checkout via Kiwify.
- Webhook Kiwify para confirmacao de compra e eventos de abandono/pagamento.
- Automacao WhatsApp via Twilio.
- Envio de videos, materiais, ebooks e dietas por objetivo.
- Painel operacional para acompanhar leads, etapas do fluxo, pagamentos, mensagens, erros e travas.
- Preparacao futura para trafego e automacoes Instagram: Bio, Story, Direct, Feed e campanhas.

## 2. Estrutura tecnica atual

Stack principal:

- Next.js.
- Vercel em producao.
- Supabase como banco operacional.
- Twilio WhatsApp API para disparos.
- Kiwify como checkout e origem dos webhooks de pagamento.

Dominio atual de producao:

- https://trinca-rv21.vercel.app

Rotas principais:

- `/` - Landing page.
- `/bio` - Pagina/link estrategico para Instagram.
- `/operacao` - Painel operacional protegido por token.
- `/api/leads` - Captacao de leads da landing.
- `/api/kiwify/webhook` - Recebimento de eventos Kiwify.
- `/api/twilio/webhook` - Recebimento de cliques/respostas WhatsApp.
- `/api/twilio/sync-inbound` - Sincronizacao de respostas inbound da Twilio.
- `/api/twilio/configure-inbound` - Configuracao programatica do webhook inbound da Twilio.
- `/api/automation/dispatch` - Despacho das mensagens pendentes.
- `/api/automation/run` - Orquestrador geral da automacao.
- `/api/automation/dashboard` - Dados do painel operacional.
- `/api/automation/health` - Saude operacional da automacao.

Observacao de seguranca:

- Tokens, chaves Supabase, Twilio Auth Token e segredos internos nao devem ser compartilhados em auditoria externa.
- Este resumo nao inclui credenciais.

## 3. Fluxo comercial e operacional construido

### Etapa 1 - Entrada da lead

A lead acessa a landing por links com UTMs, principalmente:

- Instagram Bio.
- Instagram Story.
- Instagram Direct.
- Instagram Feed.
- Futuramente trafego pago.

A landing coleta:

- Nome.
- Email.
- WhatsApp.
- Objetivo principal.
- Origem/UTM.

Objetivos atuais do formulario:

- Emagrecer e reduzir medidas.
- Melhorar gluteos e firmeza corporal.
- Recuperar autoestima.
- Voltar a usar roupas antigas.

### Etapa 2 - Checkout

A lead e direcionada ao checkout Kiwify.

Eventos tratados:

- Compra aprovada.
- Pagamento pendente.
- Pagamento recusado.
- Carrinho abandonado.

### Etapa 3 - Compra aprovada

Quando a Kiwify confirma pagamento aprovado, o sistema:

1. Registra/atualiza a lead.
2. Registra o evento Kiwify.
3. Cancela mensagens de recuperacao pendentes.
4. Cria a fila pos-compra.
5. Dispara a mensagem inicial de confirmacao da compra via WhatsApp.

Mensagem inicial contem botao:

- `Estou pronta`

Esse botao e obrigatorio para liberar a proxima etapa.

### Etapa 4 - Clique "Estou pronta"

Quando a lead clica ou responde "Estou pronta", o sistema:

1. Registra a interacao Twilio.
2. Marca o gate como concluido.
3. Atualiza a etapa da lead.
4. Libera o video pos-compra.

Foi corrigido um problema importante nesta etapa:

- A Twilio pode registrar numeros brasileiros com variacao do nono digito.
- O sistema agora reconhece WhatsApp com/sem nono digito para evitar travas indevidas.

### Etapa 5 - Video pos-compra

Depois do clique `Estou pronta`, a lead recebe:

- Video oficial pos-compra.

Arquivo atual:

- `/public/media/01-boas-vindas-pos-compra.mp4`

### Etapa 6 - Materiais e dieta

Apos o video pos-compra, o sistema envia materiais com cadencia, evitando avalanche de mensagens.

Materiais:

- Ebook RV.
- Ebook nutricional Julia Macena.
- Dieta especifica conforme objetivo escolhido.

Dietas atuais:

- `dieta-emagrecimento.pdf`
- `dieta-gluteos-firmeza.pdf`
- `dieta-autoestima.pdf`
- `dieta-roupas-antigas.pdf`

Ebooks atuais:

- `ebook-rv-trinca-rv21.pdf`
- `ebook-nutricional-julia-macena.pdf`

### Etapa 7 - Preparacao para grupo oficial

Apos materiais, a lead recebe mensagem preparando a entrada no grupo.

Essa mensagem contem botao:

- `Assistir boas-vindas`

Esse botao tambem e obrigatorio.

### Etapa 8 - Clique "Assistir boas-vindas"

Quando a lead clica ou responde "Assistir boas-vindas", o sistema:

1. Registra a interacao.
2. Marca o gate como concluido.
3. Envia o video de boas-vindas ao grupo oficial.

Arquivo atual:

- `/public/media/03-grupo-oficial.mp4`

### Etapa 9 - Link do grupo oficial

Apos o video final, o sistema libera o link do grupo oficial com cadencia minima.

Essa e a ultima etapa do fluxo pos-compra.

## 4. Cadencia e protecoes operacionais

Foram implementadas protecoes para evitar que a lead receba varias mensagens desordenadas ou em bloco.

Regras atuais:

- Compra aprovada dispara apenas a mensagem inicial de confirmacao.
- O clique `Estou pronta` libera apenas a proxima etapa elegivel.
- Materiais tem cadencia apos o video pos-compra.
- Preparacao do grupo tem cadencia apos materiais.
- O clique `Assistir boas-vindas` libera apenas o video do grupo.
- Link do grupo e liberado apos o video final.

Protecoes implementadas:

- Dedupe por evento/ordem/etapa.
- Gate interno para cliques obrigatorios.
- Reconhecimento de texto como alternativa ao botao.
- Reconhecimento de WhatsApp brasileiro com/sem nono digito.
- Trava anti-duplicidade por mensagem antes de envio.
- Estado `processando` para evitar dois workers dispararem a mesma mensagem.
- Monitoramento de mensagens `pendente`, `processando`, `enviada`, `erro`, `concluida`, `aguardando-clique`.

## 5. Painel operacional atual

Existe um painel em `/operacao`, protegido por token, para acompanhar o fluxo.

Ele mostra:

- Leads captadas.
- Origem da lead.
- Status do pagamento.
- Etapa atual da lead.
- Progresso da jornada.
- Mensagens enviadas.
- Mensagens pendentes.
- Gates aguardando clique.
- Erros de envio.
- Alertas operacionais.
- Saude da automacao.

Diretriz definida:

- Painel de fluxo deve mostrar somente a operacao da lead.
- Painel de acessos/conversao sera separado.
- Painel de trafego/Instagram sera separado.

Objetivo:

- Evitar excesso de informacao aleatoria.
- Permitir leitura rapida, didatica e objetiva.
- Transformar o painel em ferramenta de decisao, nao em painel tecnico confuso.

## 6. Personalizacao visual e materiais

Landing page:

- Identidade premium escura.
- Paleta preto, dourado e verde/teal.
- Foto do Ruria ajustada para melhor visibilidade.
- Responsividade mobile trabalhada.

WhatsApp:

- Numero Twilio ativo.
- Sender configurado para inbound webhook.
- Avatar recomendado criado para o projeto:
  - `public/images/whatsapp-profile-trinca-rv21-premium.png`
- Arte sem preco, com logo RV e nome TRINCA RV21.
- Proximo passo manual necessario: subir nome e foto no perfil do WhatsApp Sender na Twilio/Meta.

## 7. Testes reais ja realizados

Foi feito teste real com lead efetuando pagamento real.

Problemas encontrados e corrigidos:

1. Clique `Estou pronta` nao destravava.
   - Causa: resposta inbound nao estava chegando/nao casava com o WhatsApp salvo.
   - Correcao: webhook inbound configurado e reconhecimento de numero com/sem nono digito.

2. Mensagens pendentes dispararam em bloco apos recuperacao do clique.
   - Causa: etapas antigas estavam vencidas e o sistema permitia varias etapas em uma mesma rodada.
   - Correcao: cadencia por etapa, envio de apenas uma etapa elegivel por clique/ciclo, trava anti-duplicidade.

3. Painel nao mostrava claramente problema de clique que nao chegou.
   - Correcao: alerta operacional de clique nao recebido/lead travada.

Estado apos correcoes:

- Fluxo operacional esta mais estavel.
- O sistema evita duplicidade.
- Painel mostra erros/travas de forma mais clara.
- Ainda e recomendado novo teste real controlado do zero antes de iniciar trafego.

## 8. Escala e capacidade estimada

Analise atual:

- Landing na Vercel suporta alto volume de acessos.
- Supabase suporta bem cadastros e leitura operacional para fase inicial.
- Kiwify processa checkout externamente.
- Principal ponto de atencao e Twilio/WhatsApp throughput e controle de fila.

Estimativa conservadora atual:

- Ate 50 compras quase simultaneas: tranquilo.
- 50 a 200 leads em poucos minutos: suportavel com monitoramento.
- 200 a 500 leads em pico forte: possivel, exige observacao operacional.
- Acima de 500 compras quase simultaneas: recomenda-se fila dedicada mais robusta.

Protecoes atuais reduzem risco de:

- Mensagem duplicada.
- Lead receber etapa errada.
- Fluxo misturar etapas entre leads.
- Disparo em avalanche.

Melhoria futura recomendada:

- Fila profissional dedicada com retry, backoff, prioridade e controle de concorrencia.
- Exemplo: Upstash/QStash, Inngest, Trigger.dev, BullMQ/Redis ou equivalente.

## 9. Proximas etapas planejadas

Ordem combinada do projeto:

1. Finalizar personalizacao do WhatsApp:
   - Nome do projeto.
   - Foto oficial.
   - Perfil comercial.

2. Fazer checklist tecnico completo:
   - Landing.
   - Formulario.
   - Checkout.
   - Webhook Kiwify.
   - Mensagem compra confirmada.
   - Botao `Estou pronta`.
   - Video pos-compra.
   - Materiais e dieta por objetivo.
   - Botao `Assistir boas-vindas`.
   - Video grupo.
   - Link grupo.
   - Painel operacional.
   - Erros e alertas.

3. Fazer novo teste real controlado do zero.

4. Iniciar etapa estrategica de trafego e Instagram:
   - Bio.
   - Story.
   - Feed.
   - Direct.
   - Automacoes.
   - Pagina/link estrategico.
   - Medicao de conversao por origem.

5. Construir painel separado de acessos/conversao:
   - Acessos totais.
   - Visitantes unicos.
   - Origem de acesso.
   - Conversao acesso -> lead.
   - Conversao lead -> compra.
   - Dispositivo.
   - Horarios de pico.

## 10. Pontos para auditoria externa

Solicita-se analise externa sobre:

1. Arquitetura atual:
   - Esta adequada para MVP/lancamento inicial?
   - Quais pontos merecem endurecimento antes de trafego pesado?

2. Fluxo WhatsApp:
   - A cadencia esta clara?
   - A quantidade de mensagens esta adequada?
   - Ha risco de confusao para a lead?

3. Escala:
   - Quais gargalos provaveis?
   - Quando migrar para fila dedicada?
   - Melhor arquitetura para centenas/milhares de leads?

4. Observabilidade:
   - O painel atual cobre o essencial?
   - Quais alertas faltam para operacao em lancamento?

5. Trafego e funil:
   - Como estruturar UTM e medicao por origem?
   - Quais metricas acompanhar por canal Instagram?
   - Como separar acesso, lead, checkout e compra?

6. Experiencia premium:
   - O fluxo esta sofisticado o suficiente?
   - Onde reduzir friccao?
   - Onde melhorar percepcao de valor?

7. Seguranca:
   - Webhooks estao suficientemente protegidos?
   - Tokens deveriam ser rotacionados?
   - Alguma rota operacional precisa de protecao adicional?

## 11. Resumo executivo

O TRINCA RV21 ja possui uma estrutura funcional de ponta a ponta:

- Landing online.
- Captacao de lead.
- Checkout Kiwify.
- Webhook de pagamento.
- Automacao WhatsApp via Twilio.
- Videos e materiais integrados.
- Dietas por objetivo.
- Painel operacional.
- Correcoes de fluxo real apos teste com pagamento.

O projeto esta proximo de uma fase de validacao final.

Antes de trafego forte, recomenda-se:

- Personalizar oficialmente WhatsApp.
- Executar teste real controlado do zero.
- Confirmar checklist completo.
- Separar painel de acessos/conversao.
- Planejar fila dedicada se houver previsao de pico alto de compras simultaneas.

