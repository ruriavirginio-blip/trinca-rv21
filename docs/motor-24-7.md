# 🚀 Motor 24/7 de Conteúdo — TRINCA RV21

> Como o sistema vai criar, aprovar e publicar conteúdo no Instagram **quase sozinho**, com você só apertando botões e aprovando. Escrito em português simples.

## A ideia em 1 frase
Você aperta um botão no cockpit → o Claude cria o material com as skills de design/psicologia → o material volta pro cockpit pra você aprovar → o motor publica sozinho no dia e hora certos e ainda responde comentários e DMs.

---

## Quem faz o quê (importante entender)
Tem **duas máquinas diferentes** trabalhando juntas:

| Máquina | O que faz | Quando roda |
|---|---|---|
| **CRIAÇÃO (Claude + skills)** | Cria os criativos de qualidade: gráficos, animações, thumbnails, legendas, roteiros. Usa as skills (ckm-design, frontend-design, trinca-high-end-visual-design, trinca-marketing-psychology, content-instagram-rv, trinca-copywriting). | **Acionada por botão** (não é 24/7 — roda quando você pede) |
| **MOTOR (servidor)** | Guarda a fila, agenda, **publica no Instagram** no dia/hora marcados, liga as respostas automáticas de comentário/DM, e coleta as métricas. | **24/7 sozinho** (na nuvem: Vercel + Make + Supabase) |

👉 Resumindo: **a criação é sob demanda (você aciona), a publicação e a automação são 24/7.** É exatamente o fluxo que você desenhou.

---

## O fluxo completo (passo a passo)

### Conteúdo de imagem (story / feed / carrossel)
1. **Roteiro pronto** — o calendário de 13 dias já existe (aba Conteúdo). Cada item tem tipo, data, hora, tema e legenda.
2. **Botão "Criar"** no cockpit → cria um *pedido de criação* na fila (status `solicitado`).
3. **Claude cria** com as skills certas pro tipo (design + psicologia) → sobe o arquivo → status `em_aprovacao`.
4. **Você revê no cockpit:** Aprovar ✅ / Ajustar ✏️ (pede de novo às skills) / Rejeitar ❌.
5. **Aprovado** → status `agendado` com dia/hora/legenda.
6. **Motor publica** via Instagram Graph no horário → status `publicado`.
7. **Motor liga a automação** daquele post (responder comentário com gatilho → DM).

### Vídeo (reels) — mesmo mecanismo, com Remotion
1. Você sobe o **vídeo bruto** no cockpit.
2. **Botão "Editar"** → o sistema manda pro **Remotion** (worker de render) seguindo o roteiro do especialista.
3. Vídeo editado **volta pro cockpit** → status `em_aprovacao`.
4. Aprovar / Ajustar / Rejeitar.
5. Aprovado → `agendado` → **motor publica** no dia/hora com a legenda → liga automação.

---

## Estado de cada peça (hoje)

| Peça | Status | Falta |
|---|---|---|
| Fila de criação (Supabase) | 🟡 schema pronto neste pacote (`docs/supabase-content-factory.sql`) | rodar o SQL no Supabase |
| Endpoint de pedido (`/api/content-factory`) | 🟡 esqueleto pronto | conectar criação real + auth |
| Botões no cockpit | 🟡 a fazer (próxima etapa) | UI na aba Conteúdo |
| Remotion render | 🟡 existe rota `/api/remotion/render` (proxy p/ worker) | ligar `REMOTION_WORKER_URL` + worker no ar |
| **Publicar no Instagram** | 🔴 não construído | **Instagram Graph API + token de publicação (precisa de você)** |
| Automação comentário/DM | 🟢 já existe (webhook responde gatilho→DM) | ligar por-post |
| Métricas de pré-aquecimento | 🟡 schema pronto neste pacote | conectar Instagram Insights + GA4/Windsor |

🔴 = depende de chave/login seu (ver `docs/credenciais-pendentes.md`).

---

## Captura de dados do pré-aquecimento (por que importa)
Durante o pré-lançamento, cada post vira **aprendizado** pro lançamento. O motor vai guardar, por post:
- quantos **leads** aquele post gerou (via link da bio com etiqueta UTM);
- **persona** atingida (idade, gênero, cidade) — via Instagram Insights;
- **formato** que melhor funcionou (story x feed x reel);
- **onde** houve mais interação (comentário x DM);
- **melhores dias e horários**;
- nível de **engajamento** (alcance, salvamentos, compartilhamentos).

No lançamento, o cockpit mostra "o que mais converteu" e a gente repete a fórmula vencedora. Schema em `docs/supabase-content-factory.sql`.

---

## Próximos passos (ordem)
1. Rodar os 2 SQLs no Supabase (fila + métricas).
2. Você fornecer as credenciais de `docs/credenciais-pendentes.md` (Instagram publish, Canva, Windsor).
3. Ligar a publicação no Instagram Graph + conectar a criação real aos botões.
4. Conectar Windsor + Instagram Insights pra alimentar as métricas.
