/* Plano de conteúdo DIA A DIA do aquecimento TRINCA RV21 — 21 dias, 3 fases.
   Fonte única: aba Conteúdo (cockpit) + briefing automático (Telegram) + Agente 06.
   VOZ DO RURIÁ: homem, sério + bem-humorado + simpático + extrovertido. SEM coração,
   SEM emoção "afeminada". Jargões: "cuida", "bora agir", "bora cuidar na vida", abre com
   "E aí"/"Opa"/"Bom dia". Pré-lançamento: NÃO vende, NÃO fala preço, NÃO promete
   resultado/saúde, NÃO faz shaming. Captura pra LISTA VIP.
   NÚCLEO: só lança quando os 3 gates estiverem verdes (lista ~300 / CPL<=R$8 / criativo
   validado). A data serve o dado. A linguagem evolui com a fase (dor→identidade→escassez). */

export type Fase = "captacao" | "aquecimento" | "pre_lancamento";

export const FASES: Record<Fase, { nome: string; cor: string; dias: string; significado: string }> = {
  captacao: {
    nome: "Fase 1 · Captação fria",
    cor: "#d4a23c",
    dias: "D1–D7",
    significado: "Topo. Encher a Lista VIP com mulher certa e achar o gancho que engata. Dor + curiosidade, sem oferta.",
  },
  aquecimento: {
    nome: "Fase 2 · Aquecimento",
    cor: "#5fd08a",
    dias: "D8–D14",
    significado: "Meio. A lead pensa 'isso é pra mim, eu consigo'. Identidade + prova + micro-vitórias. Escala o que funcionou.",
  },
  pre_lancamento: {
    nome: "Fase 3 · Pré-lançamento",
    cor: "#f0c969",
    dias: "D15–D21",
    significado: "Fundo. 'Quero garantir minha vaga'. Antecipação + escassez real → abre carrinho QUANDO os 3 gates verdes.",
  },
};

export type DiaPlan = {
  id: string; // casa com contentCalendar (d1..d21)
  data: string; // "2026-06-26"
  fase: Fase;
  significado: string; // o que ESTE dia significa pro lead / pro projeto
  enfase: string; // foco do dia
  trafego: string; // o que fazer de tráfego pago no dia (HITL: só com SIM do Ruriá no Telegram)
  organico: {
    bomDia: string; // o que falar no 1o story (selfie), na voz do Ruriá
    roteiro: string[]; // sequência de stories orgânicos (selfie)
    qtd: string;
  };
  criativos: string[]; // o que o Claude cria pra esse dia (carrossel/card/thumb). Reel = Ruriá grava.
  checklist: string[]; // ordem cronológica do dia
};

/* REGRA DE OURO do story de bom dia: SEMPRE feche pedindo uma INTERAÇÃO que vira
   mensagem no Direct (alimenta o ManyChat). Resposta de TEXTO ao story + REAÇÃO disparam.
   Enquete/quiz/slider NÃO disparam (só engajam). Palavra-chave: SEGUNDA / QUERO / BORA / CUIDA. */
export const CTA_AUTOMACAO_STORY =
  "🔑 Feche o story pedindo interação que dispara o Direct: \"Responde SEGUNDA aqui (ou manda um 🔥) que eu te chamo no Direct.\" Resposta/reação ACIONAM o ManyChat → DM automática → quiz/VIP. Enquete NÃO dispara — use só pra engajar.";

/* SEQUÊNCIA DE STORIES DO DIA — explícita, reutilizável (a FRASE muda conforme a ênfase do dia).
   Mistura humano (selfie) + card de design (RV) + ferramenta NATIVA do IG.
   IMPORTANTE p/ o funil: só RESPOSTA DE TEXTO, REAÇÃO ou LINK levam pro Direct/VIP.
   Enquete/quiz/slider ALIMENTAM o algoritmo (alcance) mas NÃO disparam DM. */
