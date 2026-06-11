# Dominio, Instagram e trafego - TRINCA RV21

Este documento organiza a estrategia para colocar landing, painel e links de Instagram em sincronia.

## Recomendacao tecnica

Como o dominio atual foi criado/usado com WordPress, existem duas rotas seguras:

Guia tecnico de publicacao permanente:

```text
docs/deploy-vercel-dominio-trinca-rv21.md
```

### Opcao A - Subdominio na Vercel primeiro

Mais segura para comecar.

Exemplos:

```text
https://trinca.seudominio.com
https://trinca.seudominio.com/operacao
https://trinca.seudominio.com/bio
```

Vantagens:

- nao quebra o WordPress atual;
- permite testar landing, painel, Kiwify e Twilio com calma;
- facilita rollback;
- ideal para lancamento controlado.

### Opcao B - Dominio principal na Vercel

Mais definitiva.

Exemplos:

```text
https://seudominio.com
https://seudominio.com/operacao
https://seudominio.com/bio
```

Vantagens:

- experiencia mais limpa;
- tudo centralizado no projeto TRINCA RV21;
- melhor para venda direta e identidade de marca.

Cuidados:

- precisa decidir se o WordPress sera substituido;
- ajustar DNS com atencao;
- conferir se existem paginas antigas importantes no WordPress.

## Link da bio

Foi criada a pagina:

```text
/bio
```

Ela deve ser usada como link principal da bio quando o projeto estiver online.

Exemplo futuro:

```text
https://trinca.seudominio.com/bio
```

Essa pagina direciona para:

- landing oficial com rastreio `utm_source=instagram&utm_medium=bio`;
- WhatsApp da equipe RV;
- landing explicativa com rastreio de direct.

## Links rastreados para Instagram

### Bio

```text
/?utm_source=instagram&utm_medium=bio&utm_campaign=trinca_rv21_lancamento
```

### Story

```text
/?utm_source=instagram&utm_medium=story&utm_campaign=trinca_rv21_lancamento
```

### Direct

```text
/?utm_source=instagram&utm_medium=direct&utm_campaign=trinca_rv21_lancamento
```

### Feed

```text
/?utm_source=instagram&utm_medium=feed&utm_campaign=trinca_rv21_lancamento
```

## Como isso aparece no painel

O painel `/operacao` identifica a origem do lead por:

- `utm_source`;
- `utm_medium`;
- `utm_campaign`;
- referrer;
- link usado no checkout.

Assim sera possivel saber se a lead veio de:

- Bio;
- Story;
- Direct;
- Feed;
- outro canal.

## Ordem correta para ir online

1. Escolher dominio ou subdominio.
2. Configurar projeto na Vercel.
3. Configurar variaveis de ambiente reais.
4. Apontar DNS.
5. Testar:
   - `/`;
   - `/bio`;
   - `/operacao`;
   - `/api/automation/readiness`;
   - webhook Kiwify;
   - webhook Twilio.
6. Colocar link `/bio` na bio do Instagram.
7. Usar links rastreados em Story, Direct e Feed.

## Minha recomendacao para o TRINCA RV21

Comecar com subdominio na Vercel, validar tudo e depois decidir se o dominio principal sai do WordPress.

Isso protege o lancamento e evita quebrar o que ja existe.
