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

async function askClaude(system: string, user: string): Promise<ClaudeResult> {
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
      temperature: 0.2,
      system,
      messages: [
        {
          role: "user",
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

  const system =
    "Voce e um assistente de atendimento do TRINCA RV21. " +
    "Crie uma resposta curta, humana, premium e objetiva para WhatsApp/Instagram DM. " +
    "Nao prometa resultado garantido, nao de aconselhamento medico e nao envie link do grupo oficial. " +
    "Se a pessoa quiser entrar, direcione para a landing/checkout. Responda somente JSON valido.";
  const user = JSON.stringify({
    tarefa: "responder_dm_trinca_rv21",
    contexto:
      "TRINCA RV21 e um desafio feminino de 21 dias com treino, dieta por objetivo, materiais, WhatsApp e grupo oficial liberado no final da sequencia pos-compra.",
    inbound: {
      whatsapp: cleanText(input.whatsapp),
      mensagem,
      button_payload: cleanText(input.buttonPayload),
      button_text: cleanText(input.buttonText),
      etapa: cleanText(input.etapa),
      raw_payload: input.rawPayload || null,
    },
    formato_resposta: {
      responder: "boolean",
      categoria: "duvida|objecao|interesse|suporte|fora_de_contexto",
      sentimento: "positivo|neutro|negativo",
      resposta: "string curta para enviar a lead",
      acao_recomendada: "string curta",
    },
  });

  return askClaude(system, user);
}
