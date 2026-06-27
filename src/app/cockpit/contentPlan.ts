/* Plano de conteúdo DIA A DIA do aquecimento TRINCA RV21 — 21 dias, 3 fases.
   Fonte ÚNICA: aba Conteúdo (cockpit) + briefing 4:30 (Telegram) + Agente 06.
   VOZ DO RURIÁ: homem, direto, LEVEMENTE AGRESSIVO + humor + retenção (curiosidade do 1º
   ao último segundo). Sem coração. Hook que para o scroll em ≤3s, verdade que confronta sem
   ofender, payoff no fim. Jargões: "cuida", "bora agir", "bora cuidar na vida".
   PALAVRA-CHAVE OFICIAL: QUERO (nunca "SEGUNDA"). PROTOCOLO, nunca "método".
   Pré-lançamento: NÃO vende, NÃO fala preço, NÃO promete resultado/saúde, NÃO faz shaming.
   CONTAGEM REGRESSIVA: sempre expor quantos dias faltam pro lançamento (diasParaLancamento). */

export type Fase = "captacao" | "aquecimento" | "pre_lancamento";

export const LANCAMENTO_OFICIAL = "2026-07-16"; // alvo (ajustável). Só abre de fato com os 3 gates verdes.

export function diasParaLancamento(iso: string): number {
  const a = new Date(`${iso}T00:00:00-03:00`);
  const b = new Date(`${LANCAMENTO_OFICIAL}T00:00:00-03:00`);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

export const FASES: Record<Fase, { nome: string; cor: string; dias: string; significado: string }> = {
  captacao: { nome: "Fase 1 · Captação fria", cor: "#d4a23c", dias: "D1–D7", significado: "Topo. Encher a Lista VIP com mulher certa e achar o gancho que engata. Dor + curiosidade, sem oferta." },
  aquecimento: { nome: "Fase 2 · Aquecimento", cor: "#5fd08a", dias: "D8–D14", significado: "Meio. 'Isso é pra mim, eu consigo'. Identidade + prova + micro-vitórias. Escala o que funcionou." },
  pre_lancamento: { nome: "Fase 3 · Pré-lançamento", cor: "#f0c969", dias: "D15–D21", significado: "Fundo. 'Quero garantir minha vaga'. Antecipação + escassez real → abre carrinho QUANDO os 3 gates verdes." },
};

export type DiaPlan = {
  id: string;
  data: string;
  fase: Fase;
  significado: string;
  enfase: string;
  trafego: string;
  organico: { bomDia: string; roteiro: string[]; qtd: string };
  reelRoteiro: string; // take-a-take completo (timecode) — Ruriá grava
  legenda: string; // legenda pronta pra postar
  capa: string; // brief da CAPA/thumbnail do reel (sincronizada com o roteiro)
  criativos: string[];
  checklist: string[];
};

export const CTA_AUTOMACAO_STORY =
  "🔑 Feche o story pedindo RESPOSTA \"QUERO\" (ou reação 🔥): dispara o Direct → DM → quiz/VIP. Enquete/quiz/slider só engajam (alcance), NÃO disparam DM. Palavra-chave oficial: QUERO.";

/* AGENDA + sequência de stories do dia. Horários sugeridos, ferramenta nativa por frame
   e o LINK pra usar (alterna keyword QUERO ↔ link clicável). A FRASE muda com a ênfase do dia. */
export type StoryFrame = {
  n: number;
  horario: string;
  bloco: string;
  oQuePostar: string;
  ferramenta: string;
  efeito: "DISPARA_DM" | "ALIMENTA_ALGORITMO" | "LEVA_AO_LINK";
  link?: string;
  cta: string;
};

export const STORIES_SEQUENCIA_PADRAO: StoryFrame[] = [
  { n: 1, horario: "04:30", bloco: "Bom dia (selfie, você)", oQuePostar: "Selfie, luz natural, falando o FOCO do dia / pré-lançamento (use o 'Bom dia' da aba). Hook em 3s.", ferramenta: "Emoji slider (\"como você acordou? 😴 → 🔥\")", efeito: "ALIMENTA_ALGORITMO", cta: "Conexão + aquece alcance. Sem CTA forte." },
  { n: 2, horario: "09:00", bloco: "Card de dor (design animado RV)", oQuePostar: "Card animado preto+ouro com a FRASE do dia + selo de contagem regressiva.", ferramenta: "Enquete 2 opções (\"Você também esquece de você? SIM / Quase sempre\")", efeito: "ALIMENTA_ALGORITMO", cta: "Identificação + alcance. Sem DM ainda." },
  { n: 3, horario: "12:00", bloco: "Caixinha de perguntas", oQuePostar: "\"Me conta: o que mais te trava pra começar?\" — colhe dor real, abre conversa.", ferramenta: "Sticker de Perguntas", efeito: "DISPARA_DM", cta: "Responder abre o Direct. Responda algumas publicamente." },
  { n: 4, horario: "15:00", bloco: "Mini-quiz (card animado)", oQuePostar: "\"Qual seu maior sabotador? Tempo / Culpa / Cansaço\".", ferramenta: "Sticker de Quiz", efeito: "ALIMENTA_ALGORITMO", cta: "Segmenta. No story seguinte leva pro CTA." },
  { n: 5, horario: "18:00", bloco: "CTA captação (card animado + botão)", oQuePostar: "\"Quer um protocolo de 21 dias feito pro SEU corpo? Toca aqui 👇\" — o pulo do dia.", ferramenta: "Sticker de LINK + peça RESPOSTA 'QUERO' (alterna: 1 dia link clicável, outro dia keyword QUERO)", efeito: "LEVA_AO_LINK", link: "https://protocolorv.com.br/vip-quiz", cta: "RESPOSTA 'QUERO' dispara a DM E o link leva direto pro quiz. Dois caminhos pra VIP." },
  { n: 6, horario: "20:30", bloco: "Contagem regressiva (selfie/card)", oQuePostar: "Mostra quantos dias faltam pro lançamento + bastidor/prova humano.", ferramenta: "Sticker de Contagem regressiva (countdown) + reação 🔥", efeito: "DISPARA_DM", link: "https://protocolorv.com.br/vip", cta: "Reação dispara DM. Reforça escassez/antecipação." },
];

export const STORIES_GUIA =
  "Agenda diária (6 stories, horários sugeridos). Regra: 1 ENQUETE + 1 PERGUNTA/QUIZ (alcance) + 1 CTA QUERO/LINK (captação) + 1 CONTAGEM REGRESSIVA. Só TEXTO, REAÇÃO e LINK levam pro Direct/VIP. ALTERNE o frame 5 entre LINK clicável (vip-quiz) e keyword 'QUERO'. Criativos dos cards = thumbnails ANIMADOS, estética IA + edição profissional, preto+ouro RV.";

export const DIA_PLANS: Record<string, DiaPlan> = {
  // ===================== FASE 1 · CAPTAÇÃO FRIA (D1–D7) =====================
  d1: {
    id: "d1", data: "2026-06-26", fase: "captacao",
    significado: "Primeiro contato. 'Achei um cara que entende a minha correria'. Plantar a ideia, sem vender.",
    enfase: "Você não falhou. O protocolo é que falhou com você.",
    trafego: "DESLIGADO. Só orgânico até o funil validar. (Verba = SIM seu no Telegram.)",
    organico: {
      bomDia: "Bom dia! Pergunta sincera: quantas vezes você já começou e parou? Cinco? Dez? Presta atenção que isso aqui tira um peso das tuas costas — o problema nunca foi você.",
      roteiro: ["Story 1 (selfie): hook 'quantas vezes começou e parou?' + 'o problema não é você'.", "Story 2 (selfie): 'te deram o plano de outra pessoa — corpo e rotina que não são os seus. Ia quebrar.'", "Story 3 (selfie): 14 anos montando protocolo pra mulher de rotina real. Vem um desafio de 21 dias.", "Story 4 (card CTA): 'responde QUERO que eu te mando o teste no Direct.'"],
      qtd: "6 stories (agenda 04:30→20:30).",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Você lembra do remédio do filho, da reunião, do aniversário de todo mundo... mas esquece de VOCÊ, né?"
[00:04-00:14] MEIO CORPO | "E ainda se cobra. Mas não é falta de vontade — te deram o plano de outra pessoa. Ia quebrar mesmo."
[00:14-00:24] CLOSE | "Eu fiz diferente: um teste de 40 segundos que monta um protocolo de 21 dias pro SEU corpo, seu tempo, sua rotina."
[00:24-00:30] APONTA | "Comenta QUERO que eu te mando o teste. Dessa vez é diferente — bora cuidar de você?"
TEXTO NA TELA: "você esquece de VOCÊ" | "te deram o plano errado" | "teste de 40s" | "Comenta QUERO"`,
    legenda: `Você não falhou. Repete comigo: você NÃO falhou.\n\nVocê lembra do remédio do filho, da senha do banco, do aniversário da sogra… mas "esquece" de cuidar de você. Coincidência? Não.\n\nTe empurraram dieta de modelo e treino de atleta, e a culpa sobrou pra você. Mentira: o PROTOCOLO é que falhou com você. Era genérico, não era SEU.\n\nComenta QUERO que eu te mando no Direct um teste de 40s que monta seu protocolo de 21 dias.\nBora cuidar de você na vida. 💪\n\n#desafio21dias #mulher40 #autocuidado #emagrecimentofeminino #protocolorv`,
    capa: "Card preto+ouro: texto grande 'VOCÊ NÃO FALHOU' (FALHOU em ouro) + selo ⏳ topo direito 'FALTAM X DIAS' + RV no rodapé. Sem foto (tema sério).",
    criativos: ["Carrossel 'Salva isso: 3 sinais de que você se esqueceu' (preto+ouro, editorial).", "Thumbnail/capa animada do Reel D1."],
    checklist: ["04:30 — postar bom dia (selfie).", "Gravar Reel D1 e me subir o bruto.", "Eu edito + entrego capa e carrossel.", "Postar reel (capa do dia). CTA QUERO.", "Fim do dia: conferir DMs disparadas."],
  },
  d2: {
    id: "d2", data: "2026-06-27", fase: "captacao",
    significado: "Tira o peso da culpa. 'Então o problema não era eu'. Gera confiança.",
    enfase: "A culpa não é sua. Te venderam o plano errado.",
    trafego: "Orgânico. (Tráfego só com seu SIM.)",
    organico: {
      bomDia: "Bom dia! Começou a dieta na segunda animada e na quarta já tinha largado, né? Relaxa: não é falta de vontade. Hoje eu tiro uma culpa das tuas costas.",
      roteiro: ["Story 1 (selfie): 'começou segunda, largou quarta? a culpa não é sua.'", "Story 2 (selfie): 'plano que depende de motivação quebra. Protocolo bom tira o peso da decisão.'", "Story 3 (card CTA): 'cansou de se culpar? responde QUERO.'"],
      qtd: "6 stories (agenda 04:30→20:30).",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Você começa animada na segunda... e na quarta já largou. Adivinha de quem NÃO é a culpa?"
[00:04-00:15] MEIO CORPO | "Sua. Plano que depende só de motivação quebra. Protocolo bom diminui a decisão e encaixa na tua rotina."
[00:15-00:24] CLOSE | "Não é sobre força de vontade. É sobre direção. E isso eu te dou."
[00:24-00:30] APONTA | "Comenta QUERO que eu te explico no Direct."
TEXTO NA TELA: "A culpa não é sua" | "é falta de PROTOCOLO" | "Comenta QUERO"`,
    legenda: `A culpa não é sua. Repete isso.\n\nVocê começou na segunda, parou na quarta, e ainda se chamou de "sem força de vontade". Mentira.\n\nPlano que depende de motivação quebra. O que sustenta é PROTOCOLO: direção que cabe na sua vida real, não na vida de uma modelo.\n\nComenta QUERO que eu te explico no Direct.\nBora cuidar de você na vida. 💪\n\n#desafio21dias #mulher40 #disciplina #emagrecimentofeminino #protocolorv`,
    capa: "Card preto+ouro: 'A CULPA NÃO É SUA' (NÃO É SUA em ouro) + selo ⏳ 'FALTAM X DIAS' + RV. Opcional foto séria do Ruriá à esquerda.",
    criativos: ["Carrossel 'Por que toda dieta falhou com você (e não foi você)' — 5 slides.", "Thumbnail/capa animada do Reel D2."],
    checklist: ["04:30 — bom dia (selfie).", "Gravar Reel D2 e subir.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO."],
  },
  d3: {
    id: "d3", data: "2026-06-28", fase: "captacao",
    significado: "Quebra a objeção nº1 (tempo). 'Se é 15 min, eu consigo'. Reduz a barreira.",
    enfase: "Você não precisa de 1 hora. 15 minutos cabem.",
    trafego: "Orgânico.",
    organico: {
      bomDia: "Bom dia! A desculpa que mais ouço em 14 anos: 'Ruriá, não tenho tempo'. Você tem razão — 1h de academia você não tem. Mas 15 minutos, tem. Deixa eu provar.",
      roteiro: ["Story 1 (selfie): 'hora de treino é papo de quem tem tempo sobrando — mas 15 min você tem.'", "Story 2 (selfie): a rotina real (café/criança/trabalho) e onde encaixa 15 min.", "Story 3 (card CTA): 'responde QUERO que eu te mando como funciona.'"],
      qtd: "6 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Você não tem 1 hora pra treinar? Que bom. Hora de treino é papo de quem tem tempo sobrando — e você não tem."
[00:04-00:16] MEIO CORPO | "Te venderam academia 5x na semana. Isso foi pensado pra uma rotina bem mais livre que a sua. 15 minutos é o que cabe na vida real."
[00:16-00:24] CLOSE | "21 dias, 15 min por dia, guiado. Cabe até no dia mais corrido."
[00:24-00:30] APONTA | "Comenta QUERO."
TEXTO NA TELA: "você NÃO precisa de 1h" | "15 min cabe" | "Comenta QUERO"`,
    legenda: `Você não precisa de 1 hora. Precisa de 15 minutos e direção.\n\nTe venderam academia 5x na semana, 1h por dia — pensado pra uma rotina que não é a sua. Por isso travou.\n\n15 minutos guiados, em casa, por 21 dias. Isso cabe até no seu dia mais corrido.\n\nComenta QUERO que eu te mostro como funciona.\nBora cuidar de você na vida. 💪\n\n#desafio21dias #treinoemcasa #mulher40 #rotina #protocolorv`,
    capa: "Card preto+ouro: '15 MINUTOS' gigante (ouro) + 'é o que cabe na sua vida' + selo ⏳ + RV. Relógio minimal.",
    criativos: ["Card 'A conta que ninguém te fez: 15 min/dia × 21 dias'.", "Thumbnail/capa animada do Reel D3."],
    checklist: ["04:30 — bom dia.", "Gravar Reel D3 e subir.", "Eu edito + capa + card.", "Postar. CTA QUERO."],
  },
  d4: {
    id: "d4", data: "2026-06-29", fase: "captacao",
    significado: "Ataca a dor de energia (a raiz). 'É exatamente o que eu sinto'. Salva/compartilha.",
    enfase: "Acorda mais cansada do que deitou? Não é preguiça.",
    trafego: "Orgânico.",
    organico: {
      bomDia: "E aí, bom dia! Se você acorda MAIS cansada do que quando deitou e ainda se cobra, presta atenção: teu corpo não tá quebrado, tá no modo sobrevivência.",
      roteiro: ["Story 1 (selfie): 'acorda já cansada? não é preguiça, é sobrecarga.'", "Story 2 (selfie): 3 micro-hábitos que devolvem energia (com humor).", "Story 3 (card CTA): 'manda 🔥 ou responde QUERO.'"],
      qtd: "6 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Se você acorda MAIS cansada do que quando deitou, isso aqui não é preguiça. Presta atenção."
[00:04-00:15] MEIO CORPO | "Teu corpo não tá quebrado. Tá no modo sobrevivência — gastando tua energia toda nos outros e não sobrando nada pra você."
[00:15-00:24] CLOSE | "O protocolo de 21 dias começa destravando a SUA energia, não te fazendo sofrer mais."
[00:24-00:30] APONTA | "Comenta QUERO. Dessa vez é por você."
TEXTO NA TELA: "NÃO é preguiça" | "é sobrecarga" | "Comenta QUERO"`,
    legenda: `Acorda mais cansada do que deitou? Não é preguiça — é sobrecarga.\n\nVocê gasta sua energia toda nos outros e não sobra nada pra você. Aí se culpa por estar exausta. Para com isso.\n\nO protocolo de 21 dias começa devolvendo a SUA energia — sem dieta de sofrimento.\n\nComenta QUERO que eu te mando o primeiro passo.\nBora cuidar de você na vida. 💪\n\n#cansaco #energia #mulher40 #autocuidado #protocolorv`,
    capa: "Card preto+ouro: 'NÃO É PREGUIÇA' + 'é sobrecarga' (ouro) + selo ⏳ + RV. Foto séria/cansada do Ruriá opcional.",
    criativos: ["Carrossel '5 micro-hábitos que devolvem sua energia' — salvável.", "Thumbnail/capa animada do Reel D4."],
    checklist: ["04:30 — bom dia.", "Gravar Reel D4 e subir.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO."],
  },
  d5: {
    id: "d5", data: "2026-06-30", fase: "captacao",
    significado: "Pertencimento. 'Tem gente igual a mim aqui'. Forma a 'turma'.",
    enfase: "Tá chegando muita mulher certa. Qual é a sua treta?",
    trafego: "Orgânico.",
    organico: {
      bomDia: "Bom dia! Tá chegando muita mulher boa essa semana e eu amo isso. Bora se conhecer: me responde no Direct qual é a tua maior treta — tempo, energia ou a culpa?",
      roteiro: ["Story 1 (selfie): 'quem tá chegando? bora se apresentar.'", "Story 2: repost de respostas (prova social, print autorizado).", "Story 3 (card CTA): 'responde QUERO que eu te coloco na prioridade.'"],
      qtd: "6 stories (muita interação).",
    },
    reelRoteiro: `[00:00-00:05] CLOSE | "Olha quanta mulher boa chegou essa semana."
[00:05-00:16] MEIO CORPO | "E todas com a mesma treta: tempo, energia, culpa. Se você se identificou, você NÃO tá sozinha nisso."
[00:16-00:24] CLOSE | "A 1ª turma do TRINCA tá se formando. Mulher de rotina real, igual você."
[00:24-00:30] APONTA | "Comenta QUERO e entra na lista de prioridade."
TEXTO NA TELA: "você não tá sozinha" | "a 1ª turma tá se formando" | "Comenta QUERO"`,
    legenda: `Tá chegando muita mulher de rotina real por aqui — e todas com a mesma treta: tempo, energia e culpa.\n\nSe você se identificou, já sabe: você não tá sozinha. A 1ª turma do TRINCA tá se formando.\n\nComenta QUERO que eu te coloco na lista de prioridade.\nBora cuidar de você na vida. 💪\n\n#comunidade #mulher40 #desafio21dias #protocolorv`,
    capa: "Card preto+ouro: 'A 1ª TURMA ESTÁ SE FORMANDO' + selo ⏳ + RV. Clima de comunidade.",
    criativos: ["Card 'A 1ª turma está se formando'.", "Thumbnail/capa animada do Reel D5."],
    checklist: ["04:30 — bom dia + interação.", "Gravar Reel D5 (bastidor solto) e subir.", "Eu edito + capa + card.", "Repostar respostas. CTA QUERO."],
  },
  d6: {
    id: "d6", data: "2026-07-01", fase: "captacao",
    significado: "Reforço leve + prova. Quem não entrou vê movimento e entra. Consolidar.",
    enfase: "Fim de semana é onde a maioria larga. Você não.",
    trafego: "Orgânico. Avaliar 1º teste de verba (te trago no Telegram com gasto exato).",
    organico: {
      bomDia: "Bom dia! Sabe onde a maioria joga tudo pro alto? No fim de semana. Por isso eu quero te ver firme — sem radicalismo. Bora cuidar na vida do jeito que dá pra manter.",
      roteiro: ["Story 1 (selfie): 'fim de semana não é desculpa, é treino de constância.'", "Story 2: prova social.", "Story 3 (card CTA): 'responde QUERO que eu te garanto a prioridade.'"],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Sabe onde 90% das mulheres jogam tudo pro alto? No fim de semana."
[00:04-00:15] MEIO CORPO | "Sexta relaxa, sábado solta, domingo a culpa volta. E na segunda começa tudo de novo. Esse ciclo cansa, né?"
[00:15-00:24] CLOSE | "Constância não é radicalismo. É saber o que fazer no fim de semana sem se sabotar."
[00:24-00:30] APONTA | "Comenta QUERO."
TEXTO NA TELA: "o ciclo que te cansa" | "constância ≠ radicalismo" | "Comenta QUERO"`,
    legenda: `Sexta relaxa, sábado solta, domingo bate a culpa, segunda começa tudo de novo. Cansa, né?\n\nFim de semana não é desculpa — é treino de constância. E constância não é radicalismo: é saber o que fazer sem se sabotar.\n\nComenta QUERO que eu te garanto a prioridade na 1ª turma.\nBora cuidar de você na vida. 💪\n\n#constancia #fimdesemana #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'CONSTÂNCIA NÃO É RADICALISMO' (ouro em CONSTÂNCIA) + selo ⏳ + RV.",
    criativos: ["Recap visual da semana (3 cards) com os ganchos que mais engajaram.", "Thumbnail/capa animada do Reel D6."],
    checklist: ["04:30 — bom dia.", "Gravar Reel D6 e subir.", "Eu edito + capa + recap.", "Postar. CTA QUERO."],
  },
  d7: {
    id: "d7", data: "2026-07-02", fase: "captacao",
    significado: "Fechamento da Fase 1. EU avalio gancho/criativo/CPL. Decide o que escala.",
    enfase: "Uma semana cuidando de você. A maioria não faz isso no ano.",
    trafego: "Decisão de verba pra Fase 2 (proposta com gasto inicial no Telegram).",
    organico: {
      bomDia: "Bom dia! Uma semana inteira você se colocou em primeiro lugar pelo menos uma vez por dia. Isso já é mais do que a maioria faz no ano todo. Bora pra próxima?",
      roteiro: ["Story 1 (selfie): retrospecto leve da semana.", "Story 2 (card CTA): 'a próxima semana é mais quente. Responde QUERO que você não fica de fora.'"],
      qtd: "4 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Uma semana atrás você se cobrava por tudo. Olha onde você chegou."
[00:04-00:15] MEIO CORPO | "Você se colocou em primeiro lugar pelo menos uma vez por dia. Parece pouco? É mais do que a maioria faz no ano inteiro."
[00:15-00:24] CLOSE | "E isso é só a semana 1. A próxima é mais quente."
[00:24-00:30] APONTA | "Comenta QUERO pra não ficar de fora."
TEXTO NA TELA: "semana 1 ✓" | "você se priorizou" | "Comenta QUERO"`,
    legenda: `Uma semana atrás você se cobrava por tudo. Hoje você já se colocou em primeiro lugar pelo menos uma vez por dia.\n\nParece pouco? É mais do que a maioria faz no ano inteiro. E isso foi só a semana 1.\n\nA próxima é mais quente. Comenta QUERO pra não ficar de fora.\nBora cuidar de você na vida. 💪\n\n#semana1 #mulher40 #desafio21dias #protocolorv`,
    capa: "Card preto+ouro: 'SEMANA 1 ✓' + 'a próxima é mais quente' + selo ⏳ + RV.",
    criativos: ["Card 'Semana 1 fechada' + teaser da Fase 2.", "Thumbnail/capa animada do Reel D7."],
    checklist: ["04:30 — bom dia.", "Gravar Reel D7 e subir.", "EU entrego o balanço (gancho/criativo/VIPs).", "Postar. CTA QUERO."],
  },

  // ===================== FASE 2 · AQUECIMENTO (D8–D14) =====================
  d8: {
    id: "d8", data: "2026-07-03", fase: "aquecimento",
    significado: "Vira a chave de identidade. De 'curiosa' a 'eu sou do tipo que cuida'.",
    enfase: "Não é sobre corpo perfeito. É voltar a ser você.",
    trafego: "Escalar o criativo campeão da Fase 1 (proposta com gasto no Telegram).",
    organico: {
      bomDia: "Bom dia! Hoje a conversa é mais funda, senta aqui. O TRINCA não é sobre ficar perfeita pra foto — isso é papo de revista. É sobre você voltar a se reconhecer no espelho.",
      roteiro: ["Story 1 (selfie): 'isso é identidade, não vaidade.'", "Story 2: depoimento real (com autorização).", "Story 3 (card CTA): 'responde QUERO, a turma tá quase fechando a prioridade.'"],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Para tudo: o TRINCA NÃO é sobre você ficar perfeita pra foto."
[00:04-00:15] MEIO CORPO | "Corpo de revista é papo de quem vive na academia. Isso aqui é sobre você se olhar no espelho e se reconhecer de novo."
[00:15-00:24] CLOSE | "Identidade, não vaidade. É por isso que funciona pra mulher real."
[00:24-00:30] APONTA | "Comenta QUERO."
TEXTO NA TELA: "não é vaidade" | "é VOLTAR A SER VOCÊ" | "Comenta QUERO"`,
    legenda: `O TRINCA não é sobre corpo de revista. Isso é papo de quem vive na academia.\n\nÉ sobre você se olhar no espelho e se reconhecer de novo. Identidade, não vaidade. Por isso funciona pra mulher de verdade.\n\nComenta QUERO — a turma tá quase fechando a prioridade.\nBora cuidar de você na vida. 💪\n\n#autoestima #identidade #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'VOLTAR A SER VOCÊ' (ouro) + 'não é vaidade, é identidade' + selo ⏳ + RV.",
    criativos: ["Carrossel 'Não é sobre o corpo perfeito' — salvável.", "Thumbnail/capa animada do Reel D8."],
    checklist: ["04:30 — bom dia.", "Reel D8 identidade — você grava.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO."],
  },
  d9: {
    id: "d9", data: "2026-07-04", fase: "aquecimento",
    significado: "Prova social pesada. 'Se funcionou pra elas, funciona pra mim'.",
    enfase: "Mulher real, rotina real, virada real.",
    trafego: "Escalar o que converte.",
    organico: {
      bomDia: "Bom dia! Hoje eu trouxe gente de verdade: mulher real, rotina caótica, virada real. Nada de modelo fitness que vive na academia. Vem ver.",
      roteiro: ["Story 1 (selfie): introduz a prova do dia.", "Story 2: depoimento real.", "Story 3 (card CTA): 'manda 🔥 ou responde QUERO.'"],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Cansou de ver transformação de gente que já era magra? Eu também."
[00:04-00:15] MEIO CORPO | "Hoje eu trouxe mulher real: rotina caótica, filho, trabalho, casa. E mesmo assim, virada real. Sem mágica."
[00:15-00:24] CLOSE | "Se funcionou pra ela, com a vida dela, funciona pra você."
[00:24-00:30] APONTA | "Comenta QUERO."
TEXTO NA TELA: "mulher REAL" | "virada real" | "Comenta QUERO"`,
    legenda: `Cansou de ver "transformação" de gente que já era magra e tinha o dia livre? Eu também.\n\nHoje é mulher real: rotina caótica, filho, trabalho, casa — e mesmo assim, virada real. Sem mágica, com PROTOCOLO.\n\nSe funcionou pra ela, funciona pra você. Comenta QUERO.\nBora cuidar de você na vida. 💪\n\n#provasocial #mulherreal #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'MULHER REAL, VIRADA REAL' + selo ⏳ + RV. (Se houver, antes/depois ético com autorização.)",
    criativos: ["Carrossel de prova social (antes/depois ético, com autorização).", "Thumbnail/capa animada do Reel D9."],
    checklist: ["04:30 — bom dia.", "Reel D9 prova — você grava.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO."],
  },
  d10: {
    id: "d10", data: "2026-07-05", fase: "aquecimento",
    significado: "Micro-vitória. Aplica uma dica e sente ganho hoje (reciprocidade).",
    enfase: "Uma vitória pequena hoje, de graça.",
    trafego: "Escalar.",
    organico: {
      bomDia: "Bom dia! Hoje eu te dou uma dica que funciona já HOJE, sem comprar nada. Faz e me responde no Direct se sentiu diferença — aposto que sente.",
      roteiro: ["Story 1 (selfie): a dica prática do dia.", "Story 2 (card CTA): 'fez? me responde QUERO.'"],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Quer sentir uma diferença HOJE, sem gastar um centavo? Anota isso."
[00:04-00:16] MEIO CORPO | "[Ruriá entrega 1 dica prática real — ex.: ordem da refeição / 2 min de respiração ao acordar / água antes do café]. Simples e funciona."
[00:16-00:24] CLOSE | "Imagina isso guiado, todo dia, por 21 dias. É o protocolo."
[00:24-00:30] APONTA | "Faz hoje e comenta QUERO me contando."
TEXTO NA TELA: "faça isso HOJE" | "de graça" | "Comenta QUERO"`,
    legenda: `Quer sentir diferença HOJE, sem gastar nada? Anota:\n\n[a dica prática do reel]. Simples, e funciona de verdade.\n\nAgora imagina isso guiado, todo dia, por 21 dias — é o protocolo. Faz hoje e comenta QUERO me contando se sentiu.\nBora cuidar de você na vida. 💪\n\n#dicarapida #mulher40 #habitos #protocolorv`,
    capa: "Card preto+ouro: 'FAÇA ISSO HOJE' (ouro) + 'de graça' + selo ⏳ + RV.",
    criativos: ["Card prático 'faça isso hoje' (valor real).", "Thumbnail/capa animada do Reel D10."],
    checklist: ["04:30 — bom dia.", "Reel D10 dica — você grava.", "Eu edito + capa + card.", "Postar. CTA QUERO."],
  },
  d11: {
    id: "d11", data: "2026-07-06", fase: "aquecimento",
    significado: "Ancoragem de valor. Percebe o tamanho do que vem (sem preço).",
    enfase: "Não é 'mais um PDF'. É treino + dieta + acompanhamento.",
    trafego: "Escalar.",
    organico: {
      bomDia: "Bom dia! Deixa eu te mostrar o que tem dentro desse desafio — porque não é 'mais um e-book pra criar poeira no celular'. É treino, dieta e acompanhamento, junto.",
      roteiro: ["Story 1 (selfie): o que tem dentro (sem preço).", "Story 2 (card CTA): 'quer entrar antes? responde QUERO.'"],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Você já comprou e-book fitness que virou poeira no celular? Pois é, isso aqui NÃO é isso."
[00:04-00:16] MEIO CORPO | "É treino guiado + alimentação por objetivo + acompanhamento. Junto. Porque PDF solto ninguém segue — você já tentou."
[00:16-00:24] CLOSE | "21 dias com direção de verdade, não um arquivo te julgando."
[00:24-00:30] APONTA | "Comenta QUERO pra ver tudo por dentro."
TEXTO NA TELA: "não é mais um PDF" | "treino+dieta+suporte" | "Comenta QUERO"`,
    legenda: `Quantos e-books fitness você já comprou que viraram poeira no celular?\n\nO TRINCA não é isso. É treino guiado + alimentação por objetivo + acompanhamento, junto. Porque PDF solto ninguém segue — você já tentou.\n\nComenta QUERO que eu te mostro tudo por dentro.\nBora cuidar de você na vida. 💪\n\n#desafio21dias #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'NÃO É MAIS UM PDF' + 'treino + dieta + suporte' (ouro) + selo ⏳ + RV.",
    criativos: ["Carrossel 'O que tem dentro do TRINCA' (entregáveis, sem preço).", "Thumbnail/capa animada do Reel D11."],
    checklist: ["04:30 — bom dia.", "Reel D11 — você grava.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO."],
  },
  d12: {
    id: "d12", data: "2026-07-07", fase: "aquecimento",
    significado: "Objeção 'funciona pra mim?'. Vê o caso parecido respondido.",
    enfase: "'E se não funcionar comigo?' — bora responder de frente.",
    trafego: "Escalar.",
    organico: {
      bomDia: "Bom dia! A pergunta que mais cai no meu Direct: 'Ruriá, e se não funcionar pra mim?'. Justa. Em vez de te enrolar, hoje eu respondo na lata.",
      roteiro: ["Story 1 (selfie): a objeção.", "Story 2: caso parecido com a persona.", "Story 3 (card CTA): 'responde QUERO ou manda 🔥.'"],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "'E se não funcionar pra mim?' — a pergunta que mais cai no meu Direct. Bora de frente."
[00:04-00:16] MEIO CORPO | "Funciona porque NÃO depende de você ter pique de atleta. Depende de seguir um passo por dia, ajustado pra tua realidade. Quem some é PDF, não você."
[00:16-00:24] CLOSE | "Já funcionou pra mulher mais sem tempo que você. Vai funcionar pra você também."
[00:24-00:30] APONTA | "Comenta QUERO."
TEXTO NA TELA: "e se não funcionar?" | "não depende de pique" | "Comenta QUERO"`,
    legenda: `"E se não funcionar pra mim?" — a pergunta que mais cai no meu Direct. Resposta honesta:\n\nFunciona porque NÃO depende de você ter pique de atleta. Depende de um passo por dia, ajustado pra sua realidade. Quem some é PDF — você não.\n\nComenta QUERO que eu te mostro um caso igual ao seu.\nBora cuidar de você na vida. 💪\n\n#objecao #mulher40 #desafio21dias #protocolorv`,
    capa: "Card preto+ouro: 'E SE NÃO FUNCIONAR PRA MIM?' (com aspas) + selo ⏳ + RV.",
    criativos: ["Carrossel 'E se não funcionar comigo?' (quebra de objeção honesta).", "Thumbnail/capa animada do Reel D12."],
    checklist: ["04:30 — bom dia.", "Reel D12 objeção — você grava.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO."],
  },
  d13: {
    id: "d13", data: "2026-07-08", fase: "aquecimento",
    significado: "Comunidade forte. Pressão social positiva pra não ficar de fora.",
    enfase: "A turma virou comunidade. Você não vai querer ficar de fora.",
    trafego: "Escalar.",
    organico: {
      bomDia: "Bom dia! Olha o tamanho dessa turma agora. Quem entrou no começo já tá se mexendo, trocando ideia. E você aí, vai ser a única assistindo de camarote?",
      roteiro: ["Story 1 (selfie): mostra o tamanho da turma.", "Story 2 (card CTA): 'responde QUERO pra garantir a prioridade.'"],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Enquanto você pensa, olha o tamanho da turma que já tá dentro."
[00:04-00:15] MEIO CORPO | "Mulher trocando ideia, se cobrando junto, comemorando vitória pequena. Isso muda tudo — sozinha a gente desiste, junto a gente segue."
[00:15-00:24] CLOSE | "Você não vai querer ser a única assistindo de camarote, vai?"
[00:24-00:30] APONTA | "Comenta QUERO e entra na prioridade."
TEXTO NA TELA: "a turma tá grande" | "junto a gente segue" | "Comenta QUERO"`,
    legenda: `Sozinha a gente desiste. Junto, a gente segue.\n\nOlha o tamanho da turma que já tá dentro — mulher se cobrando junto, comemorando cada vitória pequena. Isso muda tudo.\n\nVocê não vai querer ser a única de camarote. Comenta QUERO e entra na prioridade.\nBora cuidar de você na vida. 💪\n\n#comunidade #mulher40 #desafio21dias #protocolorv`,
    capa: "Card preto+ouro: 'JUNTO A GENTE SEGUE' (ouro em JUNTO) + selo ⏳ + RV. Clima de turma.",
    criativos: ["Card 'a turma tá grande' (FOMO saudável).", "Thumbnail/capa animada do Reel D13."],
    checklist: ["04:30 — bom dia.", "Reel D13 comunidade — você grava.", "Eu edito + capa + card.", "Postar. CTA QUERO."],
  },
  d14: {
    id: "d14", data: "2026-07-09", fase: "aquecimento",
    significado: "Fechamento da Fase 2 + checagem dos gates.",
    enfase: "Duas semanas firme. Semana que vem o jogo muda.",
    trafego: "Decisão: segura ou acelera (te mando no Telegram).",
    organico: {
      bomDia: "Bom dia! Duas semanas e você ainda tá aqui, firme. A maioria já tinha sumido. Semana que vem o jogo muda — fica ligada.",
      roteiro: ["Story 1 (selfie): retrospecto + teaser do pré-lançamento.", "Story 2 (card CTA): 'responde QUERO.'"],
      qtd: "4 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Duas semanas. Sabe quantas mulheres chegam até aqui? Pouquíssimas. E você é uma delas."
[00:04-00:15] MEIO CORPO | "Isso não é sorte. É você decidindo se priorizar todo dia. E é exatamente esse tipo de mulher que eu quero na 1ª turma."
[00:15-00:24] CLOSE | "Semana que vem o jogo muda: abre a prioridade pra quem tá na VIP."
[00:24-00:30] APONTA | "Não tá na VIP ainda? Comenta QUERO agora."
TEXTO NA TELA: "2 semanas firme" | "o jogo vai mudar" | "Comenta QUERO"`,
    legenda: `Duas semanas. Sabe quantas mulheres chegam firmes até aqui? Pouquíssimas — e você é uma delas.\n\nNão é sorte: é você se priorizando todo dia. Semana que vem o jogo muda e a VIP entra primeiro.\n\nAinda não tá na VIP? Comenta QUERO agora.\nBora cuidar de você na vida. 💪\n\n#mulher40 #desafio21dias #protocolorv`,
    capa: "Card preto+ouro: '2 SEMANAS FIRME' + 'o jogo vai mudar' (ouro) + selo ⏳ + RV.",
    criativos: ["Card 'Fase 2 fechada' + teaser do pré-lançamento.", "Thumbnail/capa animada do Reel D14."],
    checklist: ["04:30 — bom dia.", "Reel D14 — você grava.", "EU entrego o status dos 3 gates.", "Postar. CTA QUERO."],
  },

  // ===================== FASE 3 · PRÉ-LANÇAMENTO (D15–D21) =====================
  d15: {
    id: "d15", data: "2026-07-10", fase: "pre_lancamento",
    significado: "Liga a antecipação. 'Tá chegando'. Começa a se preparar pra decidir.",
    enfase: "Tá chegando a abertura da 1ª turma.",
    trafego: "Campanha de antecipação pra quem já é VIP (te mando gasto).",
    organico: {
      bomDia: "Bom dia! Agora é oficial: tá chegando a abertura da 1ª turma do TRINCA RV21. Quem tá na VIP sabe primeiro e entra em condição diferente. Quem não tá... vai correr atrás.",
      roteiro: ["Story 1 (selfie): 'tá chegando' + contagem regressiva.", "Story 2 (card CTA): 'ainda não tá na VIP? responde QUERO agora.'"],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Agora é oficial: a 1ª turma do TRINCA RV21 tá pra abrir."
[00:04-00:15] MEIO CORPO | "E eu vou ser honesto: quem tá na lista VIP entra primeiro e em condição diferente. Quem deixou pra depois, vai correr atrás — e às vezes não dá tempo."
[00:15-00:24] CLOSE | "Então decide agora de que lado você quer estar quando abrir."
[00:24-00:30] APONTA | "Comenta QUERO e garante a VIP."
TEXTO NA TELA: "TÁ CHEGANDO" | "VIP entra primeiro" | "Comenta QUERO"`,
    legenda: `Agora é oficial: a 1ª turma do TRINCA RV21 tá pra abrir.\n\nVou ser honesto: quem tá na lista VIP entra primeiro e em condição diferente. Quem deixar pra depois vai correr atrás — e às vezes não dá tempo.\n\nComenta QUERO e garante sua VIP antes de todo mundo.\nBora cuidar de você na vida. 💪\n\n#prelancamento #listavip #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'TÁ CHEGANDO' (ouro) + 'a 1ª turma vai abrir' + selo ⏳ GRANDE (contagem) + RV.",
    criativos: ["Card 'A 1ª turma vai abrir' (antecipação).", "Thumbnail/capa animada do Reel D15."],
    checklist: ["04:30 — bom dia + contagem.", "Reel D15 antecipação — você grava.", "Eu edito + capa + card.", "Postar. CTA QUERO."],
  },
  d16: {
    id: "d16", data: "2026-07-11", fase: "pre_lancamento",
    significado: "Reforça o porquê agora (aversão à perda).",
    enfase: "Daqui a 21 dias: igual ou um passo na frente?",
    trafego: "Antecipação VIP.",
    organico: {
      bomDia: "Bom dia! Pergunta honesta, sem dó: daqui a 21 dias você quer estar exatamente igual tá hoje, ou um passo na frente? O tempo passa do mesmo jeito — com você agindo ou não.",
      roteiro: ["Story 1 (selfie): o custo de não agir + contagem.", "Story 2 (card CTA): 'VIP responde QUERO.'"],
      qtd: "4 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Daqui a 21 dias você vai estar igual tá hoje, ou um passo na frente?"
[00:04-00:15] MEIO CORPO | "Porque o tempo vai passar do mesmo jeito. A diferença é se daqui a 3 semanas você se orgulha de ter começado, ou se cobra de novo por ter deixado pra lá."
[00:15-00:24] CLOSE | "Não começar também é uma escolha — e ela cobra caro."
[00:24-00:30] APONTA | "VIP entra primeiro. Comenta QUERO."
TEXTO NA TELA: "+21 dias: igual ou na frente?" | "não agir cobra caro" | "Comenta QUERO"`,
    legenda: `Daqui a 21 dias você quer estar igual tá hoje, ou um passo na frente?\n\nO tempo vai passar do mesmo jeito. A diferença é se você vai se orgulhar de ter começado, ou se cobrar de novo por ter deixado pra lá. Não começar também é uma escolha — e cobra caro.\n\nVIP entra primeiro. Comenta QUERO.\nBora cuidar de você na vida. 💪\n\n#mulher40 #decisao #prelancamento #protocolorv`,
    capa: "Card preto+ouro: 'DAQUI A 21 DIAS:' + 'igual ou na frente?' (ouro) + selo ⏳ + RV.",
    criativos: ["Carrossel 'Onde você vai estar em 21 dias?' (aversão à perda).", "Thumbnail/capa animada do Reel D16."],
    checklist: ["04:30 — bom dia + contagem.", "Reel D16 — você grava.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO."],
  },
  d17: {
    id: "d17", data: "2026-07-12", fase: "pre_lancamento",
    significado: "Prova final + autoridade. Confia que VOCÊ é o cara certo.",
    enfase: "14 anos de protocolo. Não é sorte.",
    trafego: "Antecipação VIP.",
    organico: {
      bomDia: "Bom dia! 14 anos transformando mulher que já tinha desistido de si mesma. Não é sorte, não é milagre — é protocolo. Deixa eu te mostrar por que isso muda o jogo.",
      roteiro: ["Story 1 (selfie): autoridade leve, sem arrogância.", "Story 2: prova.", "Story 3 (card CTA): 'VIP responde QUERO.'"],
      qtd: "4 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Por que comigo e não com qualquer um que aparece dançando na internet?"
[00:04-00:15] MEIO CORPO | "14 anos. Transformando mulher que já tinha desistido de si mesma. Não é sorte, não é milagre — é protocolo testado em gente de verdade, com vida real."
[00:15-00:24] CLOSE | "Eu não prometo corpo de revista. Prometo direção que você consegue seguir."
[00:24-00:30] APONTA | "VIP entra primeiro. Comenta QUERO."
TEXTO NA TELA: "por que comigo?" | "14 anos de PROTOCOLO" | "Comenta QUERO"`,
    legenda: `Por que comigo, e não com qualquer um dançando na internet?\n\n14 anos transformando mulher que já tinha desistido de si mesma. Não é sorte, não é milagre — é protocolo testado em gente de vida real. Eu não prometo corpo de revista; prometo direção que você consegue seguir.\n\nVIP entra primeiro. Comenta QUERO.\nBora cuidar de você na vida. 💪\n\n#autoridade #mulher40 #protocolorv`,
    capa: "Card preto+ouro: '14 ANOS DE PROTOCOLO' (ouro) + 'não é sorte' + selo ⏳ + RV. Foto séria/autoridade do Ruriá.",
    criativos: ["Carrossel 'Por que o Protocolo RV funciona' (protocolo, não milagre).", "Thumbnail/capa animada do Reel D17."],
    checklist: ["04:30 — bom dia + contagem.", "Reel D17 autoridade — você grava.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO."],
  },
  d18: {
    id: "d18", data: "2026-07-13", fase: "pre_lancamento",
    significado: "Escassez real começa (turma acompanhada de perto).",
    enfase: "Vaga limitada de verdade — eu acompanho de perto.",
    trafego: "Antecipação VIP + lembrete de abertura.",
    organico: {
      bomDia: "Bom dia! Importante, sem marketing barato: a 1ª turma é limitada porque eu acompanho de perto. Não é truque de escassez — é que não dá pra cuidar bem de gente demais ao mesmo tempo.",
      roteiro: ["Story 1 (selfie): escassez real explicada + contagem.", "Story 2 (card CTA): 'VIP entra primeiro — responde QUERO.'"],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Por que a 1ª turma é limitada? Não é truque de marketing. Presta atenção."
[00:04-00:15] MEIO CORPO | "Porque eu acompanho de perto. E não dá pra cuidar bem de mil mulheres ao mesmo tempo. Prefiro turma menor e resultado real do que turma cheia e gente largada."
[00:15-00:24] CLOSE | "Então quando abrir, vai acabar. E a VIP entra primeiro."
[00:24-00:30] APONTA | "Comenta QUERO pra não ficar de fora."
TEXTO NA TELA: "vaga limitada DE VERDADE" | "eu acompanho de perto" | "Comenta QUERO"`,
    legenda: `Por que a 1ª turma é limitada? Não é truque de marketing.\n\nÉ porque eu acompanho de perto — e não dá pra cuidar bem de mil mulheres ao mesmo tempo. Prefiro turma menor com resultado real do que turma cheia com gente largada.\n\nQuando abrir, vai acabar. VIP entra primeiro. Comenta QUERO.\nBora cuidar de você na vida. 💪\n\n#vagaslimitadas #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'VAGA LIMITADA DE VERDADE' (DE VERDADE em ouro) + selo ⏳ + RV.",
    criativos: ["Card 'turma limitada (de verdade)'.", "Thumbnail/capa animada do Reel D18."],
    checklist: ["04:30 — bom dia + contagem.", "Reel D18 escassez — você grava.", "Eu edito + capa + card.", "Postar. CTA QUERO."],
  },
  d19: {
    id: "d19", data: "2026-07-14", fase: "pre_lancamento",
    significado: "Véspera. VIP compra primeiro e melhor.",
    enfase: "VIP compra primeiro e melhor.",
    trafego: "Lembrete forte pra VIP.",
    organico: {
      bomDia: "Bom dia! Tá quase: a turma abre. Quem tá na VIP recebe o link antes de todo mundo e com a condição de lançamento. Fica de olho no Direct que é lá que cai primeiro.",
      roteiro: ["Story 1 (selfie): véspera, VIP primeiro + contagem.", "Story 2 (card CTA): 'última chamada da VIP: responde QUERO.'"],
      qtd: "4 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "É véspera. Amanhã a 1ª turma abre — e não abre igual pra todo mundo."
[00:04-00:15] MEIO CORPO | "Quem tá na VIP recebe o link ANTES, com a condição de lançamento. Quem não tá, espera abrir pra geral e paga diferente — se ainda tiver vaga."
[00:15-00:24] CLOSE | "Última chamada pra entrar na VIP antes de eu fechar."
[00:24-00:30] APONTA | "Comenta QUERO agora."
TEXTO NA TELA: "é VÉSPERA" | "VIP recebe primeiro" | "Comenta QUERO"`,
    legenda: `É véspera. Amanhã a 1ª turma abre — e não abre igual pra todo mundo.\n\nQuem tá na VIP recebe o link ANTES, com a condição de lançamento. Quem não tá, espera a abertura geral e paga diferente — se sobrar vaga.\n\nÚltima chamada da VIP. Comenta QUERO agora.\nBora cuidar de você na vida. 💪\n\n#vespera #listavip #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'VÉSPERA' + 'VIP recebe primeiro' (ouro) + selo ⏳ '1 DIA' + RV.",
    criativos: ["Card 'VIP entra primeiro' (condição de lançamento).", "Thumbnail/capa animada do Reel D19."],
    checklist: ["04:30 — bom dia + contagem.", "Reel D19 véspera — você grava.", "Eu edito + capa + card.", "Confirmar os 3 gates ANTES de abrir."],
  },
  d20: {
    id: "d20", data: "2026-07-15", fase: "pre_lancamento",
    significado: "ABERTURA pra VIP (se gates verdes). Conversão pelo público mais quente.",
    enfase: "Abertura VIP (SOMENTE se os 3 gates verdes).",
    trafego: "Conversão: campanha pra VIP/retargeting (gasto no Telegram).",
    organico: {
      bomDia: "Bom dia! Abriu pra VIP! Se você respondeu QUERO nesses dias, o link já tá indo pro seu Direct com a condição de lançamento. Agora é agir — bora cuidar na vida.",
      roteiro: ["Story 1 (selfie): 'abriu pra VIP'.", "Story 2: prova de quem já entrou.", "Story 3 (card CTA): 'VIP, confere o Direct / link aqui.'"],
      qtd: "6 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Abriu. A 1ª turma do TRINCA RV21 tá oficialmente aberta — e começou pela VIP."
[00:04-00:15] MEIO CORPO | "Se você respondeu QUERO nesses dias, o link já tá no teu Direct com a condição de lançamento. Não é pra todo mundo ainda: é pra quem se mexeu antes."
[00:15-00:24] CLOSE | "As vagas são limitadas de verdade. Quem entrar agora, garante."
[00:24-00:30] APONTA | "VIP, confere o Direct. Bora agir."
TEXTO NA TELA: "ABRIU PRA VIP" | "link no seu Direct" | "bora agir"`,
    legenda: `Abriu. A 1ª turma do TRINCA RV21 tá oficialmente aberta — e começou pela VIP.\n\nSe você respondeu QUERO nesses dias, o link já tá no seu Direct com a condição de lançamento. Vagas limitadas de verdade — quem entrar agora, garante.\n\nVIP, confere o Direct. Bora cuidar de você na vida. 💪\n\n#abriu #listavip #trincarv21 #protocolorv`,
    capa: "Card preto+ouro: 'ABRIU PRA VIP' (ouro) + 'vagas limitadas' + RV. Energia de abertura.",
    criativos: ["Card 'Abriu pra VIP' + sequência de stories de conversão.", "Thumbnail/capa animada do Reel D20."],
    checklist: ["CONFIRMAR 3 gates verdes (sem isso, NÃO abre).", "04:30 — stories de abertura.", "Disparar link VIP (Kiwify).", "Acompanhar vendas no cockpit."],
  },
  d21: {
    id: "d21", data: "2026-07-16", fase: "pre_lancamento",
    significado: "Abertura geral / última chamada. Converte o resto com escassez real.",
    enfase: "Abertura geral + última chamada (vagas acabando).",
    trafego: "Conversão full (gasto no Telegram).",
    organico: {
      bomDia: "Bom dia! Abriu pra geral — e as vagas da 1ª turma são limitadas de verdade. Quem tava só assistindo, é agora ou espera a próxima. Bora cuidar na vida.",
      roteiro: ["Story 1 (selfie): 'abriu geral'.", "Story 2: prova + contagem de vagas.", "Story 3 (card CTA): 'última chamada, link na bio/Direct.'"],
      qtd: "6+ stories (dia de conversão).",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Última chamada. A 1ª turma do TRINCA abriu pra geral — e as vagas tão acabando de verdade."
[00:04-00:15] MEIO CORPO | "Quem tava só assistindo de camarote, é agora. Não tem lista de espera mágica: ou você entra nessa turma, ou espera a próxima sem data."
[00:15-00:24] CLOSE | "Daqui a 21 dias você vai querer ter começado hoje."
[00:24-00:30] APONTA | "Link na bio e no Direct. Bora agir."
TEXTO NA TELA: "ÚLTIMA CHAMADA" | "vagas acabando" | "link na bio"`,
    legenda: `Última chamada. A 1ª turma do TRINCA abriu pra geral — e as vagas tão acabando de verdade.\n\nQuem tava só assistindo de camarote, é agora. Ou você entra nessa turma, ou espera a próxima sem data. Daqui a 21 dias você vai querer ter começado hoje.\n\nLink na bio e no Direct. Bora cuidar de você na vida. 💪\n\n#ultimachamada #trincarv21 #vagaslimitadas #protocolorv`,
    capa: "Card preto+ouro: 'ÚLTIMA CHAMADA' (ouro) + 'vagas acabando' + selo de vagas + RV.",
    criativos: ["Sequência de conversão: card 'vagas acabando' + prova + CTA final.", "Thumbnail/capa animada do Reel D21."],
    checklist: ["04:30 — stories de abertura geral.", "Disparar pra lista toda.", "Acompanhar e reportar vendas em tempo real.", "Fechar a turma quando lotar."],
  },
};

/* Mapeia data ISO (YYYY-MM-DD) pro plano do dia. ROBUSTO: retorna null se a data não bater
   com nenhum dia (o chamador trata) — NUNCA cai no D1 mostrando conteúdo de outro dia. */
export function planByDate(iso: string): DiaPlan | null {
  return Object.values(DIA_PLANS).find((p) => p.data === iso) || null;
}