export type StoryFrame = {
  n: number;
  bloco: string; // o que é o frame
  oQuePostar: string; // conteúdo (selfie ou card)
  ferramenta: string; // ferramenta nativa do IG a usar
  efeito: "DISPARA_DM" | "ALIMENTA_ALGORITMO" | "LEVA_AO_LINK"; // papel no funil
  cta: string; // como fechar / chamada
};

export const STORIES_SEQUENCIA_PADRAO: StoryFrame[] = [
  {
    n: 1,
    bloco: "Bom dia (selfie, você)",
    oQuePostar: "Selfie curto, luz natural, com a pergunta-espelho do dia (use o 'Bom dia' da aba).",
    ferramenta: "Emoji slider (\"como você acordou hoje? 😴 → 🔥\")",
    efeito: "ALIMENTA_ALGORITMO",
    cta: "Sem CTA forte aqui — é conexão. O slider aquece o alcance pros próximos.",
  },
  {
    n: 2,
    bloco: "Card de dor (design RV)",
    oQuePostar: "Card animado preto+ouro com a FRASE do dia (a ênfase). Pouco texto, impacto.",
    ferramenta: "Enquete de 2 opções (ex.: \"Você também esquece de você? SIM / Quase sempre\")",
    efeito: "ALIMENTA_ALGORITMO",
    cta: "A enquete gera identificação e empurra alcance. Não pede DM ainda.",
  },
  {
    n: 3,
    bloco: "Caixinha de perguntas (selfie ou card)",
    oQuePostar: "\"Me conta: o que mais te trava pra começar?\" — colhe dor real (vira conteúdo + abre conversa).",
    ferramenta: "Sticker de Perguntas",
    efeito: "DISPARA_DM",
    cta: "Responder a caixinha abre o Direct — responda algumas publicamente e puxe a conversa.",
  },
  {
    n: 4,
    bloco: "Mini-quiz (card)",
    oQuePostar: "\"Qual seu maior sabotador? Tempo / Culpa / Cansaço\" — diverte e segmenta.",
    ferramenta: "Sticker de Quiz",
    efeito: "ALIMENTA_ALGORITMO",
    cta: "No story seguinte, comente o resultado e leve pro frame 5.",
  },
  {
    n: 5,
    bloco: "CTA de captação (card RV + botão)",
    oQuePostar: "\"Quer um protocolo de 21 dias feito pro SEU corpo? Responde QUERO aqui 👇\"",
    ferramenta: "Sticker de LINK → protocolorv.com.br/vip-quiz  (e peça RESPOSTA de texto 'QUERO')",
    efeito: "LEVA_AO_LINK",
    cta: "Aqui é o pulo: RESPOSTA 'QUERO' dispara a DM (ManyChat) E o link leva direto pro quiz. Os dois caminhos pra Lista VIP.",
  },
  {
    n: 6,
    bloco: "Prova / bastidor (selfie) — opcional",
    oQuePostar: "Algo humano: treino, rotina, um print de resposta de lead. Gera prova e leveza.",
    ferramenta: "Contagem regressiva (forte na fase de pré-lançamento) ou reação",
    efeito: "DISPARA_DM",
    cta: "\"Manda um 🔥 que eu te chamo no Direct.\" Reação dispara a DM.",
  },
];

export const STORIES_GUIA =
  "Toda manhã, nesta ordem (5–6 stories). Regra de ouro: pelo menos 1 ENQUETE + 1 PERGUNTA/QUIZ (alcance) + 1 CTA QUERO (captação). Só TEXTO, REAÇÃO e LINK levam pro Direct/VIP — enquete/quiz só engajam. A FRASE do frame 2 e 5 muda conforme a ênfase do dia.";

