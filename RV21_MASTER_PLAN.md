# RV21 Master Plan

Este e o cerebro operacional do projeto TRINCA RV21. Antes de alterar landing, automacao, banco de dados, mensagens, design, copy, Instagram ou funil, consulte este arquivo e os documentos conectados.

## Objetivo do projeto

Construir um funil premium de vendas para o TRINCA RV21, com foco em conversao, clareza, confianca, automacao precisa e experiencia de alto valor percebido.

O projeto nao deve parecer improvisado, generico, amador, frio ou "feito em ferramenta pronta". Deve transmitir metodo, autoridade, cuidado, seguranca e direcao.

## Documentos base

- `RV21_VISION.md`: marca, promessa, percepcao e experiencia.
- `.cursor/rules.md`: regras de comportamento tecnico para desenvolvimento.
- `DESIGN_SYSTEM_RV.md`: direcao visual, UX/UI e padrao premium.
- `CONVERSION_GUIDE.md`: CRO, copy, funil, CTAs e decisao de venda.
- `docs/funil-trinca-rv21.md`: fluxo tecnico e operacional.
- `docs/mensagens-recuperacao.md`: mensagens de recuperacao e pos-compra.
- `docs/whatsapp-api-templates.md`: templates para WhatsApp API.
- `docs/roteiros-videos-trinca-rv21.md`: roteiros dos videos.
- `references/`: biblioteca visual e estrategica.

## Principios inegociaveis

1. Toda decisao deve proteger conversao.
2. Toda automacao deve preservar ordem, contexto e seguranca.
3. Toda tela deve reduzir duvida e aumentar confianca.
4. Toda mensagem deve parecer humana, intencional e alinhada ao Ruria.
5. Nada deve antecipar o grupo oficial antes da sequencia pos-compra.
6. Nenhuma acao deve quebrar dados, leads, rastreio ou historico.
7. Nenhuma mudanca visual deve parecer Canva, template barato ou pagina generica.
8. Toda entrega deve ser validada por lint/build quando houver codigo.

## Fluxo principal

1. Lead chega por Instagram, trafego, story, feed, direct ou bio.
2. Lead entra na landing.
3. Landing comunica promessa, autoridade, prova, metodo, oferta e decisao.
4. Lead preenche nome, email, WhatsApp e objetivo.
5. API salva lead no Supabase.
6. Lead vai ao checkout Kiwify.
7. Kiwify envia eventos ao webhook.
8. Sistema normaliza status e cria mensagens na fila.
9. Make/n8n busca mensagens pendentes.
10. WhatsApp API envia mensagens individuais.
11. Sistema marca envio como enviado, erro ou cancelado.
12. Compra aprovada cancela recuperacoes.
13. Sequencia pos-compra entrega boas-vindas, video, orientacoes, materiais, dieta, ebooks e so depois o grupo oficial.

## Sequencia pos-compra oficial

1. Mensagem de confirmacao e seguranca.
2. Botao: `Estou pronta para receber o Boas-vindas ao TRINCA RV21`.
3. Envio automatico do video de boas-vindas.
4. Mensagem humana pos-video.
5. Orientacoes iniciais.
6. Materiais do desafio.
7. Dieta, Ebook RV e Ebook Nutricional.
8. Video final de boas-vindas ao Grupo Oficial.
9. Link do Grupo Oficial TRINCA RV21.

## Estado tecnico atual

- Next.js 16 com React.
- Supabase para leads, eventos Kiwify e fila de mensagens.
- Kiwify como checkout.
- WhatsApp API ainda depende da liberacao Meta.
- Make/n8n sera a ponte operacional de envio.
- Landing e pagina de obrigado ja existem.
- API de leads, webhook Kiwify e fila de automacao ja existem.

## Lacunas prioritarias

1. Resolver numero pendente do WhatsApp API.
2. Criar e aprovar templates oficiais no WhatsApp Manager.
3. Fechar Make/n8n de ponta a ponta.
4. Inserir links finais de videos e materiais.
5. Implementar recuperacao de lead que preenche formulario e nao gera evento Kiwify.
6. Auditar landing com criterio CRO/UX premium.
7. Conectar estrategia Instagram, direct, comentarios, stories e trafego.

## Padrao de resposta do desenvolvedor

Ao receber uma tarefa relevante, agir como equipe:

- Desenvolvedor full stack senior.
- Especialista Next.js/React.
- Especialista UX/UI.
- Especialista CRO.
- Diretor de arte digital.
- Estrategista de funis de vendas.

Toda resposta tecnica deve considerar:

- Problema real.
- Impacto em conversao.
- Impacto em dados.
- Impacto em automacao.
- Risco de erro operacional.
- Como validar.

## Como decidir prioridades

Prioridade 1: qualquer falha que impeça venda, captura de lead, checkout, webhook, mensagem ou pos-compra.

Prioridade 2: qualquer ponto que reduza confianca, clareza, velocidade ou conversao.

Prioridade 3: polimento visual, copy, microinteracoes, fluidez e percepcao premium.

Prioridade 4: organizacao, documentacao, melhorias futuras e extensoes.

## Padrao de qualidade

Cada parte do projeto deve responder:

- Por que a lead deve confiar?
- Por que ela deve agir agora?
- O que ela ganha?
- O que ela perde se nao agir?
- Qual e o proximo passo mais simples?
- O que reduz ansiedade?
- O que aumenta valor percebido?

## Regra final

O TRINCA RV21 deve funcionar como uma maquina de vendas elegante, segura e humana. A automacao deve ser invisivel para a aluna, mas extremamente controlada por dentro.
