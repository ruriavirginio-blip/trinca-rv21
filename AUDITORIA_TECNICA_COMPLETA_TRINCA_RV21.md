# AUDITORIA TECNICA COMPLETA - TRINCA RV21

Data da leitura: 10/06/2026  
Base analisada: codigo local do projeto Next.js em `trinca-rv21`  
URL publica conhecida do projeto: `https://trinca-rv21.vercel.app`  
Observacao de seguranca: tokens, secrets, credenciais Twilio, chaves Supabase e tokens de webhook foram propositalmente omitidos.

## PARTE 1: LANDING PAGE

### 1.1 Quantas landing pages existem?

Existe 1 landing page principal de venda/captacao:

- `/`

Tambem existem paginas auxiliares:

- `/bio`: pagina de link da bio do Instagram, usada para direcionamento para a landing e WhatsApp.
- `/obrigado`: pagina pos-compra/instrucional do proprio projeto.
- `/aluna`: central estrutural da aluna, ainda parcial como area futura/complementar.

### 1.2 Qual plataforma foi usada para criar cada uma?

Plataforma usada: Next.js 16, React 19, TypeScript, hospedagem Vercel.

Nao e WordPress, Elementor, Leadpages ou ferramenta no-code. A landing foi criada em codigo proprio.

### 1.3 Qual e a URL de cada landing page?

- Landing principal: `https://trinca-rv21.vercel.app/`
- Bio/link hub: `https://trinca-rv21.vercel.app/bio`
- Obrigado/pos-compra: `https://trinca-rv21.vercel.app/obrigado`

Dominio proprio do cliente: NAO SEI se ja foi conectado ao projeto. O codigo esta preparado para rodar no dominio publico definido em `NEXT_PUBLIC_SITE_URL`.

### 1.4 Quais campos o formulario coleta?

Formulario da landing principal coleta:

- Nome completo
- Melhor e-mail
- WhatsApp com DDD
- Principal objetivo
- Consentimento para receber mensagens por WhatsApp e e-mail

Objetivos disponiveis:

- Emagrecer e reduzir medidas
- Melhorar gluteos e firmeza corporal
- Recuperar autoestima
- Voltar a usar roupas antigas

Tambem coleta rastreamento tecnico:

- URL da landing
- path
- query string
- referrer
- user agent
- timezone
- parametros `utm_*`
- `fbclid`, `gclid`, `ttclid`, `src`, `source`, `ref`
- URL final de checkout com tracking

Nao coleta idade.

### 1.5 Existe botao de CTA? Qual e o texto exato?

Sim. CTAs existentes na landing:

- `Entrar agora`
- `Quero entrar no desafio`
- `Ver o protocolo`
- `Garantir minha vaga`
- `Garantir minha vaga agora`
- `Quero fazer parte`

Pagina `/bio`:

- `Garantir minha vaga no TRINCA RV21`
- `Falar com a equipe RV`
- `Ver como funciona`

### 1.6 Existe social proof na pagina?

Sim.

Elementos de prova social:

- `+5 mil mulheres impactadas pela estrutura RV`
- Galeria de resultados reais com imagens antes/depois em `public/images/antesdepo*.jpg`
- Texto de autoridade de Ruria Virginio:
  - `14 anos de experiencia`
  - `Transformacoes reais em +10 paises`
  - `Sistematizacao online de treinos reais e individualizados`
  - `Criador e idealizador do protocolo TRINCA RV21`

### 1.7 A pagina e responsiva?

Sim. A landing foi ajustada para desktop e celular. Ha imagem especifica para mobile no hero: `/images/ruria-rosto-premium.png`.

Status: PRONTO, mas deve continuar sendo testado em celular real antes de qualquer campanha de trafego.

### 1.8 Texto completo da landing principal

Textos principais renderizados:

Header:

- `TRINCA RV21`
- `Protocolo`
- `Resultados`
- `Oferta`
- `Duvidas`
- `Entrar agora`

Hero:

- `Desafio feminino oficial RV`
- `TRINCA RV21`
- `21 dias para sair do ciclo de comecar e desistir, recuperar disciplina e voltar a se sentir bonita, confiante e confortavel no proprio corpo.`
- `Quero entrar no desafio`
- `Ver o protocolo`
- `+5 mil mulheres impactadas pela estrutura RV`
- `Pagamento seguro via Kiwify`
- `Inscricao segura`
- `Boas-vindas individual`
- `Grupo no final da sequencia`

Resumo da oferta:

- `Sua decisao pelos proximos 21 dias`
- `8x de R$ 4,74`
- `R$ 37,89 a vista`
- `Parcelamento sujeito a acrescimos da Kiwify.`
- `Treinos direcionados para 21 dias`
- `Dieta especifica por objetivo`
- `Grupo exclusivo com direcionamento`
- `Check-ins para manter constancia`
- `Ebook RV e Ebook Nutricional`
- `Cupom TRINCA PREMIUM50% pos-desafio`
- `Garantir minha vaga`