export const DIA_PLANS: Record<string, DiaPlan> = {
  // ===================== FASE 1 · CAPTAÇÃO FRIA (D1–D7) =====================
  d1: {
    id: "d1",
    data: "2026-06-26",
    fase: "captacao",
    significado: "Primeiro contato. A lead pensa: 'achei um cara que entende a minha correria'. Plantar a ideia, sem vender nada.",
    enfase: "Você não falhou — o protocolo falhou com você.",
    trafego: "Tráfego ainda DESLIGADO. Só orgânico até o funil (quiz/DM) estar validado. (Qualquer verba = SIM seu no Telegram.)",
    organico: {
      bomDia:
        "Bom dia! Deixa eu te fazer uma pergunta meio sem vergonha: quantas vezes você já cuidou de todo mundo e sobrou você por último? Pois é. Hoje começa uma coisa que eu venho preparando faz tempo.",
      roteiro: [
        "Story 1 (selfie, luz natural): bom dia + a pergunta-espelho. Tom leve, sem drama.",
        "Story 2 (selfie): 'não é preguiça, é sobrecarga. Eu trabalho com isso há 14 anos.'",
        "Story 3 (selfie): adianta que vem um desafio de 21 dias feito pra mulher com rotina real.",
        "Story 4 (CTA): 'quem quer entrar antes de todo mundo, me responde SEGUNDA aqui que eu te chamo no Direct.'",
      ],
      qtd: "4–5 stories de manhã + 2–3 à tarde reforçando.",
    },
    criativos: [
      "Carrossel 'Salva isso: 3 sinais de que você se esqueceu' (preto+ouro, tipografia editorial).",
      "Capa/thumb do Reel D1 pra fixar no feed.",
    ],
    checklist: [
      "Manhã — gravar e postar os stories de bom dia (selfie).",
      "Gravar o Reel D1 'Você não falhou' (roteiro take-a-take na aba) e me subir o bruto.",
      "Eu edito o reel + entrego o carrossel pra você aprovar.",
      "Publicar reel + carrossel. CTA: comenta QUERO.",
      "Conferir no fim do dia: quantas responderam (DM disparada?).",
    ],
  },
  d2: {
    id: "d2",
    data: "2026-06-27",
    fase: "captacao",
    significado: "Tira o peso da culpa. A lead pensa: 'então o problema não era eu'. Isso gera confiança e abre ela pra ouvir.",
    enfase: "A culpa não é sua — é falta de protocolo.",
    trafego: "Orgânico. (Tráfego só com seu SIM.)",
    organico: {
      bomDia:
        "Opa, bom dia! Você já começou uma dieta na segunda toda animada e na quarta já tinha largado? Senta aí que hoje eu vou tirar uma culpa das suas costas — e não, a culpa não é sua.",
      roteiro: [
        "Story 1 (selfie): a pergunta 'começou segunda, parou quarta?'.",
        "Story 2 (selfie): 'plano que depende de motivação quebra. Bom protocolo diminui decisão.'",
        "Story 3 (CTA): 'me manda um 🔥 se você cansou de se culpar — eu te respondo no Direct.'",
      ],
      qtd: "4–5 stories + reforço à tarde.",
    },
    criativos: [
      "Carrossel 'Por que toda dieta falhou com você (não foi você)' — 5 slides.",
    ],
    checklist: [
      "Stories de bom dia (selfie).",
      "Gravar Reel D2 'A culpa não é sua' e subir o bruto.",
      "Eu edito + entrego o carrossel.",
      "Publicar. CTA: comenta QUERO.",
    ],
  },
  d3: {
    id: "d3",
    data: "2026-06-28",
    fase: "captacao",
    significado: "Quebra a objeção nº1 (tempo). A lead pensa: 'se é 15 min, isso eu consigo'. Reduz a barreira de entrada.",
    enfase: "15 minutos cabem até no seu dia mais corrido.",
    trafego: "Orgânico.",
    organico: {
      bomDia:
        "Bom dia! Sabe a desculpa que eu mais ouço em 14 anos? 'Ruriá, eu não tenho tempo.' E olha, tem razão — você não tem 1h de academia. Mas 15 minutos você tem. Deixa eu te provar.",
      roteiro: [
        "Story 1 (selfie): 'você não tem 1h, mas tem 15 min.'",
        "Story 2 (selfie): mostra a rotina real (café, criança, trabalho) e onde encaixam 15 min.",
        "Story 3 (CTA): 'responde SEGUNDA que eu te mando como funciona.'",
      ],
      qtd: "4–5 stories.",
    },
    criativos: [
      "Card 'A conta que ninguém te fez: 15 min/dia × 21 dias' (prova visual simples).",
    ],
    checklist: [
      "Stories de bom dia.",
      "Gravar Reel D3 '15 min cabe' e subir.",
      "Eu edito + card.",
      "Publicar. CTA: comenta QUERO.",
    ],
  },
  d4: {
    id: "d4",
    data: "2026-06-29",
    fase: "captacao",
    significado: "Ataca a dor de energia (a raiz). A lead pensa: 'é exatamente isso que eu sinto'. Conexão profunda = ela salva/compartilha.",
    enfase: "Energia pra você, não só pros outros.",
    trafego: "Orgânico.",
    organico: {
      bomDia:
        "E aí, tudo joia? Bom dia! Acorda já cansada, no automático, e ainda se cobra por isso? A raiz não é preguiça, é sobrecarga. Hoje eu te mostro por onde começa a virada.",
      roteiro: [
        "Story 1 (selfie): 'acorda já cansada? não é preguiça.'",
        "Story 2 (selfie): 3 micro-hábitos que devolvem energia (sem ser chato).",
        "Story 3 (CTA): 'manda 🔥 que eu te chamo no Direct com o resto.'",
      ],
      qtd: "4–5 stories.",
    },
    criativos: [
      "Carrossel '5 micro-hábitos que devolvem sua energia' — salvável.",
    ],
    checklist: [
      "Stories de bom dia.",
      "Gravar Reel D4 'Energia pra você' e subir.",
      "Eu edito + carrossel.",
      "Publicar. CTA: comenta QUERO.",
    ],
  },
  d5: {
    id: "d5",
    data: "2026-06-30",
    fase: "captacao",
    significado: "Pertencimento. A lead pensa: 'tem gente igual a mim aqui'. Começa a formar a 'turma' (efeito comunidade).",
    enfase: "A turma está se formando — quem é você?",
    trafego: "Orgânico.",
    organico: {
      bomDia:
        "Bom dia! Tá chegando muita mulher boa por aqui essa semana. Então bora se conhecer: me conta no Direct de onde você é e qual é a sua maior treta hoje — tempo, energia ou aquela culpa?",
      roteiro: [
        "Story 1 (selfie): 'quem tá chegando? bora se apresentar.'",
        "Story 2: repost de respostas/reações (prova social real, com print autorizado).",
        "Story 3 (CTA): 'responde aqui que eu te coloco na lista de prioridade.'",
      ],
      qtd: "4–6 stories (muita interação).",
    },
    criativos: [
      "Card 'A 1ª turma está se formando' (clima de comunidade, sem prometer nada).",
    ],
    checklist: [
      "Stories de bom dia + interação.",
      "Reel D5 bastidor/depoimento (você gravando solto) e subir.",
      "Eu edito + card.",
      "Repostar respostas (prova). CTA: comenta QUERO.",
    ],
  },
  d6: {
    id: "d6",
    data: "2026-07-01",
    fase: "captacao",
    significado: "Reforço leve + prova. A lead que ainda não entrou vê movimento e entra. Dia de consolidar, não de gravar pesado.",
    enfase: "Prova e leveza (sem cobrança).",
    trafego: "Orgânico. Avaliar 1º teste de verba (te trago no Telegram com gasto exato).",
    organico: {
      bomDia:
        "Bom dia! Final de semana é onde a maioria larga tudo — e é exatamente por isso que eu quero te ver firme. Bora cuidar na vida sem radicalismo?",
      roteiro: [
        "Story 1 (selfie): 'fim de semana não é desculpa, é treino de constância.'",
        "Story 2: prova social (mais respostas/reações).",
        "Story 3 (CTA): 'manda SEGUNDA que eu te garanto a prioridade.'",
      ],
      qtd: "3–4 stories.",
    },
    criativos: [
      "Recap visual da semana (3 cards) reforçando os ganchos que mais engajaram.",
    ],
    checklist: [
      "Stories de bom dia.",
      "Sem gravar reel (descanso de produção).",
      "Eu monto o recap + leio quais ganchos engataram mais.",
      "CTA do dia pra VIP.",
    ],
  },
  d7: {
    id: "d7",
    data: "2026-07-02",
    fase: "captacao",
    significado: "Fechamento da Fase 1. Eu (orquestrador) avalio: qual gancho converteu, qual criativo engatou, CPL se ligamos verba. Decide o que escala na Fase 2.",
    enfase: "Balanço da semana + escolher o que escala.",
    trafego: "Decisão de verba pra Fase 2 (te mando proposta com gasto inicial no Telegram).",
    organico: {
      bomDia:
        "Bom dia! Uma semana que você se colocou em primeiro lugar pelo menos uma vez por dia. Isso já é mais do que a maioria faz no ano. Bora pra próxima fase?",
      roteiro: [
        "Story 1 (selfie): retrospecto leve da semana.",
        "Story 2 (CTA): 'a próxima semana é mais quente. Responde SEGUNDA que você não fica de fora.'",
      ],
      qtd: "3–4 stories.",
    },
    criativos: [
      "Card 'Semana 1 fechada' + teaser da Fase 2.",
    ],
    checklist: [
      "Stories de bom dia.",
      "EU entrego o balanço: gancho campeão + criativo campeão + nº de VIPs.",
      "Definir com você o que escala na Fase 2.",
    ],
  },

  // ===================== FASE 2 · AQUECIMENTO (D8–D14) =====================
  d8: {
    id: "d8",
    data: "2026-07-03",
    fase: "aquecimento",
    significado: "Vira a chave de identidade. A lead deixa de ser 'curiosa' e passa a 'eu sou do tipo que cuida'. Aqui ela se compromete por dentro.",
    enfase: "Não é sobre o corpo perfeito — é sobre voltar a ser você.",
    trafego: "Escalar o criativo campeão da Fase 1 (proposta com gasto no Telegram).",
    organico: {
      bomDia:
        "Bom dia! Hoje a conversa é mais funda: o TRINCA não é sobre ficar perfeita pra foto. É sobre você voltar a se reconhecer no espelho. Bora?",
      roteiro: [
        "Story 1 (selfie): 'isso aqui é identidade, não vaidade.'",
        "Story 2: prova/depoimento de transformação real (com autorização).",
        "Story 3 (CTA): 'responde SEGUNDA, a turma tá quase fechando a prioridade.'",
      ],
      qtd: "4–5 stories.",
    },
    criativos: ["Carrossel 'Não é sobre o corpo perfeito' (identidade) — salvável."],
    checklist: ["Stories de bom dia.", "Reel D8 identidade — você grava.", "Eu edito + carrossel.", "Publicar. CTA QUERO."],
  },
  d9: {
    id: "d9",
    data: "2026-07-04",
    fase: "aquecimento",
    significado: "Prova social pesada. A lead pensa: 'se funcionou pra elas, funciona pra mim'. Reduz o medo de tentar de novo.",
    enfase: "Mulheres iguais a você conseguindo (espelho, não inveja).",
    trafego: "Escalar o que converte.",
    organico: {
      bomDia: "Bom dia! Hoje eu trouxe gente de verdade: mulher real, rotina real, virada real. Sem modelo fitness inatingível.",
      roteiro: ["Story 1 (selfie): introduz a prova do dia.", "Story 2: depoimento real.", "Story 3 (CTA): 'manda 🔥 que eu te chamo.'"],
      qtd: "4–5 stories.",
    },
    criativos: ["Carrossel de prova social (antes/depois ético, sem promessa) — com autorização."],
    checklist: ["Stories de bom dia.", "Reel D9 prova — você grava.", "Eu edito + carrossel.", "Publicar. CTA QUERO."],
  },
  d10: {
    id: "d10",
    data: "2026-07-05",
    fase: "aquecimento",
    significado: "Micro-vitória. A lead aplica uma dica e sente um ganho hoje — isso cria reciprocidade (ela retribui com atenção/compra futura).",
    enfase: "Uma vitória pequena hoje (reciprocidade).",
    trafego: "Escalar.",
    organico: {
      bomDia: "Bom dia! Hoje eu te dou uma dica que funciona já HOJE — sem comprar nada. Faz e me conta no Direct se sentiu diferença.",
      roteiro: ["Story 1 (selfie): a dica prática do dia.", "Story 2 (CTA): 'fez? me responde aqui.'"],
      qtd: "3–4 stories.",
    },
    criativos: ["Card prático 'faça isso hoje' (entrega de valor real)."],
    checklist: ["Stories de bom dia.", "Reel D10 dica prática — você grava.", "Eu edito + card.", "Publicar."],
  },
  d11: {
    id: "d11",
    data: "2026-07-06",
    fase: "aquecimento",
    significado: "Ancoragem de valor. A lead começa a perceber o tamanho do que vai receber (sem preço ainda). Prepara a percepção de 'vale muito'.",
    enfase: "O tamanho do que vem (sem falar preço).",
    trafego: "Escalar.",
    organico: {
      bomDia: "Bom dia! Deixa eu te mostrar o que tem dentro desse desafio — porque não é 'mais um PDF'. É treino, dieta e acompanhamento, junto.",
      roteiro: ["Story 1 (selfie): o que tem dentro (sem preço).", "Story 2 (CTA): 'quer entrar antes? responde SEGUNDA.'"],
      qtd: "4 stories.",
    },
    criativos: ["Carrossel 'O que tem dentro do TRINCA' (entregáveis, sem preço)."],
    checklist: ["Stories de bom dia.", "Reel D11 'o que tem dentro' — você grava.", "Eu edito + carrossel.", "Publicar."],
  },
  d12: {
    id: "d12",
    data: "2026-07-07",
    fase: "aquecimento",
    significado: "Objeção 'será que funciona pra mim?'. A lead vê o caso parecido com o dela respondido. Tira a última trava racional.",
    enfase: "Responder a objeção 'funciona pra mim?'.",
    trafego: "Escalar.",
    organico: {
      bomDia: "Bom dia! 'Ruriá, e se não funcionar pra mim?' Essa é a pergunta que mais aparece. Bora responder de frente.",
      roteiro: ["Story 1 (selfie): a objeção.", "Story 2: caso parecido com a persona.", "Story 3 (CTA): 'manda 🔥.'"],
      qtd: "4 stories.",
    },
    criativos: ["Carrossel 'E se não funcionar comigo?' (quebra de objeção honesta)."],
    checklist: ["Stories de bom dia.", "Reel D12 objeção — você grava.", "Eu edito + carrossel.", "Publicar."],
  },
  d13: {
    id: "d13",
    data: "2026-07-08",
    fase: "aquecimento",
    significado: "Comunidade forte. A lead se sente parte de algo. Cria pressão social positiva pra não ficar de fora no lançamento.",
    enfase: "A turma virou comunidade.",
    trafego: "Escalar.",
    organico: {
      bomDia: "Bom dia! Olha o tamanho dessa turma agora. Quem entrou no começo já tá se mexendo. Você não vai querer ser a única de fora, né?",
      roteiro: ["Story 1 (selfie): mostra o tamanho da turma.", "Story 2 (CTA): 'responde SEGUNDA pra garantir a prioridade.'"],
      qtd: "4 stories.",
    },
    criativos: ["Card 'a turma tá grande' (FOMO saudável, sem mentira)."],
    checklist: ["Stories de bom dia.", "Reel D13 comunidade — você grava.", "Eu edito + card.", "Publicar."],
  },
  d14: {
    id: "d14",
    data: "2026-07-09",
    fase: "aquecimento",
    significado: "Fechamento da Fase 2 + checagem dos gates. EU avalio: lista chegou perto de 300? CPL ok? criativo validado? Decide se entra na reta de lançamento.",
    enfase: "Balanço + checar os 3 gates do lançamento.",
    trafego: "Decisão: segura ou acelera (te mando no Telegram).",
    organico: {
      bomDia: "Bom dia! Duas semanas e você ainda tá aqui. Isso já diz muito sobre você. Semana que vem o jogo muda — fica ligada.",
      roteiro: ["Story 1 (selfie): retrospecto + teaser do pré-lançamento.", "Story 2 (CTA): 'responde SEGUNDA.'"],
      qtd: "3–4 stories.",
    },
    criativos: ["Card 'Fase 2 fechada' + teaser do pré-lançamento."],
    checklist: ["Stories de bom dia.", "EU entrego o status dos 3 gates.", "Decidir com você: acelera ou segura."],
  },

  // ===================== FASE 3 · PRÉ-LANÇAMENTO (D15–D21) =====================
  d15: {
    id: "d15",
    data: "2026-07-10",
    fase: "pre_lancamento",
    significado: "Liga a antecipação. A lead sabe que TÁ chegando. Começa a se preparar mentalmente pra decidir.",
    enfase: "Tá chegando: marca a data na cabeça dela.",
    trafego: "Campanha de antecipação pra quem já é VIP (te mando gasto).",
    organico: {
      bomDia: "Bom dia! Agora é oficial: tá chegando a abertura da 1ª turma do TRINCA RV21. Quem tá na VIP vai saber primeiro e pagar diferente. Bora?",
      roteiro: ["Story 1 (selfie): 'tá chegando'.", "Story 2 (CTA): 'se você ainda não tá na VIP, responde SEGUNDA agora.'"],
      qtd: "4–5 stories.",
    },
    criativos: ["Card 'A 1ª turma vai abrir' (antecipação, sem data fixa se gate não verde)."],
    checklist: ["Stories de bom dia.", "Reel D15 antecipação — você grava.", "Eu edito + card.", "Publicar."],
  },
  d16: {
    id: "d16",
    data: "2026-07-11",
    fase: "pre_lancamento",
    significado: "Reforça o porquê agora. A lead entende o custo de continuar como está (aversão à perda).",
    enfase: "O custo de NÃO começar (aversão à perda).",
    trafego: "Antecipação VIP.",
    organico: {
      bomDia: "Bom dia! Pergunta honesta: daqui a 21 dias você quer estar igual tá hoje, ou um passo na frente? Porque o tempo passa do mesmo jeito.",
      roteiro: ["Story 1 (selfie): o custo de não agir.", "Story 2 (CTA): 'VIP responde SEGUNDA.'"],
      qtd: "4 stories.",
    },
    criativos: ["Carrossel 'Onde você vai estar em 21 dias?' (aversão à perda, sem promessa)."],
    checklist: ["Stories de bom dia.", "Reel D16 — você grava.", "Eu edito + carrossel.", "Publicar."],
  },
  d17: {
    id: "d17",
    data: "2026-07-12",
    fase: "pre_lancamento",
    significado: "Prova final + autoridade. A lead confia que VOCÊ é o cara certo (14 anos, protocolo). Tira o medo de errar a escolha.",
    enfase: "Por que comigo (autoridade, sem arrogância).",
    trafego: "Antecipação VIP.",
    organico: {
      bomDia: "Bom dia! 14 anos transformando mulher que já tinha desistido de si mesma. Não é sorte, é protocolo. Deixa eu te mostrar.",
      roteiro: ["Story 1 (selfie): autoridade leve.", "Story 2: prova.", "Story 3 (CTA): 'VIP responde SEGUNDA.'"],
      qtd: "4 stories.",
    },
    criativos: ["Carrossel 'Por que o Protocolo RV funciona' (protocolo, não milagre)."],
    checklist: ["Stories de bom dia.", "Reel D17 autoridade — você grava.", "Eu edito + carrossel.", "Publicar."],
  },
  d18: {
    id: "d18",
    data: "2026-07-13",
    fase: "pre_lancamento",
    significado: "Escassez real começa. A lead entende que vaga é limitada (de verdade — turma acompanhada de perto). Cria urgência honesta.",
    enfase: "Vaga limitada de verdade (turma acompanhada).",
    trafego: "Antecipação VIP + lembrete de abertura.",
    organico: {
      bomDia: "Bom dia! Importante: a 1ª turma é limitada porque eu acompanho de perto. Não é marketing — é que eu não consigo cuidar bem de gente demais ao mesmo tempo.",
      roteiro: ["Story 1 (selfie): escassez real explicada.", "Story 2 (CTA): 'VIP entra primeiro — responde SEGUNDA.'"],
      qtd: "4–5 stories.",
    },
    criativos: ["Card 'turma limitada (de verdade)' — escassez honesta."],
    checklist: ["Stories de bom dia.", "Reel D18 escassez — você grava.", "Eu edito + card.", "Publicar."],
  },
  d19: {
    id: "d19",
    data: "2026-07-14",
    fase: "pre_lancamento",
    significado: "Véspera. A lead VIP é avisada que ela compra primeiro e melhor. Prepara a conversão (ainda sem carrinho geral).",
    enfase: "VIP compra primeiro e melhor (preparação).",
    trafego: "Lembrete forte pra VIP.",
    organico: {
      bomDia: "Bom dia! Amanhã/depois a turma abre. Quem tá na VIP recebe o link antes de todo mundo e com a condição de lançamento. Fica de olho no Direct.",
      roteiro: ["Story 1 (selfie): véspera, VIP primeiro.", "Story 2 (CTA): 'última chamada da VIP: responde SEGUNDA.'"],
      qtd: "4 stories.",
    },
    criativos: ["Card 'VIP entra primeiro' (condição de lançamento)."],
    checklist: ["Stories de bom dia.", "Reel D19 véspera — você grava.", "Eu edito + card.", "Confirmar os 3 gates ANTES de abrir."],
  },
  d20: {
    id: "d20",
    data: "2026-07-15",
    fase: "pre_lancamento",
    significado: "ABERTURA pra VIP (se gates verdes). A lead VIP recebe o carrinho primeiro. Conversão começa pelo público mais quente.",
    enfase: "Abertura VIP (SOMENTE se os 3 gates verdes).",
    trafego: "Conversão: campanha pra VIP/retargeting (gasto no Telegram).",
    organico: {
      bomDia: "Bom dia! Tá aberto pra VIP! Se você respondeu SEGUNDA nesses dias, o link já tá indo pro seu Direct com a condição de lançamento. Bora agir.",
      roteiro: ["Story 1 (selfie): 'abriu pra VIP'.", "Story 2: prova de quem já entrou.", "Story 3 (CTA): 'VIP, confere o Direct.'"],
      qtd: "5–6 stories.",
    },
    criativos: ["Card 'Abriu pra VIP' + sequência de stories de conversão."],
    checklist: ["CONFIRMAR 3 gates verdes (sem isso, NÃO abre).", "Stories de abertura.", "Disparar link VIP (Kiwify).", "Acompanhar vendas no cockpit."],
  },
  d21: {
    id: "d21",
    data: "2026-07-16",
    fase: "pre_lancamento",
    significado: "Abertura geral / última chamada. Converte o resto da lista com escassez real (vagas acabando).",
    enfase: "Abertura geral + última chamada (escassez real).",
    trafego: "Conversão full (gasto no Telegram).",
    organico: {
      bomDia: "Bom dia! Abriu pra geral — e as vagas da 1ª turma são limitadas de verdade. Quem tava esperando, é agora. Bora cuidar na vida.",
      roteiro: ["Story 1 (selfie): 'abriu geral'.", "Story 2: prova + contagem de vagas.", "Story 3 (CTA): 'última chamada, link na bio/Direct.'"],
      qtd: "6+ stories (dia de conversão).",
    },
    criativos: ["Sequência de conversão: card 'vagas acabando' + prova + CTA final."],
    checklist: ["Stories de abertura geral.", "Disparar pra lista toda.", "Acompanhar e reportar vendas em tempo real.", "Fechar a turma quando lotar."],
  },
};

/* Mapeia uma data ISO (YYYY-MM-DD) pro plano do dia. Usado pelo briefing 4h (Telegram)
   e pelo Agente 06. Se a data não bater com nenhum dia do aquecimento, cai no D1. */
export function planByDate(iso: string): DiaPlan {
  const found = Object.values(DIA_PLANS).find((p) => p.data === iso);
  return found || DIA_PLANS.d1;
}
