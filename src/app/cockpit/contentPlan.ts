/* Plano de conteúdo DIA A DIA do aquecimento TRINCA RV21 — 21 dias, 3 fases.
   Fonte ÚNICA: aba Conteúdo (cockpit) + briefing 4:30 (Telegram) + Agente 06.

   ÂNGULO OFICIAL (validado na mineração 27/06 — Meta Ad Library BR, top por impressões):
   "DEPOIS DOS 35-40 O CORPO MUDA AS REGRAS — hormônio, metabolismo, sono, rotina —
   por isso o que você fazia parou de funcionar. Não é força de vontade: é fisiologia."
   Mecanismo: TESTE de 40s → protocolo de 21 dias pro SEU corpo. Desejo: sem passar fome,
   sem treino de atleta, no seu tempo. Autoridade: 14 anos cuidando do corpo feminino real.
   PROIBIDO o ângulo antigo "você não falhou/culpa". PROIBIDO prometer Xkg/cura/saúde (Meta).
   Vender DIREÇÃO/personalização, não milagre. Converter em LEAD + SEGUIDORA.

   VOZ: homem, direto, levemente agressivo + humor + retenção (hook ≤3s, payoff no fim).
   Sem coração. Jargões: "cuida", "bora cuidar na vida". PALAVRA-CHAVE: QUERO. PROTOCOLO, nunca "método". */

export type Fase = "captacao" | "aquecimento" | "pre_lancamento";

export const LANCAMENTO_OFICIAL = "2026-07-16"; // alvo (ajustável). Só abre com os 3 gates verdes.

export function diasParaLancamento(iso: string): number {
  const a = new Date(`${iso}T00:00:00-03:00`);
  const b = new Date(`${LANCAMENTO_OFICIAL}T00:00:00-03:00`);
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 86400000));
}

/* Capas/thumbnails geradas (Cloudinary, sem versão = serve a última). 1 capa por dia + card CTA universal. */
export const capaImgUrl = (id: string) => `https://res.cloudinary.com/drfs4s18a/image/upload/trinca-raw/criativos/capas/${id}_capa.png`;
export const CTA_CARD_URL = "https://res.cloudinary.com/drfs4s18a/image/upload/trinca-raw/criativos/stories/d2_card_cta.png";

export const FASES: Record<Fase, { nome: string; cor: string; dias: string; significado: string }> = {
  captacao: { nome: "Fase 1 · Captação fria", cor: "#d4a23c", dias: "D1–D7", significado: "Topo. Encher a Lista VIP. Ângulo: o corpo mudou (hormônio/metabolismo/idade) + curiosidade do teste. Sem oferta." },
  aquecimento: { nome: "Fase 2 · Aquecimento", cor: "#5fd08a", dias: "D8–D14", significado: "Meio. 'Isso é pra mim, na MINHA fase'. Identidade + prova (mulher 40+) + como o protocolo se adapta ao corpo dela." },
  pre_lancamento: { nome: "Fase 3 · Pré-lançamento", cor: "#f0c969", dias: "D15–D21", significado: "Fundo. 'Quero garantir minha vaga'. Antecipação + escassez real → abre carrinho QUANDO os 3 gates verdes." },
};

export type DiaPlan = {
  id: string; data: string; fase: Fase; significado: string; enfase: string; trafego: string;
  organico: { bomDia: string; roteiro: string[]; qtd: string };
  reelRoteiro: string; legenda: string; capa: string; criativos: string[]; checklist: string[];
};

export const CTA_AUTOMACAO_STORY =
  "🔑 Feche pedindo RESPOSTA \"QUERO\" (ou reação 🔥): dispara o Direct → DM → teste/VIP. Enquete/quiz/slider só engajam (alcance), NÃO disparam DM. Palavra-chave oficial: QUERO. Peça também pra SEGUIR.";

export type StoryFrame = { n: number; horario: string; bloco: string; oQuePostar: string; ferramenta: string; efeito: "DISPARA_DM" | "ALIMENTA_ALGORITMO" | "LEVA_AO_LINK"; link?: string; cta: string };

export const STORIES_SEQUENCIA_PADRAO: StoryFrame[] = [
  { n: 1, horario: "04:30", bloco: "Bom dia (selfie, você)", oQuePostar: "Selfie, luz natural, falando o FOCO do dia (corpo mudou / fisiologia). Hook em 3s.", ferramenta: "Emoji slider (\"como você acordou? 😴 → 🔥\")", efeito: "ALIMENTA_ALGORITMO", cta: "Conexão + aquece alcance. Peça pra seguir." },
  { n: 2, horario: "09:00", bloco: "Card de dor (design animado RV)", oQuePostar: "Card animado preto+ouro com a FRASE do dia (fisiologia/idade) + selo de contagem regressiva.", ferramenta: "Enquete 2 opções (ex.: \"Seu corpo mudou depois dos 40? SIM / Demais\")", efeito: "ALIMENTA_ALGORITMO", cta: "Identificação + alcance." },
  { n: 3, horario: "12:00", bloco: "Caixinha de perguntas", oQuePostar: "\"Me conta: o que mais mudou no seu corpo nos últimos anos?\" — colhe dor real.", ferramenta: "Sticker de Perguntas", efeito: "DISPARA_DM", cta: "Responder abre o Direct. Responda algumas publicamente." },
  { n: 4, horario: "15:00", bloco: "Mini-quiz (card animado)", oQuePostar: "\"O que mais te atrapalha hoje? Hormônio / Metabolismo / Tempo / Sono\".", ferramenta: "Sticker de Quiz", efeito: "ALIMENTA_ALGORITMO", cta: "Segmenta. No story seguinte leva pro CTA." },
  { n: 5, horario: "18:00", bloco: "CTA captação (card animado + botão)", oQuePostar: "\"Tem um teste de 40s que lê o SEU corpo e monta um protocolo de 21 dias pra ele. Toca aqui 👇\"", ferramenta: "Sticker de LINK + peça RESPOSTA 'QUERO' (alterna: 1 dia link, outro dia keyword)", efeito: "LEVA_AO_LINK", link: "https://protocolorv.com.br/vip-quiz", cta: "RESPOSTA 'QUERO' dispara DM E o link leva direto pro teste. Dois caminhos pra VIP." },
  { n: 6, horario: "20:30", bloco: "Contagem regressiva (selfie/card)", oQuePostar: "Quantos dias faltam pro lançamento + bastidor/prova humano. Peça pra seguir.", ferramenta: "Contagem regressiva (countdown) + reação 🔥", efeito: "DISPARA_DM", link: "https://protocolorv.com.br/vip", cta: "Reação dispara DM. Reforça antecipação." },
];

export const STORIES_GUIA =
  "Agenda diária (6 stories). Regra: 1 ENQUETE + 1 PERGUNTA/QUIZ (alcance) + 1 CTA QUERO/LINK (captação) + 1 CONTAGEM REGRESSIVA. Só TEXTO/REAÇÃO/LINK levam pro Direct/VIP. ALTERNE o frame 5 entre LINK clicável e keyword 'QUERO'. Sempre peça pra SEGUIR. Cards = thumbnails ANIMADOS, estética IA + edição pro, preto+ouro RV.";