Secao dor/identificacao:

- `Voce nao esta sem forca`
- `Talvez voce so esteja cansada de tentar sozinha.`
- `O TRINCA RV21 foi criado para mulheres que precisam de direcao, clareza e um ambiente que sustente a decisao ate o final.`
- `Voce comeca animada, mas perde ritmo quando a rotina aperta.`
- `Sente que precisa emagrecer, desinchar e voltar a gostar das fotos.`
- `Ja tentou sozinha, mas faltou direcao, cobranca e suporte real.`
- `Quer resultado, mas nao quer um plano impossivel de seguir.`

Secao clareza:

- `Decisao com clareza`
- `O TRINCA RV21 e para mulheres que querem estrutura, nao promessa vazia.`
- `A proposta e simples: durante 21 dias, voce entra em uma rotina guiada com treino, alimentacao, materiais e um ambiente que ajuda a sustentar a decisao.`
- `Faz sentido para voce se...`
- `Quer viver 21 dias com direcao em vez de improvisar mais uma tentativa.`
- `Esta disposta a seguir treino, alimentacao e check-ins com constancia real.`
- `Quer entrar em um ambiente acompanhado, organizado e com comunicacao clara.`
- `Importante saber antes de entrar`
- `Nao e uma promessa magica, rapida ou sem esforco.`
- `Nao substitui acompanhamento medico quando houver necessidade clinica.`
- `Nao combina com quem quer apenas entrar no grupo sem viver a sequencia.`

Autoridade:

- `Por tras do protocolo`
- `Ruria Virginio`
- `Criador e idealizador do TRINCA RV21, Ruria Virginio reune 14 anos de experiencia conduzindo mulheres a reconstruirem autoestima, condicionamento, disciplina e confianca com estrategia, acompanhamento e constancia.`
- `O protocolo nasce da vivencia pratica com transformacoes reais em mais de 10 paises, unindo treino, direcionamento e uma experiencia online organizada para que a participante saiba exatamente o que fazer nos proximos 21 dias.`

Metodo:

- `A estrutura do desafio`
- `O que voce recebe dentro do TRINCA RV21`
- `Um processo enxuto, intenso e possivel de seguir. Nao e so sobre perder peso: e sobre voltar a agir por voce.`
- `Treino RV`
- `Protocolos objetivos para colocar seu corpo em movimento com foco em emagrecimento, definicao e condicionamento.`
- `Alimentacao guiada`
- `Dieta especifica para cada participante conforme o objetivo selecionado, elaborada por nutricionista conceituada.`
- `Grupo oficial`
- `Ambiente de acompanhamento para voce nao se sentir sozinha e manter compromisso durante o desafio.`
- `Check-ins`
- `Pontos de controle para acompanhar evolucao, ajustar comportamento e manter a constancia.`
- `Materiais de apoio`
- `Ebook RV, Ebook Nutricional e ferramentas para fortalecer disciplina, rotina e consciencia alimentar.`
- `Pos-desafio`
- `Ao finalizar, voce recebe o cupom TRINCA PREMIUM50% para continuar sua evolucao dentro da sistematizacao online RV.`

Jornada:

- `Jornada organizada`
- `Do cadastro ao grupo oficial, cada etapa tem funcao.`
- `A experiencia foi desenhada para acompanhar sua decisao desde a inscricao ate a entrada no grupo, com orientacao clara, retomada quando necessario e uma recepcao cuidadosa apos a confirmacao.`
- `Inscricao: Voce preenche seus dados e segue para finalizar sua entrada com pagamento seguro.`
- `Aprovacao: Com o pagamento aprovado, sua entrada e marcada e a jornada de boas-vindas comeca.`
- `Entrada guiada: Voce confirma que esta pronta, recebe o video de boas-vindas e so entao segue para orientacoes, materiais, dieta e ebooks.`
- `Grupo oficial: O link do grupo chega apenas no final da sequencia individual, depois do video de boas-vindas ao ambiente oficial.`

Experiencia premium:

- `Experiencia premium por dentro`
- `Depois da compra, nada chega fora de ordem.`
- `A entrada no TRINCA RV21 foi desenhada para reduzir ansiedade e aumentar adesao. Cada mensagem tem uma funcao: confirmar, orientar, entregar e so entao abrir o ambiente oficial.`
- `Fluxo protegido`
- `2 cliques de confirmacao`
- `Antes dos videos e antes do grupo, a aluna confirma que esta pronta. Isso mantem a experiencia humana, organizada e segura.`
- `Confirmacao sem ansiedade`
- `A compra aprovada nao vira um envio frio. Voce recebe uma confirmacao clara e so avanca quando toca em Estou pronta.`
- `Boas-vindas antes dos materiais`
- `O video inicial apresenta o compromisso dos 21 dias antes da entrega das orientacoes, dieta, ebooks e arquivos do desafio.`
- `Grupo no momento certo`
- `O grupo oficial e liberado depois da sequencia individual, para proteger a ordem, o acolhimento e a experiencia das alunas.`

