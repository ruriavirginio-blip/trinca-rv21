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

## 4. Compra aprovada

**Nome do template:** `trinca_boas_vindas_aprovada`

**Categoria sugerida:** Utility

**Uso:** Compra aprovada na Kiwify.

**Corpo:**

```text
{{1}}, sua inscricao no TRINCA RV21 foi aprovada. Seja bem-vinda ao desafio oficial.

Agora voce entra na etapa de orientacao, grupo oficial e recebimento dos materiais dos 21 dias.

Entre no grupo oficial pelo botao abaixo. Dentro dele voce recebera as proximas orientacoes do protocolo.
```

**Variaveis:**

- `{{1}}`: primeiro nome da aluna.

**Botao URL:**

- Texto: `Entrar no grupo`
- URL: link do grupo oficial.

## 5. Aviso oficial

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
- `whatsapp_template_buttons`: links de botao, como checkout e grupo.

Assim que o numero API estiver aprovado, o Make deve usar `whatsapp_template_name` e `whatsapp_template_body_variables` para disparar pelo WhatsApp Cloud API ou por um provedor oficial.