export const DIA_PLANS: Record<string, DiaPlan> = {
  // ===================== FASE 1 · CAPTAÇÃO FRIA (D1–D7) =====================
  d1: {
    id: "d1", data: "2026-06-26", fase: "captacao",
    significado: "Primeiro contato. 'Achei alguém que entende por que meu corpo mudou'. Planta o ângulo fisiológico, sem vender.",
    enfase: "Depois dos 40, o corpo muda as regras. Ninguém te avisou.",
    trafego: "DESLIGADO. Só orgânico até o funil validar. (Verba = SIM seu no Telegram.)",
    organico: {
      bomDia: "Bom dia! Você faz quase tudo igual e o corpo simplesmente não responde mais como antes? Calma, não é frescura nem preguiça. Depois de uma certa idade o corpo muda as regras — e quase ninguém te explica isso.",
      roteiro: ["Story 1 (selfie): hook 'faz igual e o corpo não responde? as regras mudaram'.", "Story 2 (selfie): hormônio, metabolismo e sono mudam depois dos 35-40 — não é força de vontade, é fisiologia.", "Story 3 (selfie): 14 anos cuidando do corpo feminino real. Vem um protocolo de 21 dias pensado pra ESSA fase.", "Story 4 (card CTA): 'responde QUERO que eu te mando um teste de 40s que lê o teu corpo.' Peça pra seguir."],
      qtd: "6 stories (agenda 04:30→20:30).",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Você faz quase tudo igual... e o corpo não responde mais como antes. Não é preguiça. As regras mudaram."
[00:04-00:14] MEIO CORPO | "Depois dos 35, 40, o corpo muda: hormônio, metabolismo, sono. O que funcionava aos 20 simplesmente para de funcionar — e ninguém te avisa."
[00:14-00:24] CLOSE | "Eu fiz um teste de 40 segundos que lê como o SEU corpo está hoje e monta um protocolo de 21 dias pra ELE."
[00:24-00:30] APONTA | "Comenta QUERO que eu te mando o teste. Bora cuidar de você na vida?"
TEXTO NA TELA: "o corpo mudou as regras" | "não é preguiça, é fisiologia" | "teste de 40s" | "Comenta QUERO"`,
    legenda: `Você faz quase tudo igual e o corpo não responde mais como antes? Não é preguiça — é fisiologia.\n\nDepois dos 35, 40, o corpo muda as regras: hormônio, metabolismo, sono. O que funcionava aos 20 para de funcionar, e quase ninguém te explica isso.\n\nEu fiz um teste de 40 segundos que lê como o SEU corpo está hoje e monta um protocolo de 21 dias pra ele — no seu tempo, sem passar fome.\n\nComenta QUERO que eu te mando o teste. Me segue que todo dia eu trago o protocolo aqui.\nBora cuidar de você na vida. 💪\n\n#mulher40 #metabolismo #hormonios #protocolorv #desafio21dias`,
    capa: "Card preto+ouro: 'O CORPO MUDOU AS REGRAS' (REGRAS em ouro) + 'depois dos 40' + selo ⏳ 'FALTAM X DIAS' + RV. Sem foto (impacto da frase).",
    criativos: ["Carrossel 'Salva isso: 4 coisas que mudam no corpo depois dos 40' (hormônio/metabolismo/sono/massa magra).", "Thumbnail/capa animada do Reel D1."],
    checklist: ["04:30 — bom dia (selfie).", "Gravar Reel D1 e me subir o bruto.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO + seguir.", "Fim do dia: conferir DMs."],
  },
  d2: {
    id: "d2", data: "2026-06-27", fase: "captacao",
    significado: "Aprofunda o porquê fisiológico. 'Então é por isso'. Gera confiança no especialista.",
    enfase: "Treinar igual aos 20 parou de funcionar — e tem explicação.",
    trafego: "Orgânico. (Tráfego só com seu SIM.)",
    organico: {
      bomDia: "Bom dia! Você lembra quando bastava 'fechar a boca' uns dias e o corpo respondia? Pois é, hoje você faz o mesmo e nada. Não é você que piorou — é o metabolismo que mudou de marcha.",
      roteiro: ["Story 1 (selfie): 'antes bastava pouco e funcionava. Hoje não. Por quê?'", "Story 2 (selfie): metabolismo desacelera + massa magra cai → o corpo guarda mais. Tem que treinar PRA isso.", "Story 3 (card CTA): 'quer saber como destravar? responde QUERO.' Peça pra seguir."],
      qtd: "6 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Lembra quando bastava fechar a boca uns dias e o corpo respondia? E hoje você faz o mesmo... e nada?"
[00:04-00:15] MEIO CORPO | "Não é você que piorou. É o metabolismo que mudou de marcha: desacelera, a massa magra cai, e o corpo passa a guardar mais. Treinar igual antes não resolve."
[00:15-00:24] CLOSE | "Tem que treinar e comer PRA essa fase. É o que o protocolo de 21 dias faz com o teu corpo."
[00:24-00:30] APONTA | "Comenta QUERO que eu te mando o teste."
TEXTO NA TELA: "antes funcionava, hoje não" | "o metabolismo mudou de marcha" | "Comenta QUERO"`,
    legenda: `Lembra quando bastava fechar a boca uns dias e o corpo respondia? E hoje você faz o mesmo e... nada.\n\nNão é você que piorou. O metabolismo muda de marcha: desacelera, a massa magra cai, e o corpo guarda mais. Treinar igual aos 20 não resolve mais.\n\nTem que treinar e comer PRA essa fase — é o que o protocolo de 21 dias faz, no seu tempo e sem sofrimento.\n\nComenta QUERO que eu te mando o teste. Me segue pro protocolo do dia.\nBora cuidar de você na vida. 💪\n\n#metabolismo #mulher40 #massamagra #protocolorv`,
    capa: "Card preto+ouro: 'O METABOLISMO MUDOU DE MARCHA' (ouro em MARCHA) + selo ⏳ + RV.",
    criativos: ["Carrossel 'Por que o que funcionava antes parou de funcionar' (metabolismo/massa magra) — 5 slides.", "Thumbnail/capa animada do Reel D2."],
    checklist: ["04:30 — bom dia.", "Gravar Reel D2 e subir.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO + seguir."],
  },
  d3: {
    id: "d3", data: "2026-06-28", fase: "captacao",
    significado: "Quebra a objeção de tempo, dentro do ângulo fisiológico. 'Cabe na minha fase e na minha rotina'.",
    enfase: "Não precisa de academia 5x. Precisa do estímulo certo pra essa fase.",
    trafego: "Orgânico.",
    organico: {
      bomDia: "Bom dia! Te falaram que pra emagrecer depois dos 40 tem que viver na academia? Mentira. Nessa fase, MAIS treino sem direção só estressa o corpo e trava ainda mais. O segredo é o estímulo certo, não o maior.",
      roteiro: ["Story 1 (selfie): 'mais treino não é a resposta nessa fase — é o estímulo CERTO.'", "Story 2 (selfie): 15-20 min bem feitos > 1h aleatória que sobe o cortisol.", "Story 3 (card CTA): 'responde QUERO que eu te mostro o estímulo certo.' Peça pra seguir."],
      qtd: "6 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Te falaram que pra emagrecer depois dos 40 você tem que viver na academia? Que mentira."
[00:04-00:16] MEIO CORPO | "Nessa fase, treino demais sem direção SOBE o cortisol e trava o corpo ainda mais. O que destrava não é o maior estímulo — é o estímulo CERTO. 15, 20 minutos bem feitos."
[00:16-00:24] CLOSE | "É exatamente isso que o protocolo organiza: o estímulo certo, no seu tempo, por 21 dias."
[00:24-00:30] APONTA | "Comenta QUERO."
TEXTO NA TELA: "treino demais TRAVA" | "estímulo certo > maior" | "Comenta QUERO"`,
    legenda: `Te falaram que pra emagrecer depois dos 40 tem que viver na academia? Mentira que custa caro.\n\nNessa fase, treino demais sem direção sobe o cortisol e trava o corpo ainda mais. O que destrava é o estímulo CERTO — 15, 20 minutos bem feitos — não o maior.\n\nO protocolo de 21 dias organiza isso pra você, no seu tempo.\n\nComenta QUERO que eu te mostro. Me segue pro protocolo do dia.\nBora cuidar de você na vida. 💪\n\n#treinoemcasa #cortisol #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'ESTÍMULO CERTO, NÃO O MAIOR' (ouro em CERTO) + selo ⏳ + RV.",
    criativos: ["Card 'Mais treino ≠ mais resultado depois dos 40' (cortisol).", "Thumbnail/capa animada do Reel D3."],
    checklist: ["04:30 — bom dia.", "Gravar Reel D3 e subir.", "Eu edito + capa + card.", "Postar. CTA QUERO + seguir."],
  },
  d4: {
    id: "d4", data: "2026-06-29", fase: "captacao",
    significado: "Dor de energia/sono pela via hormonal. 'É exatamente o que eu sinto'. Salva/compartilha.",
    enfase: "Cansaço, sono ruim, inchaço: o hormônio está falando com você.",
    trafego: "Orgânico.",
    organico: {
      bomDia: "Bom dia! Acorda inchada, dorme mal, vive cansada e ainda acha que é 'da idade'? É da idade SIM — mas isso tem manejo. Hormônio desregulado grita assim. Hoje eu te mostro por onde começa a acalmar.",
      roteiro: ["Story 1 (selfie): 'inchaço + sono ruim + cansaço = hormônio falando.'", "Story 2 (selfie): 3 ajustes simples que acalmam (sono/luz/proteína de manhã).", "Story 3 (card CTA): 'manda 🔥 ou responde QUERO.' Peça pra seguir."],
      qtd: "6 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Acorda inchada, dorme mal, vive cansada... e acham que é 'frescura sua'?"
[00:04-00:15] MEIO CORPO | "Não é. É hormônio desregulado gritando. Depois dos 40 isso muda o sono, a fome e onde o corpo guarda gordura. Não dá pra ignorar e esperar passar."
[00:15-00:24] CLOSE | "O protocolo começa acalmando isso — sono, rotina, alimentação — antes de cobrar qualquer coisa de você."
[00:24-00:30] APONTA | "Comenta QUERO."
TEXTO NA TELA: "não é frescura" | "é o hormônio gritando" | "Comenta QUERO"`,
    legenda: `Acorda inchada, dorme mal, vive cansada — e dizem que é "frescura"? Não é.\n\nÉ hormônio desregulado gritando. Depois dos 40 isso mexe no sono, na fome e em onde o corpo guarda gordura. Ignorar e esperar passar só piora.\n\nO protocolo de 21 dias começa acalmando isso (sono, rotina, alimentação) antes de cobrar qualquer coisa de você.\n\nComenta QUERO. Me segue pro protocolo do dia.\nBora cuidar de você na vida. 💪\n\n#hormonios #sono #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'É O HORMÔNIO GRITANDO' (ouro) + 'não é frescura' + selo ⏳ + RV.",
    criativos: ["Carrossel '3 sinais de que seu hormônio está desregulado (e o que acalma)' — salvável.", "Thumbnail/capa animada do Reel D4."],
    checklist: ["04:30 — bom dia.", "Gravar Reel D4 e subir.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO + seguir."],
  },
  d5: {
    id: "d5", data: "2026-06-30", fase: "captacao",
    significado: "Revela o mecanismo (o teste) + comunidade. 'Existe um caminho feito pra mim'.",
    enfase: "Um teste de 40s que lê o SEU corpo (e a turma se formando).",
    trafego: "Orgânico.",
    organico: {
      bomDia: "Bom dia! Tá chegando muita mulher 40+ por aqui com a mesma história. Então deixa eu te mostrar uma coisa: um teste de 40 segundos que lê como o teu corpo tá hoje e monta um protocolo só pra ele.",
      roteiro: ["Story 1 (selfie): apresenta o teste de 40s (mecanismo).", "Story 2: repost de respostas (prova social, print autorizado).", "Story 3 (card CTA): link do teste + 'responde QUERO'. Peça pra seguir."],
      qtd: "6 stories (muita interação).",
    },
    reelRoteiro: `[00:00-00:05] CLOSE | "E se desse pra saber EXATAMENTE como o teu corpo tá hoje — hormônio, metabolismo, rotina — em 40 segundos?"
[00:05-00:16] MEIO CORPO | "Foi isso que eu montei: um teste rápido que lê a tua fase e cospe um protocolo de 21 dias pensado pro TEU corpo. Não é plano genérico de internet."
[00:16-00:24] CLOSE | "E você não faz sozinha: tá chegando muita mulher 40+ na mesma fase."
[00:24-00:30] APONTA | "Comenta QUERO que eu te mando o teste."
TEXTO NA TELA: "teste de 40s" | "protocolo pro SEU corpo" | "Comenta QUERO"`,
    legenda: `E se desse pra saber exatamente como o teu corpo tá hoje — hormônio, metabolismo, rotina — em 40 segundos?\n\nFoi isso que eu montei: um teste rápido que lê a tua fase e monta um protocolo de 21 dias pro TEU corpo. Nada de plano genérico de internet.\n\nE você não faz sozinha — tá chegando muita mulher 40+ na mesma fase.\n\nComenta QUERO que eu te mando o teste. Me segue pra entrar na 1ª turma.\nBora cuidar de você na vida. 💪\n\n#teste #mulher40 #comunidade #protocolorv`,
    capa: "Card preto+ouro: 'TESTE DE 40s' grande (ouro) + 'lê o SEU corpo' + selo ⏳ + RV.",
    criativos: ["Card 'Descubra o que o seu corpo precisa (teste de 40s)'.", "Thumbnail/capa animada do Reel D5."],
    checklist: ["04:30 — bom dia + interação.", "Gravar Reel D5 e subir.", "Eu edito + capa + card.", "Repostar respostas. CTA QUERO + seguir."],
  },
  d6: {
    id: "d6", data: "2026-07-01", fase: "captacao",
    significado: "Desejo via facilidade (sem sofrimento). Quem hesitava entra.",
    enfase: "Sem passar fome e sem treino de atleta. Esse é o ponto.",
    trafego: "Orgânico. Avaliar 1º teste de verba (te trago no Telegram com gasto exato).",
    organico: {
      bomDia: "Bom dia! Deixa eu adivinhar: você associa 'emagrecer' a passar fome e malhar até não aguentar, né? Esquece. Nessa fase, sofrimento sobe o cortisol e trava. O caminho é o oposto.",
      roteiro: ["Story 1 (selfie): 'sofrimento trava o corpo nessa fase. O caminho é o oposto.'", "Story 2: prova social.", "Story 3 (card CTA): 'responde QUERO.' Peça pra seguir."],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Você associa emagrecer a passar fome e malhar até cair? Por isso nunca durou."
[00:04-00:15] MEIO CORPO | "Depois dos 40, sofrimento SOBE o cortisol e o corpo trava de propósito — é defesa. O caminho que funciona é o oposto: comida de verdade e estímulo certo, sem se destruir."
[00:15-00:24] CLOSE | "21 dias feitos pra caber na sua vida real, não pra te punir."
[00:24-00:30] APONTA | "Comenta QUERO."
TEXTO NA TELA: "sofrimento TRAVA" | "sem fome, sem treino de atleta" | "Comenta QUERO"`,
    legenda: `Você associa emagrecer a passar fome e malhar até cair? Por isso nunca durou.\n\nDepois dos 40, sofrimento sobe o cortisol e o corpo trava de propósito — é defesa. O caminho que funciona é o oposto: comida de verdade e estímulo certo, sem se destruir.\n\n21 dias feitos pra caber na sua vida real, não pra te punir.\n\nComenta QUERO. Me segue pro protocolo do dia.\nBora cuidar de você na vida. 💪\n\n#semdieta #cortisol #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'SOFRIMENTO TRAVA O CORPO' (ouro em TRAVA) + selo ⏳ + RV.",
    criativos: ["Recap visual da semana (3 cards) com os ganchos que mais engajaram.", "Thumbnail/capa animada do Reel D6."],
    checklist: ["04:30 — bom dia.", "Gravar Reel D6 e subir.", "Eu edito + capa + recap.", "Postar. CTA QUERO + seguir."],
  },
  d7: {
    id: "d7", data: "2026-07-02", fase: "captacao",
    significado: "Fechamento da Fase 1. EU avalio gancho/criativo/CPL. Decide o que escala.",
    enfase: "Uma semana entendendo o próprio corpo. Poucas chegam aqui.",
    trafego: "Decisão de verba pra Fase 2 (proposta com gasto inicial no Telegram).",
    organico: {
      bomDia: "Bom dia! Em uma semana você já entende mais do teu corpo do que muita gente entende a vida inteira: por que mudou, por que travou e por onde destrava. Isso é virada. Bora pra próxima?",
      roteiro: ["Story 1 (selfie): retrospecto leve (o que ela aprendeu sobre o corpo).", "Story 2 (card CTA): 'a próxima semana é mais quente. Responde QUERO.' Peça pra seguir."],
      qtd: "4 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Em uma semana você entendeu mais do teu corpo do que muita gente entende a vida inteira."
[00:04-00:15] MEIO CORPO | "Por que ele mudou, por que travou, e por onde destrava. Isso não é pouco — é o que separa quem vira o jogo de quem desiste achando que é 'da idade'."
[00:15-00:24] CLOSE | "E isso foi só a semana 1. A próxima é onde a coisa esquenta."
[00:24-00:30] APONTA | "Comenta QUERO pra não ficar de fora."
TEXTO NA TELA: "semana 1 ✓" | "você entendeu seu corpo" | "Comenta QUERO"`,
    legenda: `Em uma semana você entendeu mais do teu corpo do que muita gente entende a vida inteira: por que mudou, por que travou e por onde destrava.\n\nIsso separa quem vira o jogo de quem desiste achando que é "da idade". E foi só a semana 1.\n\nA próxima é onde esquenta. Comenta QUERO pra não ficar de fora.\nBora cuidar de você na vida. 💪\n\n#mulher40 #virada #protocolorv`,
    capa: "Card preto+ouro: 'VOCÊ ENTENDEU SEU CORPO' + 'semana 1 ✓' (ouro) + selo ⏳ + RV.",
    criativos: ["Card 'Semana 1 fechada' + teaser da Fase 2.", "Thumbnail/capa animada do Reel D7."],
    checklist: ["04:30 — bom dia.", "Gravar Reel D7 e subir.", "EU entrego o balanço (gancho/criativo/VIPs).", "Postar. CTA QUERO + seguir."],
  },

  // ===================== FASE 2 · AQUECIMENTO (D8–D14) =====================
  d8: {
    id: "d8", data: "2026-07-03", fase: "aquecimento",
    significado: "Identidade na fase dela. De 'curiosa' a 'eu sou do tipo que cuida do corpo que tenho hoje'.",
    enfase: "Não é virar outra. É o seu corpo de hoje funcionando de novo.",
    trafego: "Escalar o criativo campeão da Fase 1 (proposta com gasto no Telegram).",
    organico: {
      bomDia: "Bom dia! Esquece corpo de 20 anos — não é isso que a gente busca. É o teu corpo de HOJE funcionando bem: com energia, dormindo, se mexendo sem dor. Isso é possível, e é o ponto.",
      roteiro: ["Story 1 (selfie): 'não é virar outra, é o teu corpo de hoje funcionando.'", "Story 2: depoimento real (mulher 40+, com autorização).", "Story 3 (card CTA): 'responde QUERO, a turma tá fechando.' Peça pra seguir."],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Para tudo: o objetivo NÃO é você ter o corpo que tinha aos 20."
[00:04-00:15] MEIO CORPO | "É o teu corpo de HOJE funcionando bem — com energia, dormindo, se mexendo sem dor, se reconhecendo no espelho. Isso é possível mesmo com o hormônio mudado."
[00:15-00:24] CLOSE | "O protocolo trabalha COM a tua fase, não contra ela. Por isso funciona pra mulher real."
[00:24-00:30] APONTA | "Comenta QUERO."
TEXTO NA TELA: "não é virar outra" | "é o SEU corpo funcionando" | "Comenta QUERO"`,
    legenda: `O objetivo não é o corpo que você tinha aos 20. É o teu corpo de HOJE funcionando bem: energia, sono, se mexer sem dor, se reconhecer no espelho.\n\nIsso é possível mesmo com o hormônio mudado — quando o protocolo trabalha COM a tua fase, não contra ela.\n\nComenta QUERO — a turma tá fechando a prioridade. Me segue pro protocolo do dia.\nBora cuidar de você na vida. 💪\n\n#autoestima #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'O SEU CORPO DE HOJE FUNCIONANDO' (ouro em HOJE) + selo ⏳ + RV.",
    criativos: ["Carrossel 'Não é virar outra — é voltar a funcionar' — salvável.", "Thumbnail/capa animada do Reel D8."],
    checklist: ["04:30 — bom dia.", "Reel D8 — você grava.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO + seguir."],
  },
  d9: {
    id: "d9", data: "2026-07-04", fase: "aquecimento",
    significado: "Prova social na faixa dela. 'Se funcionou pra ela, com a idade dela, funciona pra mim'.",
    enfase: "Mulher 40+, rotina real, corpo respondendo de novo.",
    trafego: "Escalar o que converte.",
    organico: {
      bomDia: "Bom dia! Hoje a prova é de gente igual a você: mulher 40+, com filho, trabalho e hormônio bagunçado — e mesmo assim o corpo voltou a responder. Sem mágica, com direção.",
      roteiro: ["Story 1 (selfie): introduz a prova do dia (faixa 40+).", "Story 2: depoimento real.", "Story 3 (card CTA): 'manda 🔥 ou responde QUERO.' Peça pra seguir."],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Cansou de ver 'transformação' de menina de 22 que nunca teve hormônio bagunçado? Eu também."
[00:04-00:15] MEIO CORPO | "Hoje é mulher 40+ de verdade: filho, trabalho, noite mal dormida — e mesmo assim o corpo voltou a responder. Não por mágica. Por direção certa pra fase dela."
[00:15-00:24] CLOSE | "Se funcionou pra ela, com a vida dela, funciona pro teu corpo também."
[00:24-00:30] APONTA | "Comenta QUERO."
TEXTO NA TELA: "mulher 40+ REAL" | "o corpo voltou a responder" | "Comenta QUERO"`,
    legenda: `Cansou de ver "transformação" de menina de 22 que nunca teve hormônio bagunçado? Eu também.\n\nHoje a prova é mulher 40+ de verdade: filho, trabalho, noite mal dormida — e o corpo voltou a responder. Não por mágica, por direção certa pra fase dela.\n\nSe funcionou pra ela, funciona pro teu corpo. Comenta QUERO. Me segue.\nBora cuidar de você na vida. 💪\n\n#provasocial #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'MULHER 40+, CORPO RESPONDENDO' + selo ⏳ + RV. (antes/depois ético com autorização, se houver).",
    criativos: ["Carrossel de prova social (faixa 40+, ético, com autorização).", "Thumbnail/capa animada do Reel D9."],
    checklist: ["04:30 — bom dia.", "Reel D9 prova — você grava.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO + seguir."],
  },
  d10: {
    id: "d10", data: "2026-07-05", fase: "aquecimento",
    significado: "Micro-vitória fisiológica. Aplica uma dica e sente ganho hoje (reciprocidade).",
    enfase: "Uma mudança que você sente já hoje (de graça).",
    trafego: "Escalar.",
    organico: {
      bomDia: "Bom dia! Hoje eu te dou uma coisa que mexe no teu corpo já HOJE, sem comprar nada: [dica de proteína no café / luz do sol de manhã / sono]. Faz e me conta no Direct se sentiu.",
      roteiro: ["Story 1 (selfie): a dica fisiológica do dia.", "Story 2 (card CTA): 'fez? me responde QUERO.' Peça pra seguir."],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Quer sentir o corpo responder diferente JÁ amanhã de manhã? Anota."
[00:04-00:16] MEIO CORPO | "[Ruriá entrega 1 ajuste fisiológico real — ex.: proteína no café da manhã / 10 min de sol ao acordar / cortar tela 1h antes de dormir]. Pequeno, mas mexe no hormônio e no sono."
[00:16-00:24] CLOSE | "Imagina isso guiado, todo dia, por 21 dias. É o protocolo."
[00:24-00:30] APONTA | "Faz hoje e comenta QUERO me contando."
TEXTO NA TELA: "faça isso HOJE" | "mexe no hormônio" | "Comenta QUERO"`,
    legenda: `Quer sentir o corpo responder diferente já amanhã de manhã? Anota:\n\n[o ajuste fisiológico do reel]. Pequeno, mas mexe no hormônio e no sono — exatamente o que trava depois dos 40.\n\nImagina isso guiado, todo dia, por 21 dias: é o protocolo. Faz hoje e comenta QUERO me contando.\nBora cuidar de você na vida. 💪\n\n#dicarapida #hormonios #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'FAÇA ISSO HOJE' (ouro) + 'mexe no hormônio' + selo ⏳ + RV.",
    criativos: ["Card prático 'faça isso hoje' (ajuste fisiológico real).", "Thumbnail/capa animada do Reel D10."],
    checklist: ["04:30 — bom dia.", "Reel D10 dica — você grava.", "Eu edito + capa + card.", "Postar. CTA QUERO + seguir."],
  },
  d11: {
    id: "d11", data: "2026-07-06", fase: "aquecimento",
    significado: "Ancoragem de valor. Percebe o tamanho do que vem (sem preço).",
    enfase: "Não é 'mais um PDF'. É treino + alimentação + acompanhamento pra SUA fase.",
    trafego: "Escalar.",
    organico: {
      bomDia: "Bom dia! Deixa eu te mostrar o que tem dentro — porque não é 'mais um e-book'. É treino, alimentação e acompanhamento ajustados pro corpo que muda depois dos 40. Junto, não solto.",
      roteiro: ["Story 1 (selfie): o que tem dentro (ajustado à fase, sem preço).", "Story 2 (card CTA): 'quer ver tudo? responde QUERO.' Peça pra seguir."],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Quantos e-books fitness você já comprou que viraram poeira no celular?"
[00:04-00:16] MEIO CORPO | "O TRINCA não é isso. É treino + alimentação + acompanhamento ajustados pro corpo que MUDA depois dos 40. Junto, guiado. Porque PDF genérico não respeita a tua fase — e por isso você largava."
[00:16-00:24] CLOSE | "21 dias com direção de verdade pra ESSA fase, não um arquivo te julgando."
[00:24-00:30] APONTA | "Comenta QUERO pra ver por dentro."
TEXTO NA TELA: "não é mais um PDF" | "ajustado pra SUA fase" | "Comenta QUERO"`,
    legenda: `Quantos e-books fitness viraram poeira no teu celular?\n\nO TRINCA não é isso. É treino + alimentação + acompanhamento ajustados pro corpo que muda depois dos 40 — junto, guiado. PDF genérico não respeita a tua fase, por isso você largava.\n\nComenta QUERO que eu te mostro tudo por dentro. Me segue.\nBora cuidar de você na vida. 💪\n\n#desafio21dias #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'AJUSTADO PRA SUA FASE' (ouro) + 'não é mais um PDF' + selo ⏳ + RV.",
    criativos: ["Carrossel 'O que tem dentro do TRINCA' (entregáveis, sem preço).", "Thumbnail/capa animada do Reel D11."],
    checklist: ["04:30 — bom dia.", "Reel D11 — você grava.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO + seguir."],
  },
  d12: {
    id: "d12", data: "2026-07-07", fase: "aquecimento",
    significado: "Objeção 'funciona pra mim na minha idade?'. Vê o caso da faixa dela respondido.",
    enfase: "'Será que funciona na MINHA idade?' — bora responder.",
    trafego: "Escalar.",
    organico: {
      bomDia: "Bom dia! A pergunta que mais cai no Direct: 'Ruriá, na minha idade ainda funciona?'. Funciona MAIS, e eu te explico por quê — sem enrolação.",
      roteiro: ["Story 1 (selfie): a objeção da idade.", "Story 2: caso da faixa 40+/50+.", "Story 3 (card CTA): 'responde QUERO.' Peça pra seguir."],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "'Ruriá, na MINHA idade ainda funciona?' — a pergunta que mais cai no meu Direct."
[00:04-00:16] MEIO CORPO | "Funciona mais. Porque quanto mais o corpo mudou, mais ele responde a um estímulo CERTO — e quase ninguém te dá o certo. Genérico ignora tua idade; o protocolo é montado pra ela."
[00:16-00:24] CLOSE | "Já funcionou pra mulher de 52 que achava que era tarde. Vai funcionar pra você."
[00:24-00:30] APONTA | "Comenta QUERO."
TEXTO NA TELA: "na minha idade funciona?" | "funciona MAIS" | "Comenta QUERO"`,
    legenda: `"Na minha idade ainda funciona?" — a pergunta que mais cai no meu Direct.\n\nFunciona mais. Quanto mais o corpo mudou, mais ele responde ao estímulo CERTO — e quase ninguém te dá o certo. Genérico ignora tua idade; o protocolo é montado pra ela.\n\nJá funcionou pra mulher de 52 que achava que era tarde. Comenta QUERO. Me segue.\nBora cuidar de você na vida. 💪\n\n#objecao #mulher50 #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'NA MINHA IDADE FUNCIONA?' + 'funciona MAIS' (ouro) + selo ⏳ + RV.",
    criativos: ["Carrossel 'Quanto mais o corpo mudou, mais ele responde ao certo'.", "Thumbnail/capa animada do Reel D12."],
    checklist: ["04:30 — bom dia.", "Reel D12 objeção — você grava.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO + seguir."],
  },
  d13: {
    id: "d13", data: "2026-07-08", fase: "aquecimento",
    significado: "Comunidade forte. Pressão social positiva pra não ficar de fora.",
    enfase: "Uma turma de mulheres 40+ destravando junto.",
    trafego: "Escalar.",
    organico: {
      bomDia: "Bom dia! Olha o tamanho dessa turma de mulher 40+ que já tá dentro, trocando ideia e se cobrando junto. Sozinha a gente desiste; junto, a gente destrava. Você não vai querer ficar de fora.",
      roteiro: ["Story 1 (selfie): mostra o tamanho da turma 40+.", "Story 2 (card CTA): 'responde QUERO pra garantir prioridade.' Peça pra seguir."],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Olha o tamanho dessa turma de mulher 40+ que já tá dentro."
[00:04-00:15] MEIO CORPO | "Trocando ideia, se cobrando junto, comemorando o sono que voltou, a roupa que serviu. Sozinha a gente desiste na primeira semana ruim. Junto, a gente destrava."
[00:15-00:24] CLOSE | "Você não vai querer ser a única assistindo de fora, vai?"
[00:24-00:30] APONTA | "Comenta QUERO e entra na prioridade."
TEXTO NA TELA: "turma 40+ destravando" | "junto a gente segue" | "Comenta QUERO"`,
    legenda: `Sozinha a gente desiste na primeira semana ruim. Junto, a gente destrava.\n\nOlha o tamanho dessa turma de mulher 40+ que já tá dentro — trocando ideia, comemorando o sono que voltou, a roupa que serviu.\n\nVocê não vai querer ser a única de fora. Comenta QUERO e entra na prioridade. Me segue.\nBora cuidar de você na vida. 💪\n\n#comunidade #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'JUNTO A GENTE DESTRAVA' (ouro em JUNTO) + selo ⏳ + RV.",
    criativos: ["Card 'a turma 40+ tá grande' (FOMO saudável).", "Thumbnail/capa animada do Reel D13."],
    checklist: ["04:30 — bom dia.", "Reel D13 comunidade — você grava.", "Eu edito + capa + card.", "Postar. CTA QUERO + seguir."],
  },
  d14: {
    id: "d14", data: "2026-07-09", fase: "aquecimento",
    significado: "Fechamento da Fase 2 + checagem dos gates.",
    enfase: "Duas semanas entendendo o corpo. Semana que vem abre.",
    trafego: "Decisão: segura ou acelera (te mando no Telegram).",
    organico: {
      bomDia: "Bom dia! Duas semanas e você ainda tá aqui, entendendo o teu corpo de verdade. A maioria já desistiu achando que era tarde. Semana que vem a 1ª turma abre — e a VIP entra primeiro.",
      roteiro: ["Story 1 (selfie): retrospecto + teaser da abertura.", "Story 2 (card CTA): 'não tá na VIP? responde QUERO.' Peça pra seguir."],
      qtd: "4 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Duas semanas. Sabe quantas mulheres chegam firmes até aqui? Pouquíssimas — e você é uma."
[00:04-00:15] MEIO CORPO | "Você parou de achar que era 'da idade' e começou a entender o teu corpo de verdade. É exatamente esse tipo de mulher que eu quero na 1ª turma."
[00:15-00:24] CLOSE | "Semana que vem abre. E a VIP entra primeiro, em condição diferente."
[00:24-00:30] APONTA | "Não tá na VIP? Comenta QUERO agora."
TEXTO NA TELA: "2 semanas firme" | "a turma vai abrir" | "Comenta QUERO"`,
    legenda: `Duas semanas. Pouquíssimas mulheres chegam firmes até aqui — e você é uma.\n\nVocê parou de achar que era "da idade" e começou a entender o teu corpo. É esse tipo de mulher que eu quero na 1ª turma.\n\nSemana que vem abre, e a VIP entra primeiro. Não tá na VIP? Comenta QUERO. Me segue.\nBora cuidar de você na vida. 💪\n\n#mulher40 #1aturma #protocolorv`,
    capa: "Card preto+ouro: '2 SEMANAS FIRME' + 'a turma vai abrir' (ouro) + selo ⏳ + RV.",
    criativos: ["Card 'Fase 2 fechada' + teaser do pré-lançamento.", "Thumbnail/capa animada do Reel D14."],
    checklist: ["04:30 — bom dia.", "Reel D14 — você grava.", "EU entrego o status dos 3 gates.", "Postar. CTA QUERO + seguir."],
  },

  // ===================== FASE 3 · PRÉ-LANÇAMENTO (D15–D21) =====================
  d15: {
    id: "d15", data: "2026-07-10", fase: "pre_lancamento",
    significado: "Liga a antecipação. 'Tá chegando o que foi feito pra minha fase'.",
    enfase: "Tá chegando a 1ª turma do protocolo pra mulher 40+.",
    trafego: "Campanha de antecipação pra quem já é VIP (te mando gasto).",
    organico: {
      bomDia: "Bom dia! Agora é oficial: tá chegando a abertura da 1ª turma do TRINCA RV21 — feito pro corpo que muda depois dos 40. Quem tá na VIP entra primeiro e em condição diferente.",
      roteiro: ["Story 1 (selfie): 'tá chegando' + contagem regressiva.", "Story 2 (card CTA): 'não tá na VIP? responde QUERO agora.' Peça pra seguir."],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Agora é oficial: a 1ª turma do TRINCA RV21 tá pra abrir."
[00:04-00:15] MEIO CORPO | "Feito pro corpo que muda depois dos 40 — hormônio, metabolismo, rotina. E vou ser honesto: quem tá na VIP entra primeiro e em condição diferente."
[00:15-00:24] CLOSE | "Quem deixou pra depois vai correr atrás — e às vezes não dá tempo."
[00:24-00:30] APONTA | "Comenta QUERO e garante a VIP."
TEXTO NA TELA: "TÁ CHEGANDO" | "VIP entra primeiro" | "Comenta QUERO"`,
    legenda: `Agora é oficial: a 1ª turma do TRINCA RV21 tá pra abrir — feita pro corpo que muda depois dos 40.\n\nQuem tá na VIP entra primeiro e em condição diferente. Quem deixar pra depois vai correr atrás, e às vezes não dá tempo.\n\nComenta QUERO e garante tua VIP. Me segue pra saber primeiro.\nBora cuidar de você na vida. 💪\n\n#prelancamento #listavip #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'TÁ CHEGANDO' (ouro) + 'a 1ª turma 40+' + selo ⏳ GRANDE + RV.",
    criativos: ["Card 'A 1ª turma vai abrir' (antecipação).", "Thumbnail/capa animada do Reel D15."],
    checklist: ["04:30 — bom dia + contagem.", "Reel D15 — você grava.", "Eu edito + capa + card.", "Postar. CTA QUERO + seguir."],
  },
  d16: {
    id: "d16", data: "2026-07-11", fase: "pre_lancamento",
    significado: "Custo de não agir (aversão à perda), pela via fisiológica.",
    enfase: "O corpo não espera. Cada mês parado custa mais caro depois.",
    trafego: "Antecipação VIP.",
    organico: {
      bomDia: "Bom dia! Verdade que ninguém gosta de ouvir: depois dos 40, cada mês parado a massa magra cai mais e o metabolismo desce mais. Não agir não é neutro — cobra juros.",
      roteiro: ["Story 1 (selfie): o custo fisiológico de esperar + contagem.", "Story 2 (card CTA): 'VIP responde QUERO.' Peça pra seguir."],
      qtd: "4 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Verdade que ninguém gosta de ouvir: depois dos 40, esperar custa caro."
[00:04-00:15] MEIO CORPO | "Cada mês parado, a massa magra cai mais e o metabolismo desce mais. Não agir não é neutro — cobra juros no teu corpo. Daqui a um ano, recomeçar é mais difícil que hoje."
[00:15-00:24] CLOSE | "Começar agora, na fase certa, é o caminho mais curto que vai existir."
[00:24-00:30] APONTA | "VIP entra primeiro. Comenta QUERO."
TEXTO NA TELA: "o corpo não espera" | "esperar cobra juros" | "Comenta QUERO"`,
    legenda: `Verdade que ninguém gosta de ouvir: depois dos 40, esperar custa caro.\n\nCada mês parado, a massa magra cai mais e o metabolismo desce mais. Não agir não é neutro — cobra juros no teu corpo. Daqui a um ano, recomeçar é mais difícil que hoje.\n\nComeçar agora é o caminho mais curto que vai existir. VIP entra primeiro. Comenta QUERO.\nBora cuidar de você na vida. 💪\n\n#mulher40 #massamagra #decisao #protocolorv`,
    capa: "Card preto+ouro: 'O CORPO NÃO ESPERA' (ouro) + 'esperar cobra juros' + selo ⏳ + RV.",
    criativos: ["Carrossel 'O custo de esperar mais um ano (fisiológico)'.", "Thumbnail/capa animada do Reel D16."],
    checklist: ["04:30 — bom dia + contagem.", "Reel D16 — você grava.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO + seguir."],
  },
  d17: {
    id: "d17", data: "2026-07-12", fase: "pre_lancamento",
    significado: "Autoridade. 'Esse cara entende o corpo da mulher 40+ de verdade'.",
    enfase: "14 anos cuidando do corpo feminino que muda. Não é achismo.",
    trafego: "Antecipação VIP.",
    organico: {
      bomDia: "Bom dia! Por que comigo e não com qualquer um? 14 anos cuidando do corpo feminino de verdade — incluindo a fase que muda tudo. Não é achismo de internet, é prática com mulher real.",
      roteiro: ["Story 1 (selfie): autoridade (14 anos, corpo feminino que muda).", "Story 2: prova.", "Story 3 (card CTA): 'VIP responde QUERO.' Peça pra seguir."],
      qtd: "4 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Por que comigo, e não com qualquer um dançando na internet?"
[00:04-00:15] MEIO CORPO | "14 anos cuidando do corpo feminino de verdade — incluindo a fase que muda tudo: hormônio, metabolismo, idade. Não é achismo. É prática com mulher real, todos os dias."
[00:15-00:24] CLOSE | "Eu não prometo corpo de revista. Prometo direção certa pra fase que você tá vivendo."
[00:24-00:30] APONTA | "VIP entra primeiro. Comenta QUERO."
TEXTO NA TELA: "por que comigo?" | "14 anos com o corpo que muda" | "Comenta QUERO"`,
    legenda: `Por que comigo, e não com qualquer um dançando na internet?\n\n14 anos cuidando do corpo feminino de verdade — incluindo a fase que muda tudo: hormônio, metabolismo, idade. Não é achismo; é prática com mulher real. Eu não prometo corpo de revista — prometo direção certa pra fase que você vive.\n\nVIP entra primeiro. Comenta QUERO. Me segue.\nBora cuidar de você na vida. 💪\n\n#autoridade #mulher40 #protocolorv`,
    capa: "Card preto+ouro: '14 ANOS COM O CORPO QUE MUDA' (ouro em 14 ANOS) + selo ⏳ + RV. Foto de autoridade do Ruriá.",
    criativos: ["Carrossel 'Por que o Protocolo RV funciona pra mulher 40+'.", "Thumbnail/capa animada do Reel D17."],
    checklist: ["04:30 — bom dia + contagem.", "Reel D17 autoridade — você grava.", "Eu edito + capa + carrossel.", "Postar. CTA QUERO + seguir."],
  },
  d18: {
    id: "d18", data: "2026-07-13", fase: "pre_lancamento",
    significado: "Escassez real (turma acompanhada de perto).",
    enfase: "Vaga limitada de verdade — eu acompanho de perto.",
    trafego: "Antecipação VIP + lembrete de abertura.",
    organico: {
      bomDia: "Bom dia! Sem marketing barato: a 1ª turma é limitada porque eu acompanho de perto. Mulher na fase que muda precisa de ajuste, não de plano jogado. E ajuste não dá pra fazer pra mil ao mesmo tempo.",
      roteiro: ["Story 1 (selfie): escassez real explicada + contagem.", "Story 2 (card CTA): 'VIP entra primeiro — responde QUERO.' Peça pra seguir."],
      qtd: "5 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Por que a 1ª turma é limitada? Não é truque de marketing. Presta atenção."
[00:04-00:15] MEIO CORPO | "Porque mulher na fase que muda precisa de AJUSTE — não de plano jogado. E ajuste de verdade não dá pra fazer pra mil pessoas ao mesmo tempo. Prefiro turma menor e corpo respondendo."
[00:15-00:24] CLOSE | "Quando abrir, vai acabar. E a VIP entra primeiro."
[00:24-00:30] APONTA | "Comenta QUERO pra não ficar de fora."
TEXTO NA TELA: "vaga limitada DE VERDADE" | "porque eu ajusto de perto" | "Comenta QUERO"`,
    legenda: `Por que a 1ª turma é limitada? Não é truque de marketing.\n\nMulher na fase que muda precisa de AJUSTE, não de plano jogado. E ajuste de verdade não dá pra fazer pra mil ao mesmo tempo. Prefiro turma menor com corpo respondendo.\n\nQuando abrir, vai acabar. VIP entra primeiro. Comenta QUERO. Me segue.\nBora cuidar de você na vida. 💪\n\n#vagaslimitadas #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'VAGA LIMITADA DE VERDADE' (DE VERDADE em ouro) + selo ⏳ + RV.",
    criativos: ["Card 'turma limitada (porque eu ajusto de perto)'.", "Thumbnail/capa animada do Reel D18."],
    checklist: ["04:30 — bom dia + contagem.", "Reel D18 escassez — você grava.", "Eu edito + capa + card.", "Postar. CTA QUERO + seguir."],
  },
  d19: {
    id: "d19", data: "2026-07-14", fase: "pre_lancamento",
    significado: "Véspera. VIP entra primeiro e melhor.",
    enfase: "Véspera: a VIP recebe o link antes de todo mundo.",
    trafego: "Lembrete forte pra VIP.",
    organico: {
      bomDia: "Bom dia! Tá quase: a turma abre. Quem tá na VIP recebe o link ANTES, com a condição de lançamento. Fica de olho no Direct que é lá que cai primeiro.",
      roteiro: ["Story 1 (selfie): véspera, VIP primeiro + contagem.", "Story 2 (card CTA): 'última chamada da VIP: responde QUERO.' Peça pra seguir."],
      qtd: "4 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "É véspera. Amanhã a 1ª turma abre — e não abre igual pra todo mundo."
[00:04-00:15] MEIO CORPO | "Quem tá na VIP recebe o link ANTES, com a condição de lançamento. Quem não tá, espera a abertura geral e paga diferente — se ainda sobrar vaga, porque é turma limitada."
[00:15-00:24] CLOSE | "Última chamada pra entrar na VIP antes de eu fechar."
[00:24-00:30] APONTA | "Comenta QUERO agora."
TEXTO NA TELA: "é VÉSPERA" | "VIP recebe primeiro" | "Comenta QUERO"`,
    legenda: `É véspera. Amanhã a 1ª turma abre — e não abre igual pra todo mundo.\n\nQuem tá na VIP recebe o link ANTES, com a condição de lançamento. Quem não tá, espera a geral e paga diferente, se sobrar vaga.\n\nÚltima chamada da VIP. Comenta QUERO agora. Me segue.\nBora cuidar de você na vida. 💪\n\n#vespera #listavip #mulher40 #protocolorv`,
    capa: "Card preto+ouro: 'VÉSPERA' + 'VIP recebe primeiro' (ouro) + selo ⏳ '1 DIA' + RV.",
    criativos: ["Card 'VIP entra primeiro' (condição de lançamento).", "Thumbnail/capa animada do Reel D19."],
    checklist: ["04:30 — bom dia + contagem.", "Reel D19 véspera — você grava.", "Eu edito + capa + card.", "Confirmar os 3 gates ANTES de abrir."],
  },
  d20: {
    id: "d20", data: "2026-07-15", fase: "pre_lancamento",
    significado: "ABERTURA pra VIP (se gates verdes).",
    enfase: "Abertura VIP (SOMENTE se os 3 gates verdes).",
    trafego: "Conversão: campanha pra VIP/retargeting (gasto no Telegram).",
    organico: {
      bomDia: "Bom dia! Abriu pra VIP! Se você respondeu QUERO nesses dias, o link já tá indo pro teu Direct com a condição de lançamento. Agora é agir — bora cuidar na vida.",
      roteiro: ["Story 1 (selfie): 'abriu pra VIP'.", "Story 2: prova de quem já entrou.", "Story 3 (card CTA): 'VIP, confere o Direct / link aqui.'"],
      qtd: "6 stories.",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Abriu. A 1ª turma do TRINCA RV21 tá oficialmente aberta — e começou pela VIP."
[00:04-00:15] MEIO CORPO | "Se você respondeu QUERO nesses dias, o link já tá no teu Direct com a condição de lançamento. É pra quem se mexeu antes — e fez o teste pra saber o que o corpo precisa."
[00:15-00:24] CLOSE | "Vagas limitadas de verdade. Quem entrar agora, garante."
[00:24-00:30] APONTA | "VIP, confere o Direct. Bora agir."
TEXTO NA TELA: "ABRIU PRA VIP" | "link no seu Direct" | "bora agir"`,
    legenda: `Abriu. A 1ª turma do TRINCA RV21 tá oficialmente aberta — e começou pela VIP.\n\nSe você respondeu QUERO nesses dias, o link já tá no teu Direct com a condição de lançamento. Vagas limitadas de verdade — quem entrar agora, garante.\n\nVIP, confere o Direct. Bora cuidar de você na vida. 💪\n\n#abriu #listavip #trincarv21 #protocolorv`,
    capa: "Card preto+ouro: 'ABRIU PRA VIP' (ouro) + 'vagas limitadas' + RV. Energia de abertura.",
    criativos: ["Card 'Abriu pra VIP' + sequência de stories de conversão.", "Thumbnail/capa animada do Reel D20."],
    checklist: ["CONFIRMAR 3 gates verdes (sem isso, NÃO abre).", "04:30 — stories de abertura.", "Disparar link VIP (Kiwify).", "Acompanhar vendas no cockpit."],
  },
  d21: {
    id: "d21", data: "2026-07-16", fase: "pre_lancamento",
    significado: "Abertura geral / última chamada.",
    enfase: "Abertura geral + última chamada (vagas acabando).",
    trafego: "Conversão full (gasto no Telegram).",
    organico: {
      bomDia: "Bom dia! Abriu pra geral — e as vagas da 1ª turma são limitadas de verdade. Quem tava só assistindo, é agora ou espera a próxima. Bora cuidar na vida.",
      roteiro: ["Story 1 (selfie): 'abriu geral'.", "Story 2: prova + contagem de vagas.", "Story 3 (card CTA): 'última chamada, link na bio/Direct.'"],
      qtd: "6+ stories (dia de conversão).",
    },
    reelRoteiro: `[00:00-00:04] CLOSE | "Última chamada. A 1ª turma abriu pra geral — e as vagas tão acabando de verdade."
[00:04-00:15] MEIO CORPO | "Quem tava só assistindo de camarote, é agora. Não tem lista de espera mágica: ou você entra nessa turma, ou espera a próxima sem data. E o corpo, você já sabe, não espera."
[00:15-00:24] CLOSE | "Daqui a 21 dias você vai querer ter começado hoje."
[00:24-00:30] APONTA | "Link na bio e no Direct. Bora agir."
TEXTO NA TELA: "ÚLTIMA CHAMADA" | "vagas acabando" | "link na bio"`,
    legenda: `Última chamada. A 1ª turma abriu pra geral — e as vagas tão acabando de verdade.\n\nQuem tava só assistindo de camarote, é agora. Ou você entra nessa turma, ou espera a próxima sem data. E o corpo, você já sabe, não espera.\n\nDaqui a 21 dias você vai querer ter começado hoje. Link na bio e no Direct.\nBora cuidar de você na vida. 💪\n\n#ultimachamada #trincarv21 #vagaslimitadas #protocolorv`,
    capa: "Card preto+ouro: 'ÚLTIMA CHAMADA' (ouro) + 'vagas acabando' + selo de vagas + RV.",
    criativos: ["Sequência de conversão: card 'vagas acabando' + prova + CTA final.", "Thumbnail/capa animada do Reel D21."],
    checklist: ["04:30 — stories de abertura geral.", "Disparar pra lista toda.", "Acompanhar e reportar vendas em tempo real.", "Fechar a turma quando lotar."],
  },
};

/* Mapeia data ISO (YYYY-MM-DD) pro plano do dia. ROBUSTO: null fora do aquecimento (chamador trata). */
export function planByDate(iso: string): DiaPlan | null {
  return Object.values(DIA_PLANS).find((p) => p.data === iso) || null;
}