Resultados:

- `Resultados reais`
- `Mulheres reais, historias reais e uma decisao em comum.`
- `Resultados reais elevam confianca e mostram que a transformacao e possivel quando existe protocolo, acompanhamento e compromisso.`
- `As imagens representam trajetorias reais compartilhadas com a estrutura RV. Resultados variam conforme rotina, execucao, alimentacao, contexto individual e constancia.`

Oferta:

- `Inscricoes abertas`
- `Entre para o TRINCA RV21`
- `Um investimento acessivel para transformar tentativa em direcao, rotina em constancia e esforco em resultado visivel.`
- `Investimento de entrada no desafio`
- `8x de R$ 4,74`
- `R$ 37,89 a vista. Parcelamento sujeito a acrescimos da Kiwify.`
- `Dieta especifica para seu objetivo, elaborada por nutricionista`
- `Ebook RV para mentalidade e constancia`
- `Ebook Nutricional para melhorar escolhas`
- `Cupom TRINCA PREMIUM50% liberado no pos-desafio`
- `O que acontece depois que voce entra`
- `Voce preenche a inscricao e segue para o checkout seguro.`
- `Apos a aprovacao, recebe confirmacao e video de boas-vindas.`
- `Em seguida chegam orientacoes, materiais, dieta e ebooks.`
- `O link do grupo oficial e liberado no final da sequencia.`

Formulario:

- `Inscricao rapida`
- `Preencha para garantir sua entrada no desafio.`
- `Seus dados permitem acompanhar sua inscricao, orientar os proximos passos e retomar sua decisao caso voce pare antes de finalizar.`
- `Nome completo`
- `Melhor e-mail`
- `WhatsApp com DDD`
- `Principal objetivo`
- `Autorizo receber mensagens sobre minha inscricao, pagamento, orientacoes do TRINCA RV21 e proximos passos pelo WhatsApp e e-mail.`
- `Garantir minha vaga agora`
- `Depois da aprovacao, voce recebe a sequencia individual de boas-vindas, materiais e so entao o link do grupo oficial.`

Depois da compra:

- `Depois da compra`
- `O pagamento aprovado abre uma experiencia de entrada completa.`
- `Confirmacao da inscricao`
- `Assim que o pagamento for aprovado, a aluna recebe a confirmacao de entrada e os proximos passos do desafio.`
- `Apresentacao do protocolo`
- `Um video de boas-vindas do criador e idealizador do TRINCA RV21, Ruria Virginio, explicando a proposta, o compromisso dos 21 dias e como aproveitar melhor a jornada.`
- `Dieta especifica e ebooks`
- `Dieta direcionada ao objetivo da participante, elaborada por nutricionista, alem dos materiais de apoio.`
- `Cupom pos-desafio`
- `Liberacao do TRINCA PREMIUM50% apenas apos a finalizacao.`

FAQ:

- `O desafio e para iniciantes? Sim. O desafio atende iniciantes e tambem mulheres em nivel moderado ou avancado, porque a estrutura da direcao conforme o objetivo e a realidade de cada participante.`
- `Preciso treinar em academia? O ideal e ter acesso a academia, mas a orientacao pode ser adaptada conforme sua realidade e nivel.`
- `A dieta e igual para todo mundo? Nao. A proposta e direcionar uma dieta especifica conforme o objetivo escolhido pela participante, com elaboracao de nutricionista conceituada.`
- `O valor parcelado tem juros? Sim. O valor a vista e R$ 37,89 e a entrada pode ser parcelada em ate 8x no cartao. O parcelamento esta sujeito a acrescimos da Kiwify.`
- `Quando recebo os materiais? Apos a aprovacao do pagamento, voce entra no fluxo de boas-vindas e recebe os materiais do desafio.`
- `O grupo e liberado antes do pagamento? Nao. O grupo oficial e enviado apenas apos o pagamento aprovado e depois da sequencia individual de boas-vindas, para manter a organizacao e proteger a experiencia das alunas.`
- `O cupom de 50% pode ser usado quando? O cupom TRINCA PREMIUM50% e pensado para o pos-desafio, como incentivo para continuar evoluindo dentro da sistematizacao online RV.`
- `E se eu comecar e perder o ritmo? A estrutura do desafio existe justamente para reduzir desistencia: grupo, check-ins, mensagens de acompanhamento e uma rotina clara para voce voltar para o processo rapidamente.`

