# Configurar Notion no Cockpit Conteúdo

Variáveis Vercel:

```env
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxx
NOTION_CONTENT_DATABASE_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NOTION_CONTENT_ID_PROPERTY=Codigo
NOTION_CONTENT_STATUS_PROPERTY=Status
NOTION_CONTENT_STATUS_PROPERTY_TYPE=status
```

## Passo 1 — criar a integration

1. Abra: https://www.notion.so/profile/integrations
2. Clique em `New integration`.
3. Nome sugerido: `TRINCA RV21 Cockpit`.
4. Workspace: selecione o workspace do Ruriá.
5. Capabilities necessárias:
   - Read content
   - Update content
   - Insert content, se o Make também for criar itens no Notion no futuro
6. Copie o `Internal Integration Secret`.
7. Cole na Vercel como:

```env
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxx
```

Referência oficial: https://developers.notion.com/docs/create-a-notion-integration

## Passo 2 — compartilhar o database com a integration

1. Abra o database de conteúdo no Notion.
2. Clique em `...` no canto superior direito.
3. Clique em `Connections`.
4. Procure `TRINCA RV21 Cockpit`.
5. Confirme o acesso.

Sem esse compartilhamento, a API retorna erro mesmo com token correto.

## Passo 3 — pegar o database ID

1. Abra o database como página inteira no navegador.
2. Copie a URL.
3. O `database_id` é o bloco de 32 caracteres depois do nome da página e antes de `?v=`.

Exemplo:

```text
https://www.notion.so/workspace/Calendario-TRINCA-21d4a8f18d1b80d9a2f4f7a6b8c9d012?v=...
                                  └──────────── database id ────────────┘
```

Cole sem hífens:

```env
NOTION_CONTENT_DATABASE_ID=21d4a8f18d1b80d9a2f4f7a6b8c9d012
```

Referência oficial da API de databases: https://developers.notion.com/reference/post-database-query

## Estrutura esperada do database

O Cockpit tenta ler:

| Propriedade | Tipo no Notion | Valor esperado |
|---|---|---|
| `Codigo` | Text ou Title | `d1`, `d2`, `d3`, `d4`, `d5`, `d6`, `d7` |
| `Status` | Status | `RASCUNHO`, `APROVADO`, `PUBLICADO`, `REJEITADO` |

Se o Notion usar `Select` em vez de `Status`, alterar na Vercel:

```env
NOTION_CONTENT_STATUS_PROPERTY_TYPE=select
```

## Teste

Depois de configurar as variáveis:

```bash
curl https://protocolorv.com.br/api/cockpit-content
```

Resultado esperado:

```json
{
  "configured": true,
  "items": [
    {
      "id": "d1",
      "status": "RASCUNHO"
    }
  ]
}
```

No Cockpit:

1. Abrir `/cockpit`.
2. Entrar na aba `Conteúdo`.
3. Clicar em `Sincronizar Notion`.
4. Clicar em `Aprovar`, `Rejeitar`, `Editar` ou `Publicar`.
