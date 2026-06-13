# Fundacao do Cerebro Unico - TRINCA RV21

Esta fundacao prepara o projeto para a arquitetura em que o Claude API le o Supabase como fonte unica de verdade e responde de forma consolidada sobre leads, vendas, conteudo, trafego e alertas.

## O que existe nesta etapa

- Migracao SQL em `supabase/migrations/20260613000000_brain_foundation.sql`.
- Tabelas novas:
  - `instagram_metrics`
  - `content_performance`
  - `ads_metrics`
  - `daily_snapshots`
- Endpoint protegido de validacao:
  - `GET /api/brain/foundation?token=SEU_TOKEN_INTERNO`

## Como validar

Use o mesmo token interno usado para automacoes (`AUTOMATION_API_SECRET` ou `KIWIFY_WEBHOOK_SECRET`).

Resposta esperada quando a fundacao estiver pronta:

```json
{
  "foundation_ready": true,
  "groups": [
    { "key": "supabase_brain_tables", "status": "ok" },
    { "key": "tracking", "status": "ok" },
    { "key": "claude", "status": "ok" }
  ]
}
```

Se alguma tabela aparecer como `missing`, aplique a migracao SQL no Supabase SQL Editor.

## Variaveis criticas

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_META_PIXEL_ID`
- `META_CAPI_ACCESS_TOKEN`
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
- `ANTHROPIC_API_KEY`
- `AUTOMATION_API_SECRET`

## Limite desta fase

Esta fase nao conecta Windsor.ai, nao cria relatorios automaticos e nao muda o fluxo de vendas. Ela apenas garante a base de dados e a validacao tecnica para a proxima fase.