CTA final:

- `Voce pode continuar adiando sua transformacao ou comecar agora.`
- `O TRINCA RV21 foi criado para mulheres que decidiram parar de se abandonar e voltar a agir com direcao.`
- `Quero fazer parte`

Footer:

- `TRINCA RV21`
- `Desafio feminino oficial da sistematizacao online RV.`
- `© 2026 Ruria Virginio. Todos os direitos reservados.`

## PARTE 2: CHECKOUT / PAGAMENTO

### 2.1 Qual plataforma de pagamento esta integrada?

Kiwify.

### 2.2 Qual e o preco configurado?

Preco exibido na landing:

- `8x de R$ 4,74`
- `R$ 37,89 a vista`

O preco real final dentro do checkout Kiwify precisa ser confirmado na Kiwify. Pelo codigo, a landing apenas exibe o preco e redireciona para a URL configurada em `NEXT_PUBLIC_KIWIFY_CHECKOUT_URL`.

### 2.3 Quais formas de pagamento estao ativas?

NÃO SEI com certeza, pois isso e configurado dentro da Kiwify.

O codigo contempla eventos e mensagens para:

- Cartao aprovado/recusado
- Pix gerado/pendente
- Boleto gerado/pendente
- Carrinho abandonado

### 2.4 Existe pagina de checkout separada ou embutida?

Existe checkout separado na Kiwify. Nao e checkout embutido na landing.

### 2.5 Qual e a URL do checkout?

A URL e definida por variavel de ambiente `NEXT_PUBLIC_KIWIFY_CHECKOUT_URL`.

Fallback tecnico encontrado no codigo: `https://pay.kiwify.com.br/mEhmYNt`.

### 2.6 Existe order bump ou upsell configurado?

NÃO SEI. Isso fica dentro da Kiwify e nao aparece no codigo local.

### 2.7 O que acontece exatamente quando o pagamento e aprovado?

Dentro do sistema TRINCA RV21:

1. A Kiwify envia evento para `/api/kiwify/webhook`.
2. O sistema valida o token do webhook.
3. O evento e normalizado como `compra-aprovada`.
4. A lead e atualizada no Supabase.
5. Mensagens de recuperacao anteriores sao canceladas.
6. Uma fila pos-compra e criada em `automation_messages`.
7. A primeira mensagem do WhatsApp e liberada imediatamente: `compra-confirmada`.
8. O fluxo so avanca depois do clique correto da lead.

Dentro da Kiwify:

- A Kiwify pode disparar e-mail proprio de confirmacao.
- A Kiwify pode direcionar para area/pagina propria de senha, aulas ou templates.
- Isso e externo ao codigo local. Se essa pagina estiver em branco, o ajuste deve ser feito na configuracao do produto dentro da Kiwify.

### 2.8 Existe webhook configurado?

Sim.

Endpoint do projeto:

- `/api/kiwify/webhook`

URL publica esperada:

- `https://trinca-rv21.vercel.app/api/kiwify/webhook?token=...`

Token omitido por seguranca.

### 2.9 Texto completo da pagina de checkout

NÃO SEI. O checkout pertence a Kiwify e nao esta no codigo local.

## PARTE 3: EMAILS / SEQUENCES

### 3.1 Quantas sequences de email existem no total?

NÃO EXISTE sequence de email propria no codigo do projeto.

### 3.2 Para cada sequence

NÃO EXISTE.

Nao ha:

- assunto de e-mail configurado no codigo
- corpo de e-mail configurado no codigo
- provedor de e-mail integrado no codigo
- delay de e-mail configurado no codigo

### 3.3 Existe email de:

- Boas-vindas: NÃO EXISTE no codigo local.
- Confirmacao de compra: NÃO EXISTE no codigo local. Pode existir e-mail automatico da Kiwify, mas NAO SEI.
- Abandono de carrinho: NÃO EXISTE via e-mail no codigo local.
- Lembrete: NÃO EXISTE via e-mail no codigo local.
- Upsell: NÃO EXISTE via e-mail no codigo local.
- Reengajamento: NÃO EXISTE via e-mail no codigo local.

O projeto usa WhatsApp/Twilio como principal canal operacional.

## PARTE 4: VIDEOS

### 4.1 Quantos videos existem no projeto?

Existem 3 videos no projeto.

### 4.2 Videos existentes

1. Video de boas-vindas pos-compra
   - Arquivo: `public/media/01-boas-vindas-pos-compra.mp4`
   - Duracao aproximada tecnica: 65 segundos
   - Tamanho: 14 MB
   - Hospedagem: arquivo publico dentro da aplicacao Vercel
   - Proposito: receber a aluna apos compra confirmada
   - Disparo: depois da compra aprovada e depois do clique `Estou pronta`
   - URL publica esperada: `https://trinca-rv21.vercel.app/media/01-boas-vindas-pos-compra.mp4`

