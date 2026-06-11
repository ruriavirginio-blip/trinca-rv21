# Templates WhatsApp API - TRINCA RV21

Estes modelos foram pensados para cadastro no WhatsApp Manager quando o numero API estiver aprovado. O objetivo e manter o tom do Ruria: direto, humano, firme, acolhedor e sem parecer mensagem fria.

## Regras de uso

- Use idioma `Portuguese (BR)` / `pt_BR`.
- Use nomes em minusculo, sem espacos e sem acentos.
- Evite promessas absolutas de resultado.
- Use botoes de acao sempre que possivel.
- Para recuperar pagamento ou carrinho, a lead ja deve ter deixado contato e consentimento no formulario ou no checkout.
- Para mensagens fora da janela de 24 horas, use sempre template aprovado.

## 1. Pagamento pendente

**Nome do template:** `trinca_pagamento_pendente`

**Categoria sugerida:** Utility

**Uso:** Pix gerado, boleto gerado ou pagamento criado sem confirmacao.

**Corpo:**

```text
Oi, {{1}}. Sua entrada no TRINCA RV21 ficou quase finalizada, mas o {{2}} ainda nao foi confirmado.

A estrutura dos 21 dias fica liberada depois da confirmacao: grupo oficial, orientacoes iniciais, dieta por objetivo e materiais do desafio.

Se essa decisao ainda faz sentido para voce, finalize sua entrada pelo botao abaixo.
```

**Variaveis:**

- `{{1}}`: primeiro nome da lead.
- `{{2}}`: metodo de pagamento (`Pix`, `boleto` ou `pagamento`).

**Botao URL:**

- Texto: `Finalizar entrada`
- URL: link do checkout Kiwify.

## 2. Pagamento recusado

**Nome do template:** `trinca_pagamento_recusado`

**Categoria sugerida:** Utility

**Uso:** Cartao recusado ou compra nao aprovada.

**Corpo:**

```text
Oi, {{1}}. Sua tentativa de entrada no TRINCA RV21 nao foi aprovada pela forma de pagamento.

Isso pode acontecer por limite, validacao do banco ou dados informados. Sua inscricao ainda pode ser concluida com uma nova tentativa ou outro metodo disponivel.

Toque no botao abaixo para retomar com calma.
```

**Variaveis:**

- `{{1}}`: primeiro nome da lead.

**Botao URL:**

- Texto: `Tentar novamente`
- URL: link do checkout Kiwify.

## 3. Retomada de inscricao

**Nome do template:** `trinca_retomada_inscricao`

**Categoria sugerida:** Marketing

**Uso:** Carrinho abandonado ou lead que iniciou e nao finalizou a inscricao.

**Corpo:**

```text
Oi, {{1}}. Sua inscricao no TRINCA RV21 ficou quase pronta, mas ainda nao foi finalizada.

Esse desafio foi criado para mulheres que querem viver 21 dias com direcao, treino, alimentacao, grupo oficial e acompanhamento para sair do improviso.

Se voce ainda quer entrar, sua retomada esta no botao abaixo.
```

**Variaveis:**

- `{{1}}`: primeiro nome da lead.

**Botao URL:**

- Texto: `Retomar inscricao`
- URL: link do checkout Kiwify.

## 4. Compra confirmada

**Nome do template:** `trinca_rv21_compra_confirmada`

**Content SID identificado:** `HX08f4184e637809935c6e541a54ca1c0e`

**Categoria sugerida:** Utility

**Uso:** primeira mensagem da sequencia pos-compra aprovada. Deve ter botao de resposta rapida para liberar o video de boas-vindas.

**Corpo:**

```text
Sua inscricao no TRINCA RV21 foi confirmada com sucesso pela equipe RV.

Para continuar, toque no botao abaixo e receba o video de boas-vindas.
```

**Botao Quick Reply:**

- Texto: `Estou pronta`
- Button ID/Payload: `compra_confirmada_estou_pronta`

## 5. Video de boas-vindas apos pagamento

**Nome do template:** `trinca_boas_vindas_video`

**Categoria sugerida:** Utility

**Uso:** enviado somente depois do clique `compra_confirmada_estou_pronta`.

**Corpo:**

```text
{{1}}, sua entrada no TRINCA RV21 foi confirmada. Seja bem-vinda ao desafio oficial.

Assista primeiro ao video de boas-vindas do criador e idealizador do TRINCA RV21, Ruria Virginio.
```

**Variaveis:**

- `{{1}}`: primeiro nome da aluna.

**Botao URL:**

- Texto: `Assistir video`
- URL: link do video de boas-vindas.

## 6. Orientacoes iniciais

**Nome do template:** `trinca_rv21_orientacoes_iniciais`

**Content SID identificado:** `HX23f2de44593d23156c67e901e82cefd`

**Categoria sugerida:** Utility

**Uso:** enviada depois do video de boas-vindas pos-compra.

**Corpo:**

```text
{{1}}, agora vamos organizar seus primeiros passos dentro do TRINCA RV21.

Leia as orientacoes iniciais com calma. Elas foram preparadas para que voce saiba exatamente como viver os proximos 21 dias com direcao, clareza e compromisso.
```

**Variaveis:**

- `{{1}}`: primeiro nome da aluna.

**Botao URL:**

- Texto: `Ver orientacoes`
- URL: link das orientacoes iniciais.

## 7. Materiais do desafio

**Nome do template:** `trinca_rv21_materiais_desafio`

**Content SID identificado:** `HXb4b62a94f3e79006249d09ac5cbfcd6`

**Categoria sugerida:** Utility

**Uso:** enviada depois das orientacoes iniciais.

**Corpo:**

