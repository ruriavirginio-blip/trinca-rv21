/* Plano de conteúdo DIA A DIA do aquecimento TRINCA RV21 (D1=23/06 ... D10=02/07).
   Fonte única: usada pela aba Conteúdo (cockpit) e pelo briefing automático das 4h (Telegram).
   Base: estrategia-v2.md (audiência majoritariamente masculina → conteúdo feminino + save/share + VIP). */

export type DiaPlan = {
  id: string; // casa com contentCalendar (d1..d9, d13)
  data: string; // "2026-06-23"
  enfase: string; // foco do dia
  trafego: string; // o que fazer de tráfego pago no dia
  organico: {
    bomDia: string; // o que falar no 1o story (selfie, ~04:30)
    roteiro: string[]; // sequência de stories orgânicos (selfie) do Ruriá
    qtd: string; // quantos stories orgânicos
  };
  criativos: string[]; // o que o Claude cria pra esse dia (cards/reels/carrossel/thumb)
  checklist: string[]; // checklist do dia (ordem cronológica a partir das 04:30)
};

export const DIA_PLANS: Record<string, DiaPlan> = {
  d1: {
    id: "d1",
    data: "2026-06-23",
    enfase: "OPORTUNIDADE — abrir curiosidade e começar a encher a Lista VIP. Hoje o TRINCA é revelado.",
    trafego: "TESTE pequeno (R$20–30/dia): campanha de tráfego pro /vip, público mulher 25–44. Só pra medir CPL e qual criativo engata.",
    organico: {
      bomDia:
        "Bom dia em selfie, luz natural. Tom leve e verdadeiro: 'Bom dia! Hoje começa uma coisa que eu venho preparando há tempo pra vocês, mulheres que querem recomeçar…' Sem entregar tudo — criar curiosidade.",
      roteiro: [
        "Story 1 (selfie): bom dia + 'hoje eu vou revelar uma novidade'. Curiosidade, sem dizer o que é.",
        "Story 2 (selfie): conta a dor — 'cansei de ver mulher se culpando por não ter força de vontade. O problema nunca foi você, foi o método.'",
        "Story 3 (selfie): adianta que é um desafio de 21 dias e que tem LISTA VIP com acesso antecipado. Sticker de link → /vip.",
        "Story 4 (selfie/CTA): 'quem quer entrar antes de todo mundo, entra na lista VIP no link. Vagas da 1a turma limitadas.' 🔗 LINK NO STICKER do story: protocolorv.com.br/vip?o=story-d1",
      ],
      qtd: "4–5 stories orgânicos pela manhã + 3–4 ao longo do dia reforçando a VIP.",
    },
    criativos: [
      "Reel D1 'A promessa simples' (roteiro take-a-take na aba) — VOCÊ grava em selfie.",
      "3 cards de Stories (preto+ouro, premium): #1 'Hoje começa', #2 'O método falhou, não você', #3 'Entra na lista VIP' (com seta pro link).",
      "Thumbnail/capa do reel (design gráfico premium) pra fixar no feed.",
    ],
    checklist: [
      "04:30 — Bom dia em selfie (Story 1) com curiosidade da revelação.",
      "04:40 — Stories orgânicos 2–4 (dor → desafio 21 dias → CTA lista VIP com link).",
      "07:30 — Postar o Reel D1 + thumbnail. CTA: 'comenta QUERO'.",
      "Manhã — Subir os 3 cards de Stories (criados) reforçando a VIP.",
      "Ligar a campanha de TESTE de tráfego (R$20–30) pro /vip.",
      "Tarde/noite — 3–4 stories reforçando a lista VIP + responder comentários/DMs.",
    ],
  },
  d2: {
    id: "d2",
    data: "2026-06-24",
    enfase: "OPORTUNIDADE — quebrar a culpa ('não é falta de força, é falta de método').",
    trafego: "Continua o teste. Observe o CPL no cockpit; mantenha o criativo que mais trouxe VIP.",
    organico: {
      bomDia: "Bom dia em selfie: 'Você já começou uma dieta na segunda e parou na quarta? Hoje eu quero te tirar uma culpa das costas.'",
      roteiro: [
        "Story 1 (selfie): bom dia + a pergunta-espelho (começou segunda, parou quarta).",
        "Story 2 (selfie): 'isso não é fraqueza. É plano que depende de motivação. Método bom diminui decisão.'",
        "Story 3 (selfie): liga ao TRINCA + chama pra lista VIP. 🔗 LINK NO STICKER do story: protocolorv.com.br/vip?o=story-d2",
      ],
      qtd: "3–4 orgânicos de manhã + enquete ('já desistiu de dieta na 1a semana?').",
    },
    criativos: [
      "Reel D2 'Quebra da culpa' (roteiro na aba) — VOCÊ grava.",
      "Card de Stories com a enquete + 1 card 'não é força de vontade, é direção'.",
    ],
    checklist: [
      "04:30 — Bom dia selfie + pergunta-espelho.",
      "04:40 — Stories orgânicos (quebra de culpa → CTA VIP).",
      "12:15 — Postar Reel D2.",
      "Subir card da enquete + reforço VIP.",
      "Acompanhar tráfego/CPL no cockpit.",
    ],
  },
  d3: {
    id: "d3",
    data: "2026-06-25",
    enfase: "OPORTUNIDADE — prova social (Jessica) pra mostrar transformação real.",
    trafego: "Decide o criativo vencedor do teste; prepara pra escalar a partir de D4.",
    organico: {
      bomDia: "Bom dia em selfie: 'Deixa eu te contar a história de uma aluna que dizia que o corpo dela tinha desistido dela.'",
      roteiro: [
        "Story 1 (selfie): bom dia + introduz a história da Jessica.",
        "Story 2: print/depoimento da Jessica (card) + 'o corpo não desistiu, o método é que estava errado'.",
        "Story 3 (selfie): CTA — 'quer ser a próxima história? entra na lista VIP'. 🔗 LINK NO STICKER do story: protocolorv.com.br/vip?o=story-d3",
      ],
      qtd: "3–4 orgânicos + repost do depoimento.",
    },
    criativos: [
      "Reel D3 'Prova social Jessica' (roteiro na aba) — VOCÊ grava/edita com o depoimento.",
      "Card de depoimento (Jessica) premium + card CTA VIP.",
    ],
    checklist: [
      "04:30 — Bom dia selfie + abre a história da aluna.",
      "Stories orgânicos com a prova social + CTA VIP.",
      "19:00 — Postar Reel D3 (prova social).",
      "Reforço VIP à noite.",
    ],
  },
  d4: {
    id: "d4",
    data: "2026-06-26",
    enfase: "TRANSFORMAÇÃO — mostrar o que tem dentro (treino + dieta + acompanhamento).",
    trafego: "ESCALA: sobe a verba do criativo vencedor (R$50–100/dia) pra encher a VIP.",
    organico: {
      bomDia: "Bom dia em selfie: 'Muita gente me pergunta o que tem dentro do TRINCA. Hoje eu mostro por dentro.'",
      roteiro: [
        "Story 1 (selfie): bom dia + 'vou te mostrar o que tem dentro'.",
        "Story 2–3: bastidor real (treino/dieta/grupo) em selfie/vídeo curto.",
        "Story 4 (selfie): CTA VIP — 'quem entra na lista recebe antes e mais barato'. 🔗 LINK NO STICKER do story: protocolorv.com.br/vip?o=story-d4",
      ],
      qtd: "4–5 orgânicos (bastidor) + carrossel do dia.",
    },
    criativos: [
      "Carrossel 'O que tem dentro' (6 slides premium) — design gráfico.",
      "3 cards de Stories de bastidor + CTA VIP.",
    ],
    checklist: [
      "04:30 — Bom dia selfie + 'mostrar por dentro'.",
      "Stories de bastidor (treino/dieta/grupo) + CTA VIP.",
      "08:00 — Postar o Carrossel 'O que tem dentro'.",
      "Subir a verba do tráfego (escala).",
    ],
  },
  d5: {
    id: "d5",
    data: "2026-06-27",
    enfase: "TRANSFORMAÇÃO — derrubar objeções (tempo, medo, preço).",
    trafego: "Mantém a escala. Caixa de perguntas pra alimentar objeções reais.",
    organico: {
      bomDia: "Bom dia em selfie: 'Se você acha que não tem tempo, esse aqui é pra você.'",
      roteiro: [
        "Story 1 (selfie): bom dia + 'a maior desculpa: não tenho tempo'.",
        "Story 2: caixa de perguntas ('qual sua maior dúvida pra começar?').",
        "Story 3 (selfie): responde 1–2 objeções + CTA VIP. 🔗 LINK NO STICKER do story: protocolorv.com.br/vip?o=story-d5",
      ],
      qtd: "3–4 orgânicos + caixa de perguntas (responder nos stories).",
    },
    criativos: [
      "Reel D5 'Objeções' (roteiro na aba) — VOCÊ grava.",
      "Cards respondendo as 3 maiores objeções + CTA VIP.",
    ],
    checklist: [
      "04:30 — Bom dia selfie + objeção do tempo.",
      "Abrir caixa de perguntas e responder nos stories.",
      "12:30 — Postar Reel D5.",
      "Reforço VIP + acompanhar tráfego.",
    ],
  },
  d6: {
    id: "d6",
    data: "2026-06-28",
    enfase: "TRANSFORMAÇÃO — antecipação honesta ('falta pouco pra abrir').",
    trafego: "Escala forte (a lista precisa estar cheia até D9).",
    organico: {
      bomDia: "Bom dia em selfie: 'Falta pouco pra abrir o TRINCA. Quem tá na lista VIP entra primeiro.'",
      roteiro: [
        "Story 1 (selfie): bom dia + contagem ('falta pouco').",
        "Story 2: recap rápido do que é o TRINCA (1 frase).",
        "Story 3 (selfie): CTA VIP forte + link. 🔗 LINK NO STICKER do story: protocolorv.com.br/vip?o=story-d6",
      ],
      qtd: "3–4 orgânicos + sticker de contagem regressiva.",
    },
    criativos: ["Sequência de Stories de antecipação (cards) + 1 card 'lista VIP recebe primeiro'."],
    checklist: [
      "04:30 — Bom dia selfie + antecipação.",
      "Stories de antecipação + contagem + CTA VIP.",
      "18:30 — Sequência de Stories (criados).",
      "Acompanhar tamanho da lista VIP no cockpit.",
    ],
  },
  d7: {
    id: "d7",
    data: "2026-06-29",
    enfase: "PROPRIEDADE — sua história / por que você criou o método (conexão).",
    trafego: "Mantém escala. Começa a preparar o criativo de lançamento.",
    organico: {
      bomDia: "Bom dia em selfie, mais íntimo: 'Vou te contar por que eu criei o Protocolo RV.'",
      roteiro: [
        "Story 1 (selfie): bom dia + abre a história/propósito.",
        "Story 2 (selfie): a dor que te motivou (mulher real desistindo de si).",
        "Story 3 (selfie): CTA VIP — 'falta 3 dias, entra na lista'. 🔗 LINK NO STICKER do story: protocolorv.com.br/vip?o=story-d7",
      ],
      qtd: "3–4 orgânicos (storytelling) + CTA VIP.",
    },
    criativos: ["Reel narrativo 'Por que criei o Protocolo RV' (você grava, face) + card CTA VIP."],
    checklist: [
      "04:30 — Bom dia selfie + sua história.",
      "Stories de storytelling + CTA VIP.",
      "20:00 — Postar Reel narrativo (prime time emocional).",
    ],
  },
  d8: {
    id: "d8",
    data: "2026-06-30",
    enfase: "PROPRIEDADE — qualificação reversa ('pra quem NÃO é') + prova social acumulada.",
    trafego: "Escala. Lista VIP deve estar perto do pico.",
    organico: {
      bomDia: "Bom dia em selfie: 'O TRINCA não é pra todo mundo. Hoje eu explico pra quem é.'",
      roteiro: [
        "Story 1 (selfie): bom dia + 'não é pra todo mundo'.",
        "Story 2: card de qualificação (pra quem é / pra quem não é).",
        "Story 3 (selfie): CTA VIP — 'se você é essa mulher, entra na lista'. 🔗 LINK NO STICKER do story: protocolorv.com.br/vip?o=story-d8",
      ],
      qtd: "3–4 orgânicos + carrossel de qualificação.",
    },
    criativos: ["Carrossel 'As 3 mulheres que NÃO devem entrar' (6 slides) + cards de prova social (+5.000)."],
    checklist: [
      "04:30 — Bom dia selfie + qualificação.",
      "Stories de qualificação + prova social + CTA VIP.",
      "08:10 — Postar Carrossel de qualificação.",
    ],
  },
  d9: {
    id: "d9",
    data: "2026-07-01",
    enfase: "VÉSPERA — máxima antecipação. Amanhã abre. (Sistema dispara T3 da VIP hoje.)",
    trafego: "PICO de verba. Foco em última captação pra VIP antes de abrir.",
    organico: {
      bomDia: "Bom dia em selfie, energia alta: 'AMANHÃ abre a primeira turma do TRINCA RV21!'",
      roteiro: [
        "Story 1 (selfie): bom dia + 'AMANHÃ abre'.",
        "Story 2: enquete 'você vai entrar?' + print de depoimento.",
        "Story 3 (selfie): 'lista VIP recebe o link 1h antes. Última chance de entrar na lista.' 🔗 LINK NO STICKER do story: protocolorv.com.br/vip?o=story-d9",
      ],
      qtd: "5–6 orgânicos (véspera) + contagem regressiva.",
    },
    criativos: ["Sequência de Stories de véspera (6–8 cards) + enquete + contagem regressiva."],
    checklist: [
      "04:30 — Bom dia selfie + 'AMANHÃ abre'.",
      "Stories de véspera (enquete, depoimento, contagem).",
      "Confirmar que a lista VIP recebeu o toque T3 (cockpit › Jornada).",
      "Última chamada pra VIP antes de fechar.",
    ],
  },
  d13: {
    id: "d13",
    data: "2026-07-02",
    enfase: "🚀 LANÇAMENTO — converter a audiência aquecida em VENDA. Bio troca pra landing.",
    trafego: "PICO máximo. Campanha de CONVERSÃO pra landing (não mais /vip).",
    organico: {
      bomDia: "Bom dia em selfie, energia de abertura: 'ABRIU! A primeira turma do TRINCA RV21 está no ar.'",
      roteiro: [
        "Story 1 (selfie 07h): 'ABRIU! link na bio AGORA.'",
        "Stories ao longo do dia (selfie): depoimentos + contador de vagas + urgência real.",
        "Story noite (selfie): 'últimas vagas da primeira turma'.",
      ],
      qtd: "Dia inteiro: 3–4 ondas de stories (manhã, meio-dia, tarde, noite).",
    },
    criativos: ["Reel de abertura 'ABRIU' + cards de vagas/urgência + thumbnails."],
    checklist: [
      "04:30 — Bom dia selfie de abertura.",
      "07:00 — Postar Reel 'ABRIU' + trocar link da bio pra protocolorv.com.br (landing).",
      "07:05 — Confirmar disparo automático do link pra lista VIP (cockpit).",
      "Dia todo — 3–4 ondas de stories (depoimento + vagas + CTA).",
      "20:00 — Stories de fechamento ('últimas vagas').",
    ],
  },
};

// Mapeia uma data ISO (YYYY-MM-DD) para o id do plano do dia.
export function planByDate(isoDate: string): DiaPlan | null {
  for (const plan of Object.values(DIA_PLANS)) {
    if (plan.data === isoDate) return plan;
  }
  return null;
}