2. Video de recuperacao de abandono
   - Arquivo: `public/media/02-recuperacao-abandono.mp4`
   - Duracao aproximada tecnica: 37 segundos
   - Tamanho: 12 MB
   - Hospedagem: arquivo publico dentro da aplicacao Vercel
   - Proposito: recuperacao de lead/pagamento/carrinho
   - Disparo: em fluxos de abandono, pagamento pendente ou pagamento recusado quando configurado para enviar media
   - URL publica esperada: `https://trinca-rv21.vercel.app/media/02-recuperacao-abandono.mp4`

3. Video de boas-vindas ao grupo oficial
   - Arquivo: `public/media/03-grupo-oficial.mp4`
   - Duracao aproximada tecnica: 61 segundos
   - Tamanho: 13 MB
   - Hospedagem: arquivo publico dentro da aplicacao Vercel
   - Proposito: orientar a lead antes de entrar no grupo oficial
   - Disparo: depois da mensagem `grupo-oficial-preparacao` e depois do clique `Assistir boas-vindas`
   - URL publica esperada: `https://trinca-rv21.vercel.app/media/03-grupo-oficial.mp4`

## PARTE 5: AUTOMACAO / WORKFLOWS

### 5.1 Quantos workflows de automacao existem?

Existem 5 workflows principais:

1. Captacao de lead da landing para Supabase.
2. Pos-compra aprovada Kiwify para WhatsApp/Twilio.
3. Recuperacao de pagamento recusado.
4. Recuperacao de carrinho abandonado.
5. Recuperacao de formulario preenchido sem evento Kiwify.

Tambem existem rotinas auxiliares:

- Sincronizacao de inbound Twilio.
- Motor de disparo de mensagens pendentes.
- Painel operacional.
- Teste controlado de fluxo.

### 5.2 Workflows detalhados

#### Workflow 1: Captacao de lead

Trigger:

- Lead preenche formulario na landing e envia.

Acoes:

1. Captura nome, e-mail, WhatsApp, objetivo e tracking.
2. Envia POST para `/api/leads`.
3. Verifica lead existente por e-mail.
4. Se nao encontrar por e-mail, verifica por WhatsApp.
5. Insere ou atualiza lead no Supabase.
6. Marca status como `checkout-iniciado`.
7. Redireciona para checkout Kiwify.

Condicoes:

- Se faltar nome, email, WhatsApp ou objetivo, retorna erro.
- Se Supabase nao estiver configurado, retorna erro.
- Se o cadastro falhar, mostra erro e sugere continuar pelo WhatsApp.

Integracoes:

- Landing Next.js
- Supabase
- Kiwify checkout

#### Workflow 2: Pos-compra aprovada

Trigger:

- Evento Kiwify reconhecido como compra aprovada.

Acoes em ordem:

1. Cria mensagem `compra-confirmada`, delay 0.
2. Cria gate interno `clique-compra-confirmada-estou-pronta`.
3. Aguarda clique da lead no botao `Estou pronta`.
4. Depois do clique, envia `boas-vindas-video`, delay 0.
5. Depois do video, envia `materiais-desafio`, com delay de 2 minutos apos a etapa anterior.
6. Depois dos materiais, envia `grupo-oficial-preparacao`, com delay de 2 minutos apos materiais e delay inicial de 4 minutos.
7. Cria gate interno `clique-grupo-assistir-boas-vindas`.
8. Aguarda clique da lead no botao `Assistir boas-vindas`.
9. Depois do clique, envia `grupo-oficial-final`, com video do grupo.
10. Depois do video do grupo, envia `grupo-oficial-link`, com delay de 1 minuto apos o video final.

Condicoes:

- `boas-vindas-video` exige `compra-confirmada` + `clique-compra-confirmada-estou-pronta`.
- `materiais-desafio` exige `boas-vindas-video`.
- `grupo-oficial-preparacao` exige `materiais-desafio`.
- `grupo-oficial-final` exige `clique-grupo-assistir-boas-vindas`.
- `grupo-oficial-link` exige `grupo-oficial-final`.
- O sistema envia apenas uma proxima etapa imediata por clique para evitar disparo em massa.
- Mensagens sao marcadas como `processando` antes do envio para reduzir duplicidade.

Integracoes:

- Kiwify
- Supabase
- Twilio WhatsApp
- Vercel

#### Workflow 3: Pagamento recusado

Trigger:

- Evento Kiwify normalizado como `compra-recusada`.

Acoes:

