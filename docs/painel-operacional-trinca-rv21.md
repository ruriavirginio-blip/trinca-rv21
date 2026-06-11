# Painel operacional - TRINCA RV21

O painel operacional foi criado para acompanhar o fluxo de cada lead sem precisar abrir o Supabase manualmente.

## Tela

```text
/operacao
```

Ao abrir, informe o token da automacao:

```text
AUTOMATION_API_SECRET
```

O token fica salvo apenas no navegador da maquina usada, via `sessionStorage`.

## API

```text
GET /api/automation/dashboard?token=SEU_TOKEN&limit=120
```

## O que o painel mostra

- total de leads;
- leads das ultimas 24 horas;
- leads com pagamento confirmado;
- leads sem pagamento confirmado;
- leads que precisam de atencao;
- eventos Kiwify;
- mensagens na automacao;
- gates aguardando clique;
- links do grupo ja enviados;
- readiness de lancamento;
- origem dos leads por canal;
- jornada individual de cada lead;
- regua visual da jornada, da landing ate o link do grupo;
- situacao de pagamento: confirmado, pendente, recusado ou sem evento Kiwify;
- leitura de possivel abandono: fluxo em andamento, travou no clique, sem pagamento ou concluiu;
- linha do tempo das mensagens por etapa;
- status humano de cada mensagem: aguardando disparo, enviada pelo Twilio, aguardando clique, confirmada pela lead ou erro;
- horario previsto e horario real de envio quando a Twilio registrar o disparo;
- ultimo clique Twilio registrado.

## Links de campanha

O painel gera links prontos para:

- Instagram Story;
- Instagram Direct;
- Instagram Feed.

Esses links usam parametros:

```text
utm_source=instagram
utm_medium=story|direct|feed
utm_campaign=trinca_rv21_lancamento
```

Assim, quando a lead preenche a landing, o sistema registra a origem e permite analisar o desempenho por canal.

## Fluxo visual acompanhado

1. Lead capturada na landing.
2. Checkout iniciado.
3. Evento Kiwify recebido.
4. Compra confirmada.
5. Clique em `Estou pronta`.
6. Video de boas-vindas.
7. Orientacoes iniciais.
8. Materiais.
9. Dieta e ebooks.
10. Preparacao para o grupo.
11. Clique em `Assistir boas-vindas`.
12. Video final do grupo.
13. Link do grupo enviado.

## Como interpretar rapidamente

- Verde: etapa concluida ou mensagem enviada.
- Dourado: etapa aguardando disparo ou clique da lead.
- Vermelho: precisa de atencao, erro ou provavel abandono.

Na leitura individual de cada lead, observe principalmente:

- `Pagamento`: mostra se a Kiwify confirmou ou nao.
- `Situacao`: mostra se o fluxo esta andando, se travou ou se parece abandono.
- `Ultima atividade`: mostra o ultimo movimento real registrado.
- `Linha do tempo`: mostra cada mensagem planejada/enviada pelo Twilio.

## Observacao

Videos, materiais, dieta e treino continuam como ultima camada de preenchimento. O painel ja acompanha as etapas mesmo antes dos links finais serem inseridos.
