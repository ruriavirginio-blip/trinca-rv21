import Anthropic from "@anthropic-ai/sdk";

type JsonObject = Record<string, unknown>;

type ClaudeResult<T extends JsonObject = JsonObject> = {
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  data?: T;
  raw?: string;
};

type LeadQualificationInput = {
  nome?: unknown;
  email?: unknown;
  whatsapp?: unknown;
  objetivo?: unknown;
  origem?: unknown;
  etapaFunil?: unknown;
  utm?: unknown;
  checkoutUrl?: unknown;
};

type DmResponseInput = {
  whatsapp?: unknown;
  mensagem?: unknown;
  buttonPayload?: unknown;
  buttonText?: unknown;
  etapa?: unknown;
  rawPayload?: unknown;
  historico?: Array<{ role: "user" | "assistant"; content: string }>;
};

const DEFAULT_MODEL = "claude-3-5-haiku-20241022";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function anthropicClient() {
  const apiKey = cleanText(process.env.ANTHROPIC_API_KEY);

  if (!apiKey) {
    return null;
  }

  return new Anthropic({ apiKey });
}

function modelName() {
  return cleanText(process.env.ANTHROPIC_MODEL) || DEFAULT_MODEL;
}

function safeJsonParse(value: string): JsonObject {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);

    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as JsonObject)
      : {};
  } catch {
    return {};
  }
}

function textFromClaude(content: Anthropic.Messages.Message["content"]) {
  return content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("\n")
    .trim();
}

type ChatTurn = { role: "user" | "assistant"; content: string };

async function askClaude(
  system: string,
  user: string,
  history: ChatTurn[] = [],
): Promise<ClaudeResult> {
  const client = anthropicClient();

  if (!client) {
    return {
      ok: false,
      skipped: true,
      reason: "ANTHROPIC_API_KEY nao configurada.",
    };
  }

  try {
    const response = await client.messages.create({
      model: modelName(),
      max_tokens: 900,
      temperature: 0.4,
      system,
      messages: [
        ...history.map((h) => ({ role: h.role, content: h.content })),
        {
          role: "user" as const,
          content: user,
        },
      ],
    });
    const raw = textFromClaude(response.content);

    return {
      ok: true,
      raw,
      data: safeJsonParse(raw),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido no Claude.";

    console.error("Erro na integracao Claude", message);

    return {
      ok: false,
      reason: message,
    };
  }
}

export async function qualificarLead(
  lead: LeadQualificationInput
): Promise<ClaudeResult> {
  const system =
    "Voce e um analista senior de conversao do projeto TRINCA RV21. " +
    "Avalie a lead de forma objetiva, sem promessas de saude, sem linguagem medica e sem inventar dados. " +
    "Responda somente JSON valido.";
  const user = JSON.stringify({
    tarefa: "qualificar_lead_trinca_rv21",
    criterios: {
      score_0_100: "intencao de compra e aderencia ao desafio",
      temperatura: "fria, morna ou quente",
      prioridade: "baixa, media ou alta",
      proxima_acao: "acao operacional recomendada",
    },
    lead: {
      nome: cleanText(lead.nome),
      email: cleanText(lead.email).toLowerCase(),
      whatsapp: cleanText(lead.whatsapp),
      objetivo: cleanText(lead.objetivo),
      origem: cleanText(lead.origem),
      etapa_funil: cleanText(lead.etapaFunil),
      checkout_url: cleanText(lead.checkoutUrl),
      utm: cleanText(lead.utm),
    },
    formato_resposta: {
      score: "number",
      temperatura: "fria|morna|quente",
      prioridade: "baixa|media|alta",
      objetivo_detectado: "string",
      principal_motivacao: "string",
      risco_de_abandono: "baixo|medio|alto",
      proxima_acao: "string",
      observacao: "string curta",
    },
  });

  return askClaude(system, user);
}

export async function responderDM(input: DmResponseInput): Promise<ClaudeResult> {
  const mensagem = cleanText(input.mensagem);

  if (!mensagem) {
    return {
      ok: false,
      skipped: true,
      reason: "Mensagem inbound vazia.",
    };
  }

  const historico = Array.isArray(input.historico)
    ? input.historico
        .filter((h) => h && (h.role === "user" || h.role === "assistant") && cleanText(h.content))
        .slice(-16)
    : [];

  const system =
    "Você é o atendimento do Ruriá Virgínio (@ruriavirginio) no WhatsApp — personal há 14 anos, criador do PROTOCOLO RV. " +
    "Estamos em PRÉ-LANÇAMENTO do TRINCA RV21: desafio fitness FEMININO de 21 dias (treino direcionado + dieta de nutricionista + acompanhamento diário no grupo). " +
    "SEU OBJETIVO: conversar de forma calorosa e humana na VOZ DO RURIÁ (próximo, motivador, direto, sem firula), acolher a mulher, ENTENDER o objetivo real dela (emagrecer, glúteos, autoestima, recomeçar, tonificar, saúde...) e LEVAR ela pra LISTA VIP (acesso antecipado, sem cobrança agora). " +
    "REGRAS: NÃO fale preço, NÃO prometa resultado garantido, NÃO dê conselho médico, NÃO invente. Mensagens curtas (máx 4 linhas), no máximo 2 emojis, tom feminino e acolhedor. " +
    "Quando ela demonstrar interesse, confirme com carinho que vai colocar ela na LISTA VIP e mande o link https://protocolorv.com.br/vip. " +
    "Use o histórico da conversa pra não repetir pergunta e dar continuidade natural. Responda SOMENTE JSON válido.";

  const user = JSON.stringify({
    tarefa: "conversa_captacao_vip_pre_lancamento",
    inbound: { whatsapp: cleanText(input.whatsapp), mensagem },
    formato_resposta: {
      resposta: "string curta e humana pra mandar AGORA no WhatsApp (voz do Ruriá)",
      objetivo_detectado: "emagrecer|gluteos|autoestima|recomecar|tonificar|saude|outro|desconhecido",
      nome_detectado: "primeiro nome dela se ela disse, senão string vazia",
      pronta_para_vip: "boolean — true quando ela demonstrou interesse claro em entrar/saber mais",
      sentimento: "positivo|neutro|negativo",
    },
  });

  return askClaude(system, user, historico);
}