1. `pagamento-recusado-5min`: delay 5 minutos.
2. `pagamento-recusado-2h`: delay 120 minutos.

Condicoes:

- Caso uma compra seja aprovada depois, essas etapas devem ser canceladas.

Integracoes:

- Kiwify
- Supabase
- Twilio WhatsApp

#### Workflow 4: Carrinho abandonado

Trigger:

- Evento Kiwify normalizado como `carrinho-abandonado`.

Acoes:

1. `carrinho-abandonado-15min`: delay 15 minutos.
2. `carrinho-abandonado-6h`: delay 360 minutos.
3. `carrinho-abandonado-24h`: delay 1440 minutos.

Condicoes:

- Caso uma compra seja aprovada depois, essas etapas devem ser canceladas.

Integracoes:

- Kiwify
- Supabase
- Twilio WhatsApp

#### Workflow 5: Formulario preenchido sem evento Kiwify

Trigger:

- Lead entrou na landing, preencheu formulario, foi para checkout, mas nao houve evento Kiwify dentro do periodo minimo configurado.

Acoes:

1. `lead-formulario-abandonado-5min`: delay 5 minutos.
2. `lead-formulario-abandonado-2h`: delay 120 minutos.
3. `lead-formulario-abandonado-24h`: delay 1440 minutos.

Condicoes:

- Se ja existir evento Kiwify para o e-mail, nao cria recuperacao.
- Se ja existir fila de recuperacao para o e-mail, nao duplica.

Integracoes:

- Supabase
- Twilio WhatsApp
- Kiwify checkout

### 5.3 Existe automacao de:

- Captura de lead: SIM.
- Nutricao de lead por e-mail: NÃO EXISTE.
- Nutricao/retomada por WhatsApp: SIM.
- Abandono de carrinho: SIM.
- Pos-compra/onboarding: SIM.
- Reengajamento: PARCIALMENTE. Existe recuperacao de abandono, mas nao existe ciclo longo de reengajamento depois do desafio.

## PARTE 6: INTEGRACOES TECNICAS

### 6.1 Quais plataformas estao integradas?

Integracoes existentes:

- Landing Next.js -> API `/api/leads` -> Supabase
- Landing Next.js -> Checkout Kiwify
- Kiwify -> Webhook `/api/kiwify/webhook` -> Supabase
- Supabase -> Motor de automacao `/api/automation/dispatch`
- Motor de automacao -> Twilio WhatsApp
- Twilio WhatsApp -> Webhook inbound `/api/twilio/webhook`
- Twilio inbound -> Supabase `twilio_interactions`
- Painel operacional `/operacao` -> APIs internas -> Supabase
- Vercel cron/manual -> `/api/automation/run`

### 6.2 Existe Meta Pixel instalado?

NÃO EXISTE no codigo atual.

Pixel ID: NÃO EXISTE.  
Paginas instaladas: NÃO EXISTE.  
Eventos PageView/Lead/Purchase/AddToCart: NÃO EXISTE.

### 6.3 Existe Conversions API?

NÃO EXISTE no codigo atual.

### 6.4 Existe Google Analytics?

NÃO EXISTE no codigo atual.

GA4 ou Universal: NÃO EXISTE.

### 6.5 Existe CRM integrado?

PARCIALMENTE.

Nao ha CRM comercial como HubSpot, Pipedrive ou RD Station.  
O Supabase esta funcionando como banco operacional/CRM tecnico do projeto.

### 6.6 Existe integracao com WhatsApp?

Sim.

Funcionamento:

1. O sistema cria mensagens pendentes em `automation_messages`.
2. O motor de automacao verifica delays, status e pre-requisitos.
3. A funcao `sendTwilioMessage` envia mensagem pelo Twilio.
4. O modo padrao e `content`, usando templates oficiais Twilio/WhatsApp.
5. Se `TWILIO_SEND_MEDIA=true`, o sistema tambem envia midias diretas: videos e PDFs.
6. Cliques em botoes voltam pelo webhook Twilio.
7. O webhook reconhece os botoes `Estou pronta` e `Assistir boas-vindas`.
8. Ao reconhecer o clique, o sistema conclui o gate interno e libera a proxima etapa.

## PARTE 7: CONTEUDO / PRODUTO

### 7.1 O produto TRINCA RV21 esta pronto para entrega?

PARCIALMENTE.

O fluxo operacional principal esta construido. Conteudos principais ja existem como arquivos. A area de membros interna ainda esta parcial.

### 7.2 Se parcialmente, o que falta?

Falta ou precisa validacao final:

