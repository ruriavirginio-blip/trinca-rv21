# 🔑 Credenciais pendentes — Motor 24/7

> Estas são as chaves/logins que **só você (Ruriá)** consegue gerar. Sem elas, o motor cria e organiza, mas **não publica sozinho** nem puxa métricas das redes. Cada item diz: o que é, pra que serve, e como pegar.

---

## 1. 📲 Instagram Graph API — PUBLICAR posts sozinho (PRIORIDADE MÁXIMA)
**Pra quê:** o motor publicar story/feed/reel no seu @ruriavirginio no dia/hora agendados, sem você postar na mão.

**O que preciso de você:**
- [ ] Conta Instagram convertida em **Profissional/Business** (provavelmente já é)
- [ ] **Página do Facebook** conectada ao Instagram
- [ ] Um **App no Meta for Developers** (https://developers.facebook.com) com os produtos *Instagram Graph API* + *Facebook Login*
- [ ] **Instagram Business Account ID**
- [ ] **Page Access Token de longa duração** com permissões: `instagram_basic`, `instagram_content_publish`, `pages_read_engagement`, `pages_show_list`
- [ ] (Opcional p/ insights) `instagram_manage_insights`

**Env a setar:** `IG_BUSINESS_ACCOUNT_ID`, `IG_PAGE_ACCESS_TOKEN`

> ⚠️ Importante: o Instagram **não publica Stories** via API oficial de forma simples (só feed, carrossel e reels são suportados oficialmente). Stories podem precisar de lembrete pra postar manual OU ferramenta terceira. Te explico as opções quando chegar a hora.

---

## 2. 🎨 Canva Connect API — gerar arte automática (opcional, alternativa às skills)
**Pra quê:** se quiser que o motor gere artes via Canva além das skills do Claude.
- [ ] Acesso ao **Canva Developers** (https://www.canva.com/developers/)
- [ ] Criar um **Integration** → pegar **Client ID** e **Client Secret** (OAuth)

**Env:** `CANVA_CLIENT_ID`, `CANVA_CLIENT_SECRET`

> 💡 Recomendação: pro nível de qualidade que você quer (design + psicologia da /nova), as **skills do Claude** (ckm-design, frontend-design, trinca-high-end-visual-design) já entregam material premium. O Canva fica como **opção extra**, não obrigatório.

---

## 3. 👁️ Windsor.ai — "olhos" nas métricas das redes
**Pra quê:** juntar num lugar só os dados de Meta Ads + GA4 + Instagram (alcance, CPL, persona).
- [ ] Conta no **Windsor.ai** (https://windsor.ai) — você logar e autorizar os conectores
- [ ] Conectar: **Meta Ads**, **GA4**, **Instagram (organic)**
- [ ] Pegar a **API key** do Windsor

**Env:** `WINDSOR_API_KEY`

> Vira essencial **quando o tráfego pago ligar**. No pré-aquecimento puro (sem ad), o Instagram Insights já cobre.

---

## 4. 🎬 Remotion Worker — editar vídeo (reels)
**Pra quê:** o `/api/remotion/render` é só um "telefone" que liga pra um **worker externo** que faz a edição pesada.
- [ ] Subir o worker de render (Railway/servidor) e me dar a URL

**Env:** `REMOTION_WORKER_URL`

---

## Resumo do que setar na Vercel quando tiver
```
IG_BUSINESS_ACCOUNT_ID=
IG_PAGE_ACCESS_TOKEN=
REMOTION_WORKER_URL=
WINDSOR_API_KEY=        (quando ligar ads)
CANVA_CLIENT_ID=        (opcional)
CANVA_CLIENT_SECRET=    (opcional)
```