```text
{{1}}, aqui estao os arquivos e materiais necessarios para acompanhar o TRINCA RV21.

Guarde este envio e acompanhe cada etapa na ordem, porque tudo foi pensado para manter sua experiencia organizada e segura.
```

**Variaveis:**

- `{{1}}`: primeiro nome da aluna.

**Botao URL:**

- Texto: `Acessar materiais`
- URL: link da pasta ou pagina de materiais.

## 8. Dieta e treino

**Nome do template:** `trinca_rv21_dieta_treino`

**Content SID identificado:** `HXb2393b281d491d8a4fb7a22972aa9cdd`

**Categoria sugerida:** Utility

**Uso:** enviada depois dos materiais do desafio.

**Corpo:**

```text
{{1}}, agora seguem os materiais de apoio do desafio.

Acesse sua dieta, o Ebook RV e o Ebook Nutricional pelos links enviados nesta etapa.

Esses materiais fazem parte da sua base para executar o processo com mais clareza.
```

**Variaveis:**

- `{{1}}`: primeiro nome da aluna.

**Botao URL:**

- Texto: `Acessar materiais`
- URL: link da pagina com dieta e ebooks.

## 9. Preparacao para o Grupo Oficial

**Nome do template:** `trinca_rv21_video_grupo_oficial`

**Content SID identificado:** `HX8c1bece081b38a41162656b314606cc3`

**Categoria sugerida:** Utility

**Uso:** mensagem de quick reply enviada depois dos materiais. Deve liberar o video final do grupo somente apos clique.

**Corpo:**

```text
Parabens por chegar ate aqui.

Agora voce ja recebeu os materiais principais que vao te acompanhar durante todo o processo do TRINCA RV21.

Antes de entrar no Grupo Oficial, preparei um video de boas-vindas para te receber com carinho e te orientar sobre os proximos passos.

Quando estiver pronta, toque no botao abaixo.
```

**Botao Quick Reply:**

- Texto: `Assistir boas-vindas`
- Button ID/Payload: `assistir_boas_vindas_grupo`

## 10. Video final de boas-vindas ao Grupo Oficial

**Nome do template:** `trinca_rv21_video_grupo_oficial`

**Content SID identificado:** `HX8c1bece081b38a41162656b314606cc3`

**Categoria sugerida:** Utility

**Uso:** enviado somente depois do clique `assistir_boas_vindas_grupo`.

**Corpo:**

```text
{{1}}, agora que voce ja recebeu as orientacoes e os materiais necessarios, esta e a mensagem final de boas-vindas ao Grupo Oficial TRINCA RV21.

Esse grupo nao e apenas um lugar de avisos. Ele e o inicio da experiencia que preparamos para voce com muito carinho, responsabilidade e atencao em cada detalhe.

Tudo foi pensado para que voce se sinta acolhida, bem direcionada e segura durante esses 21 dias dentro da comunidade RV.
```

**Variaveis:**

- `{{1}}`: primeiro nome da aluna.

## 11. Link do Grupo Oficial

**Nome sugerido do template:** `trinca_rv21_link_grupo_oficial`

**Categoria sugerida:** Utility

**Uso:** ultima mensagem da sequencia pos-compra. Entrega o link do grupo depois de todas as etapas anteriores.

**Corpo:**

```text
{{1}}, entre agora no Grupo Oficial TRINCA RV21 pelo botao abaixo.

De verdade, agora comeca a nossa jornada do TRINCA RV21.
```

**Variaveis:**

- `{{1}}`: primeiro nome da aluna.

**Botao URL:**

- Texto: `Entrar no grupo`
- URL: link do grupo oficial.

## 10. Aviso oficial

**Nome do template:** `trinca_aviso_oficial`

**Categoria sugerida:** Utility

**Uso:** Mensagens operacionais futuras.

**Corpo:**

```text
Oi, {{1}}. Aqui e o canal oficial de avisos do TRINCA RV21.

Estamos passando para te orientar sobre a etapa atual da sua inscricao e garantir que voce nao perca os proximos passos do desafio.

Veja a orientacao pelo botao abaixo.
```

**Variaveis:**

- `{{1}}`: primeiro nome da lead/aluna.

**Botao URL:**

- Texto: `Ver orientacao`
- URL: pagina, checkout ou grupo, conforme o caso.

## Campos que a API ja entrega para o Make

A rota `GET /api/automation/messages` retorna, alem da mensagem completa, os campos abaixo:

- `whatsapp_digits`: telefone apenas com numeros.
- `whatsapp_link`: link pronto para abertura manual no WhatsApp, se necessario.
- `whatsapp_template_name`: nome do template sugerido.
- `whatsapp_template_category`: categoria sugerida.
- `whatsapp_template_language`: idioma do template.
- `whatsapp_template_body_variables`: variaveis para o corpo.
- `whatsapp_template_buttons`: links de botao, como checkout, materiais e grupo.
- `sequence`: nome da sequencia, quando existir.
- `sequence_order`: ordem da mensagem dentro da sequencia.
- `required_previous_steps`: etapas que devem vir antes.
- `asset_url`: link do video ou material principal da etapa.
- `material_links`: links de dieta, Ebook RV e Ebook Nutricional quando existirem.

Assim que a conta Twilio estiver ativa, o envio pode acontecer de duas formas:

1. Make/n8n usando `whatsapp_template_name` e `whatsapp_template_body_variables`.
2. Rota propria `POST /api/automation/dispatch`, que envia pela Twilio e atualiza o status da mensagem.

Em producao, manter `TWILIO_SEND_MODE=content` para respeitar as regras do WhatsApp Business API com templates aprovados na Twilio.