- Teste real final ponta a ponta apos ajustes de Twilio e Kiwify.
- Confirmar que todos os templates Twilio estao aprovados e com Content SID correto.
- Confirmar que `TWILIO_SEND_MEDIA=true` esta ativo em producao.
- Confirmar que as URLs publicas dos videos e PDFs estao salvas nas variaveis de ambiente de producao.
- Configurar nome e foto do perfil WhatsApp do projeto.
- Ajustar na Kiwify o redirecionamento/area de obrigado para nao mostrar area em branco de aulas/templates se isso nao fizer parte da entrega.
- Inserir ou finalizar treino oficial dentro da entrega.
- Conectar dominio proprio, se a estrategia final nao for usar `trinca-rv21.vercel.app`.
- Instalar rastreamento de trafego quando iniciar etapa Meta/Instagram.

### 7.3 Onde o conteudo do curso esta hospedado?

Arquivos atuais estao hospedados dentro do proprio projeto, em `public/`, servido pela Vercel:

- Videos: `public/media`
- PDFs: `public/materials`

A Kiwify tambem pode ter area de membros propria, mas isso e externo ao codigo local. NAO SEI a configuracao final dentro da Kiwify.

### 7.4 Quantos modulos/aulas existem?

Na area interna `/aluna`, existem 3 secoes estruturais:

- Orientacoes iniciais
- Materiais do desafio
- Dieta e treino

Nao existem aulas completas em formato de curso tradicional dentro do codigo. A entrega principal foi desenhada para WhatsApp + materiais + grupo.

### 7.5 Como a aluna recebe acesso apos compra?

Fluxo planejado:

1. Pagamento aprovado na Kiwify.
2. WhatsApp recebe confirmacao com botao `Estou pronta`.
3. Lead clica.
4. Recebe video pos-compra.
5. Recebe materiais principais:
   - dieta correspondente ao objetivo
   - Ebook RV
   - Ebook Nutricional
6. Recebe mensagem de preparacao para grupo com botao `Assistir boas-vindas`.
7. Lead clica.
8. Recebe video de boas-vindas ao grupo.
9. Recebe link final do grupo oficial.

### 7.6 Existe area de membros?

SIM, mas PARCIAL.

Plataforma:

- Area propria em Next.js: `/aluna`
- Possivel area Kiwify: NAO SEI/configuracao externa.

URL:

- `https://trinca-rv21.vercel.app/aluna`

Status:

- Estrutura visual e paginas existem.
- Alguns textos ainda dizem que arquivos finais/treinos estao em preparacao.
- PDFs das dietas ja estao linkados na secao dieta/treino.

## PARTE 8: DOMINIO / INFRAESTRUTURA

### 8.1 Existe dominio proprio?

NÃO SEI.

O usuario informou que possui dominio criado via WordPress.org, mas a leitura do codigo nao confirma dominio proprio conectado.

URL publica atual confirmada:

- `https://trinca-rv21.vercel.app`

### 8.2 Existe hospedagem?

Sim.

Hospedagem:

- Vercel

Framework:

- Next.js 16

Banco:

- Supabase

### 8.3 Existe SSL ativo?

Sim para a URL Vercel:

- `https://trinca-rv21.vercel.app`

SSL do dominio proprio: NÃO SEI.

## PARTE 9: STATUS GERAL

### 9.1 Tudo que esta 100% pronto para lancamento

Pronto ou operacional em nivel de codigo:

- Landing principal em Next.js.
- Layout responsivo desktop/mobile.
- Formulario de captacao com nome, e-mail, WhatsApp e 4 objetivos.
- Captura de UTMs e parametros de origem.
- API de leads com upsert por e-mail/WhatsApp.
- Integracao Kiwify webhook.
- Normalizacao de eventos Kiwify.
- Fila de mensagens no Supabase.
- Fluxo pos-compra protegido por 2 cliques.
- Reconhecimento dos botoes `Estou pronta` e `Assistir boas-vindas`.
- Correcao de variacao de telefone brasileiro com/sem nono digito.
- Envio Twilio por templates/content.
- Envio de videos/PDFs via Twilio quando midia esta habilitada.
- 3 videos carregados no projeto.
- 4 PDFs de dieta carregados.
- Ebook RV carregado.
- Ebook Nutricional carregado.
- Painel operacional `/operacao`.
- Painel mostra leads, status, pagamento, mensagens, erros, cliques pendentes e progresso.
- Rotas de teste/simulacao/controladas.
- Imagens de perfil WhatsApp preparadas em `public/images`.
- Pagina `/bio`.
- Pagina `/obrigado`.
- Area `/aluna` estrutural.

### 9.2 Tudo que esta incompleto e o que falta

INCOMPLETO:

