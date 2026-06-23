# 🎯 SPEC DE TRÁFEGO — D1 (teste low budget → enriquecer público VIP)

> Objetivo desta campanha: **encher a Lista VIP** (`/vip`) com **mulheres 25–44** a custo baixo,
> medir CPL e descobrir qual criativo/ângulo engata, e **alimentar o pixel** com eventos `Lead`
> (já instalado em `/vip` — Pixel + CAPI dedupados) pra escalar com otimização real a partir do D3.
>
> Base estratégica: `docs/estrategia-v2.md` — a audiência ORGÂNICA do @ruriavirginio é maioria
> homem, então o tráfego PAGO é o que entrega o público-alvo certo (mulher) pra meta de ~1.000.

---

## 1) Estrutura da campanha (Gerenciador de Anúncios)

**Campanha**
- Nome: `TRINCA_VIP_D1_TESTE`
- Objetivo: **Tráfego** (cliques no link) no D1–D2 — mais barato, semeia o pixel.
  → A partir do **D3**, com ~20–30 Leads no pixel, **trocar pra Conversões → evento `Lead`**.
- Orçamento: **CBO (orçamento na campanha)** R$ **20–30/dia**.
- Pixel: Protocolo RV (já no site). Evento de otimização final: **Lead**.

**Conjunto de anúncios** (`ADS_VIP_D1_MULHER_25-44`)
- Local: **Brasil** (se quiser focar: Nordeste + capitais; senão Brasil todo).
- Idade: **25–44**. Gênero: **Mulheres**.
- Posicionamentos: **Advantage+ (automático)** — deixa o Instagram Reels/Stories/Feed + Facebook.
- Públicos (detalhado, OR) — usar 3–5 destes:
  - Emagrecimento / Perda de peso
  - Academia / Fitness / Vida saudável
  - Treino em casa
  - Bem-estar / Autoestima
  - Nutrição / Dieta
- Otimização: **Cliques no link** (D1–D2) → **Lead** (D3+).

**Anúncios** (2–3 criativos pra testar ângulo)
1. **Reel D1 "A promessa simples"** (o que você grava em selfie) — melhor pra IG.
2. **Card estático "O método falhou, não você"** (preto+ouro, premium).
3. **Card estático "Entra na lista VIP / vagas limitadas"** (CTA forte).

---

## 2) Copy dos anúncios (3 variações — testar)

**Variação A — Dor + método**
> Você não falhou nas dietas. O método é que nunca foi feito pra você.
> 21 dias com treino direcionado, dieta de nutricionista e acompanhamento diário.
> 👉 Entra na Lista VIP e recebe o acesso (e o preço de lançamento) antes de todo mundo.

**Variação B — Curiosidade/antecipação**
> Tô abrindo a 1ª turma de um desafio de 21 dias pra mulher que quer recomeçar de verdade.
> Vagas limitadas. Quem entra na Lista VIP recebe primeiro. 💛
> 👉 Garante seu lugar na lista.

**Variação C — Prova/identificação**
> +5.000 mulheres já passaram pela minha mão em 14 anos. Agora é a sua vez.
> Desafio de 21 dias — treino + dieta + grupo de acompanhamento.
> 👉 Entra na Lista VIP antes de abrir pro público.

**CTA do botão:** "Saiba mais" (D1–D2) / "Cadastre-se" (D3+).

---

## 3) Destino + rastreamento (NÃO mudar — é o que liga o cockpit)

**URL do anúncio:**
```
https://protocolorv.com.br/vip?o=trafego-d1&utm_source=meta&utm_medium=paid&utm_campaign=trinca_vip_d1&utm_content={{ad.name}}
```
- `o=trafego-d1` → a aba **Acessos** do cockpit conta os acessos por esse link.
- O `/vip` dispara **Lead** (Pixel + CAPI) no cadastro → a campanha otimiza por conversão real.
- Trocar `trafego-d1` por `trafego-d4`, `trafego-d9` etc. nos dias de escala/lançamento.

---

## 4) Calendário do tráfego (casado com o aquecimento)

| Dia | Verba/dia | Objetivo | Foco |
|-----|-----------|----------|------|
| D1 (23/06) | R$20–30 | Tráfego→/vip | medir CPL, achar criativo vencedor |
| D2 (24/06) | R$20–30 | Tráfego→/vip | manter o que trouxe mais VIP |
| D3 (25/06) | R$30–50 | **Conversões/Lead** | já com pixel aquecido |
| D4–D6 | R$50–100 | Conversões/Lead | **escala** do vencedor |
| D7–D8 | R$80–120 | Conversões/Lead | + **Lookalike** das VIPs |
| D9 (01/07) | **pico** | Conversões/Lead | última captação VIP |
| D10 (02/07) | **pico máx.** | Conversões (Compra) | troca destino p/ landing (lançamento) |

---

## 5) O que falta pra eu (Claude) AUTOMATIZAR isso sozinho

Hoje eu **não** tenho como criar a campanha por código — falta:
1. **ID da conta de anúncios** (`act_...`) — Gerenciador → Configurações da conta.
2. **Token de Usuário do Sistema com `ads_management`** — Meta Business → Configurações do
   Negócio → Usuários do Sistema → Gerar token (com `ads_management` + acesso à conta de anúncios).

Com esses 2, eu scripto a criação/edição/agendamento das campanhas via Marketing API.
**Enquanto não vêm**, esta spec é pra você publicar no Gerenciador em ~5 min (D1 garantido).

> ⚠️ Se o token JÁ foi criado numa sessão anterior, ele provavelmente está no **env de produção da
> Vercel** — pra eu confirmar e usar, preciso que você **reative meu acesso à Vercel**
> (`npx vercel login` no repo, ou um token de vercel.com/account/tokens).