- Configuracao final do perfil WhatsApp: falta aplicar nome/foto no Twilio/Meta.
- Kiwify pos-compra: falta ajustar redirecionamento/area em branco de aulas/templates, se isso nao for parte da entrega.
- Teste real final: falta executar novamente depois das correcoes.
- Templates Twilio: precisam estar todos aprovados e conectados aos Content SIDs corretos em producao.
- Tracking de trafego: falta Meta Pixel, CAPI, GA4 e eventos de funil.
- Dominio proprio: falta confirmar/conectar se sera usado.
- Treinos oficiais: area ainda indica espaco reservado.
- Area de membros: existe, mas ainda nao e o centro principal de entrega final.
- Monitoramento de alto volume: painel existe, mas nao ha fila dedicada tipo Upstash/Redis/SQS; hoje depende de Supabase + rotas Vercel + Twilio.

### 9.3 Tudo que nao existe e precisa ser criado

NÃO EXISTE atualmente:

- Sequencia de e-mail propria.
- Meta Pixel.
- Conversions API.
- Google Analytics.
- Eventos de funil para Ads.
- Dashboard separado de trafego/acessos da landing.
- CRM comercial externo.
- Automacao Instagram Direct.
- Automacao de comentarios/feed/story.
- Sistema de afiliadas/indicacoes.
- Upsell/order bump confirmado no codigo.
- Reengajamento longo pos-desafio.

### 9.4 Maior risco tecnico para o lancamento

Maior risco tecnico: sincronizacao real entre Kiwify, Twilio e o motor de automacao durante trafego real.

Motivo:

- O fluxo depende de webhooks externos.
- Depende de templates WhatsApp aprovados.
- Depende de inbound Twilio funcionando corretamente.
- Depende de midias publicas acessiveis.
- Depende de delays e gates respeitados.
- Se qualquer variavel de ambiente de producao estiver incorreta, a lead pode parar no meio do fluxo.

Segundo maior risco:

- A Kiwify direcionar a compradora para uma area em branco/confusa de aulas/templates, causando quebra de percepcao premium.

Terceiro maior risco:

- Falta de rastreamento Meta/GA/CAPI antes do trafego pago, o que dificulta leitura de conversao real.

### 9.5 Existe algo quebrado que precisa ser consertado?

Nao identifiquei quebra evidente no codigo lido agora, mas existem pendencias criticas de validacao externa:

- Confirmar em producao que o botao `Estou pronta` aciona o webhook Twilio e envia apenas o video pos-compra.
- Confirmar que o botao `Assistir boas-vindas` envia apenas o video do grupo.
- Confirmar que o link do grupo chega depois do video do grupo.
- Confirmar que o painel exibe erro se o Twilio falhar.
- Confirmar que `TWILIO_SEND_MEDIA=true` esta ativo.
- Confirmar que todos os Content SIDs Twilio usados pelos templates estao corretos.
- Confirmar configuracao da Kiwify para nao mandar a lead para pagina confusa/incompleta.

### 9.6 Nivel de prontidao geral do projeto para lancamento

Prontidao tecnica estimada: 78%.

Motivo da nota:

- A arquitetura principal esta montada.
- Landing, captacao, Kiwify, Supabase, Twilio, materiais, videos e painel ja existem.
- O fluxo pos-compra ja foi protegido por cliques e tem controle de ordem.
- Ainda falta validacao real final, personalizacao WhatsApp, ajuste Kiwify pos-compra, rastreamento de trafego e decisao de dominio.

Para lancamento com trafego pago em escala, a recomendacao e nao iniciar antes de:

1. Fazer um teste real completo com uma nova lead limpa.
2. Confirmar cada disparo no WhatsApp em ordem.
3. Confirmar que painel acusa erros e status em tempo real.
4. Ajustar a experiencia Kiwify pos-pagamento.
5. Personalizar WhatsApp com nome e foto do projeto.
6. Instalar rastreamento Meta/GA/CAPI antes de trafego.

## RESUMO EXECUTIVO PARA CLAUDE/API

O TRINCA RV21 ja possui uma base operacional robusta em codigo proprio: landing, captacao, Kiwify webhook, Supabase como banco operacional, Twilio WhatsApp como canal principal, fluxo pos-compra com gates por clique, videos, PDFs, ebooks e painel de acompanhamento.

O projeto ainda nao deve ser tratado como 100% pronto para escala maxima, porque faltam validacoes externas e camadas de mensuracao. A maior prioridade antes de trafego e estabilizar a experiencia real ponta a ponta:

- pagamento aprovado
- mensagem de confirmacao
- clique `Estou pronta`
- video pos-compra
- materiais e dieta correta
- mensagem do grupo
- clique `Assistir boas-vindas`
- video do grupo
- link final do grupo
- painel refletindo cada etapa sem atraso relevante

O produto esta em fase final operacional, com maturidade tecnica boa, mas ainda precisa de acabamento de lancamento: perfil WhatsApp, Kiwify pos-compra, tracking de trafego e teste real completo.
