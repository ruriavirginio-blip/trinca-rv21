import { after, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { responderDM } from "@/lib/claude-ai";
import {
  cleanText,
  normalizeBrazilianWhatsapp,
  sameBrazilianWhatsapp,
} from "@/lib/whatsapp/phone";
import { sendTwilioMessage } from "@/lib/whatsapp/twilio";

type JsonObject = Record<string, unknown>;
type SupabaseTable = {
  Row: JsonObject;
  Insert: JsonObject;
  Update: JsonObject;
  Relationships: [];
};

type Database = {
  public: {
    Tables: {
      automation_messages: SupabaseTable;
      leads: SupabaseTable;
      twilio_interactions: SupabaseTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

type AppSupabaseClient = SupabaseClient<Database>;

const BUTTON_GATE_BY_PAYLOAD: Record<
  string,
  { etapa: string; etapaFunil: string; description: string }
> = {
  compra_confirmada_estou_pronta: {
    etapa: "clique-compra-confirmada-estou-pronta",
    etapaFunil: "boas-vindas",
    description: "Clique em Estou pronta apos compra confirmada.",
  },
  assistir_boas_vindas_grupo: {
    etapa: "clique-grupo-assistir-boas-vindas",
    etapaFunil: "grupo",
    description: "Clique em Assistir boas-vindas antes do video do grupo.",
  },
  ja_assisti_boas_vindas: {
    etapa: "clique-boas-vindas-assistido",
    etapaFunil: "materiais",
    description: "Clique em Ja assisti apos o video de boas-vindas (libera materiais).",
  },
  recebi_materiais: {
    etapa: "clique-materiais-recebido",
    etapaFunil: "grupo",
    description: "Clique em Recebi apos os materiais (libera grupo).",
  },
  quero_link_grupo: {
    etapa: "clique-grupo-quero-link",
    etapaFunil: "grupo",
    description: "Clique em Quero o link apos o video do grupo (libera link).",
  },
};

const BUTTON_PAYLOAD_ALIASES: Record<string, string> = {
  "estou pronta": "compra_confirmada_estou_pronta",
  "compra confirmada estou pronta": "compra_confirmada_estou_pronta",
  "compra_confirmada_estou_pronta": "compra_confirmada_estou_pronta",
  "assistir boas vindas": "assistir_boas_vindas_grupo",
  "assistir boas-vindas": "assistir_boas_vindas_grupo",
  "assistir_boas_vindas_grupo": "assistir_boas_vindas_grupo",
  "ja assisti": "ja_assisti_boas_vindas",
  "já assisti": "ja_assisti_boas_vindas",
  "ja_assisti_boas_vindas": "ja_assisti_boas_vindas",
  "recebi": "recebi_materiais",
  "recebi, continuar": "recebi_materiais",
  "recebi_materiais": "recebi_materiais",
  "quero o link": "quero_link_grupo",
  "quero_link_grupo": "quero_link_grupo",
};

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function readWebhookToken(request: Request, payload: JsonObject) {
  const url = new URL(request.url);
  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.replace(/^Bearer\s+/i, "").trim();

  return [
    url.searchParams.get("token"),
    request.headers.get("x-twilio-webhook-secret"),
    request.headers.get("x-webhook-token"),
    request.headers.get("x-token"),
    bearerToken,
    payload.token,
    payload.webhook_token,
  ]
    .map(cleanText)
    .filter(Boolean);
}

function expectedTwilioSignature(url: string, payload: JsonObject, authToken: string) {
  const sortedKeys = Object.keys(payload).sort();
  const data = sortedKeys.reduce((acc, key) => `${acc}${key}${cleanText(payload[key])}`, url);

  return createHmac("sha1", authToken).update(data).digest("base64");
}

function validTwilioSignature(request: Request, payload: JsonObject) {
  const authToken = cleanText(process.env.TWILIO_AUTH_TOKEN);
  const signature = cleanText(request.headers.get("x-twilio-signature"));

  if (!authToken || !signature) {
    return false;
  }

  const expected = expectedTwilioSignature(request.url, payload, authToken);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function authorizeWebhook(request: Request, payload: JsonObject) {
  const secret = cleanText(process.env.TWILIO_WEBHOOK_SECRET);
  const receivedTokens = readWebhookToken(request, payload);

  if (validTwilioSignature(request, payload)) {
    return null;
  }

  if (secret && !receivedTokens.includes(secret)) {
    return NextResponse.json({ error: "Token invalido." }, { status: 401 });
  }

  return null;
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = cleanText(value);

    if (text) {
      return text;
    }
  }

  return "";
}

async function parsePayload(request: Request): Promise<JsonObject> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return asObject(await request.json());
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();
    const payload: JsonObject = {};

    formData.forEach((value, key) => {
      payload[key] = typeof value === "string" ? value : value.name;
    });

    return payload;
  }

  const rawBody = await request.text();
  const params = new URLSearchParams(rawBody);

  if ([...params.keys()].length) {
    return Object.fromEntries(params.entries());
  }

  return rawBody ? { Body: rawBody } : {};
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

function senderWhatsapp(payload: JsonObject) {
  return normalizeBrazilianWhatsapp(
    firstText(payload.WaId, payload.From, payload.from, payload.Sender, payload.sender)
  );
}

function buttonPayload(payload: JsonObject) {
  const rawPayload = firstText(
    payload.ButtonPayload,
    payload.ButtonId,
    payload.Payload,
    payload.InteractiveButtonPayload,
    payload.Body,
    payload.body
  );
  const normalizedPayload = rawPayload
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return BUTTON_PAYLOAD_ALIASES[normalizedPayload] || rawPayload;
}

function buttonText(payload: JsonObject) {
  return firstText(payload.ButtonText, payload.ButtonTitle, payload.Body, payload.body);
}

function inboundText(payload: JsonObject) {
  return firstText(payload.Body, payload.body, payload.Message, payload.message);
}

function claudeReplyText(response: JsonObject) {
  const data = asObject(response.data);
  const responder = data.responder;
  const resposta = cleanText(data.resposta);

  if (responder === false || !resposta) {
    return "";
  }

  return resposta;
}

async function insertInteraction(
  supabase: AppSupabaseClient,
  interaction: JsonObject
) {
  const { error } = await supabase.from("twilio_interactions").insert(interaction);

  if (error) {
    console.error("Erro ao registrar interacao Twilio", error.message);
  }
}

// Reconstrói o histórico da conversa (inbound da lead + respostas do Claude) pra dar memória.
async function loadConversationHistory(
  supabase: AppSupabaseClient,
  whatsapp: string,
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  if (!whatsapp) return [];
  const { data } = await supabase
    .from("twilio_interactions")
    .select("raw_payload, received_at")
    .eq("from_whatsapp", whatsapp)
    .order("received_at", { ascending: true })
    .limit(24);
  const hist: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const row of (data as JsonObject[] | null) || []) {
    const rp = asObject(row.raw_payload);
    const inbound = cleanText(rp.Body) || cleanText(asObject(rp.source_payload).Body);
    const assistant = cleanText(asObject(asObject(rp.claude_response).data).resposta);
    if (inbound) hist.push({ role: "user", content: inbound });
    if (assistant) hist.push({ role: "assistant", content: assistant });
  }
  return hist.slice(-16);
}

async function findGateMessage(
  supabase: AppSupabaseClient,
  etapa: string,
  whatsappDigits: string
) {
  const { data, error } = await supabase
    .from("automation_messages")
    .select("id,email,whatsapp,nome,order_id,metadata,created_at")
    .eq("status", "aguardando-clique")
    .eq("etapa", etapa)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return (
    (data || []).find((message) => {
      const row = message as JsonObject;

      return sameBrazilianWhatsapp(row.whatsapp, whatsappDigits);
    }) || null
  );
}

async function markGateAsCompleted(
  supabase: AppSupabaseClient,
  gateMessage: JsonObject,
  payload: JsonObject,
  receivedPayload: string
) {
  const metadata = asObject(gateMessage.metadata);

  const { error } = await supabase
    .from("automation_messages")
    .update({
      status: "concluida",
      metadata: {
        ...metadata,
        completed_by: "twilio_button_click",
        completed_at: new Date().toISOString(),
        received_button_payload: receivedPayload,
        twilio_message_sid: firstText(payload.MessageSid, payload.SmsMessageSid, payload.SmsSid),
      },
    })
    .eq("id", cleanText(gateMessage.id));

  if (error) {
    throw new Error(error.message);
  }

  // Conserto de latência/ordem: ao concluir o gate, a etapa que ele libera
  // passa a estar VENCIDA agora (enviar_em = agora) — assim dispara logo após
  // o clique, em ordem, em vez de esperar o atraso absoluto contado da compra.
  const unlocksStep = cleanText(metadata.unlocks_step);
  if (unlocksStep) {
    const orderId = cleanText(gateMessage.order_id);
    const email = cleanText(gateMessage.email);
    let q = supabase
      .from("automation_messages")
      .update({ enviar_em: new Date().toISOString() })
      .eq("etapa", unlocksStep)
      .eq("status", "pendente");
    q = orderId ? q.eq("order_id", orderId) : q.eq("email", email);
    await q;
  }
}

async function updateLeadStage(
  supabase: AppSupabaseClient,
  gateMessage: JsonObject,
  etapaFunil: string
) {
  const email = cleanText(gateMessage.email);

  if (!email) {
    return;
  }

  const { error } = await supabase
    .from("leads")
    .update({ etapa_funil: etapaFunil })
    .eq("email", email);

  if (error) {
    console.error("Erro ao atualizar etapa da lead", error.message);
  }
}

async function claimPendingMessage(supabase: AppSupabaseClient, message: JsonObject) {
  const metadata = asObject(message.metadata);
  const { data, error } = await supabase
    .from("automation_messages")
    .update({
      status: "processando",
      metadata: {
        ...metadata,
        processing: {
          started_at: new Date().toISOString(),
          worker: "twilio_click_dispatch",
        },
      },
    })
    .eq("id", cleanText(message.id))
    .eq("status", "pendente")
    .select("id")
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return Boolean(data?.length);
}

function requiredPreviousSteps(message: JsonObject) {
  const metadata = asObject(message.metadata);
  const required = metadata.required_previous_steps;

  return Array.isArray(required) ? required.map(cleanText).filter(Boolean) : [];
}

function sentAtFromMetadata(message: JsonObject) {
  const metadata = asObject(message.metadata);
  const provider = asObject(metadata.whatsapp_provider);

  return cleanText(metadata.completed_at) || cleanText(provider.sent_at) || cleanText(message.created_at);
}

function delayAfterPreviousMinutes(message: JsonObject) {
  const metadata = asObject(message.metadata);
  const minutes = Number(metadata.delay_after_previous_minutes || 0);

  return Number.isFinite(minutes) ? Math.max(minutes, 0) : 0;
}

async function hasCompletedPreviousSteps(
  supabase: AppSupabaseClient,
  message: JsonObject
) {
  const required = requiredPreviousSteps(message);

  if (!required.length) {
    return true;
  }

  const orderId = cleanText(message.order_id);
  const email = cleanText(message.email);

  let query = supabase
    .from("automation_messages")
    .select("etapa,status,metadata,created_at")
    .in("etapa", required)
    .in("status", ["enviada", "entregue", "lida", "concluida"]);

  if (orderId) {
    query = query.eq("order_id", orderId);
  } else if (email) {
    query = query.eq("email", email);
  } else {
    return false;
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data || []) as JsonObject[];
  const completed = new Set(rows.map((row) => cleanText(row.etapa)));

  if (!required.every((step) => completed.has(step))) {
    return false;
  }

  const delayMinutes = delayAfterPreviousMinutes(message);

  if (!delayMinutes) {
    return true;
  }

  const latestRequiredTime = Math.max(
    ...rows
      .filter((row) => required.includes(cleanText(row.etapa)))
      .map((row) => new Date(sentAtFromMetadata(row)).getTime())
      .filter((time) => Number.isFinite(time))
  );

  if (!Number.isFinite(latestRequiredTime)) {
    return false;
  }

  return Date.now() >= latestRequiredTime + delayMinutes * 60 * 1000;
}

async function dispatchDueMessagesAfterClick(
  supabase: AppSupabaseClient,
  gateMessage: JsonObject
) {
  const orderId = cleanText(gateMessage.order_id);
  const email = cleanText(gateMessage.email);
  const sent: JsonObject[] = [];
  const skipped: JsonObject[] = [];
  const failed: JsonObject[] = [];

  if (!orderId && !email) {
    return { sent, skipped, failed };
  }

  // Cascata: re-consulta a cada passada e envia TODAS as etapas que ficaram
  // elegiveis (respeitando gates/pre-requisitos), ate nao haver mais nada.
  // Assim, ao clicar um botao, a sequencia avanca em segundos (sem esperar o cron).
  for (let pass = 0; pass < 8; pass++) {
    const now = new Date().toISOString();
    let query = supabase
      .from("automation_messages")
      .select(
        "id,email,whatsapp,nome,order_id,payment_method,trigger_event,etapa,canal,mensagem,enviar_em,status,metadata"
      )
      .eq("status", "pendente")
      .lte("enviar_em", now)
      .order("enviar_em", { ascending: true })
      .limit(6);
    query = orderId ? query.eq("order_id", orderId) : query.eq("email", email);

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    let sentThisPass = 0;
    for (const message of (data || []) as JsonObject[]) {
      const messageId = cleanText(message.id);

      try {
        const previousStepsCompleted = await hasCompletedPreviousSteps(supabase, message);

        if (!previousStepsCompleted) {
          skipped.push({
            id: messageId,
            etapa: message.etapa,
            reason: "required_previous_steps_pending",
          });
          continue;
        }

        if (!(await claimPendingMessage(supabase, message))) {
          skipped.push({
            id: messageId,
            etapa: message.etapa,
            reason: "message_already_claimed",
          });
          continue;
        }

        const result = await sendTwilioMessage({
          id: messageId,
          whatsapp: message.whatsapp,
          mensagem: message.mensagem,
          etapa: message.etapa,
          metadata: message.metadata,
        });
        const metadata = asObject(message.metadata);

        const { error: updateError } = await supabase
          .from("automation_messages")
          .update({
            status: "enviada",
            metadata: {
              ...metadata,
              whatsapp_provider: {
                provider: result.provider,
                mode: result.mode,
                message_ids: result.messageIds,
                sent_at: new Date().toISOString(),
                responses: result.responses,
                triggered_by: "twilio_click_immediate_dispatch",
              },
            },
          })
          .eq("id", messageId);

        if (updateError) {
          throw new Error(updateError.message);
        }

        sent.push({
          id: messageId,
          etapa: message.etapa,
          message_ids: result.messageIds,
        });
        sentThisPass++;
      } catch (sendError) {
        const errorMessage =
          sendError instanceof Error ? sendError.message : "Erro desconhecido no envio.";
        const metadata = asObject(message.metadata);

        await supabase
          .from("automation_messages")
          .update({
            status: "erro",
            metadata: {
              ...metadata,
              whatsapp_provider_error: {
                provider: "twilio",
                failed_at: new Date().toISOString(),
                message: errorMessage,
                triggered_by: "twilio_click_immediate_dispatch",
              },
            },
          })
          .eq("id", messageId);

        failed.push({
          id: messageId,
          etapa: message.etapa,
          error: errorMessage,
        });
      }
    }

    if (sentThisPass === 0) break;
  }

  return { sent, skipped, failed };
}

export async function POST(request: Request) {
  let payload: JsonObject;
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry_run") === "true";

  try {
    payload = await parsePayload(request);
  } catch {
    return NextResponse.json({ error: "Payload Twilio invalido." }, { status: 400 });
  }

  const authError = authorizeWebhook(request, payload);

  if (authError) {
    return authError;
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase ainda nao configurado no ambiente." },
      { status: 503 }
    );
  }

  // Dedupe: o Twilio pode REENVIAR o mesmo webhook (retry). Se ja registramos este
  // MessageSid, ignoramos para nao reprocessar o clique nem reenviar mensagens (= gasto).
  const incomingSid = firstText(payload.MessageSid, payload.SmsMessageSid, payload.SmsSid);
  if (!dryRun && incomingSid) {
    const { data: jaVisto } = await supabase
      .from("twilio_interactions")
      .select("id")
      .eq("message_sid", incomingSid)
      .limit(1);
    if (jaVisto && jaVisto.length) {
      return NextResponse.json({ ok: true, deduped: true, message_sid: incomingSid });
    }
  }

  const whatsappDigits = senderWhatsapp(payload);
  const receivedButtonPayload = buttonPayload(payload);
  const gate = BUTTON_GATE_BY_PAYLOAD[receivedButtonPayload];
  const receivedAt = new Date().toISOString();

  await insertInteraction(supabase, {
    provider: "twilio",
    from_whatsapp: whatsappDigits || null,
    message_sid: firstText(payload.MessageSid, payload.SmsMessageSid, payload.SmsSid) || null,
    button_payload: receivedButtonPayload || null,
    button_text: buttonText(payload) || null,
    raw_payload: payload,
    received_at: receivedAt,
  });

  if (!whatsappDigits) {
    return NextResponse.json({
      ok: true,
      ignored: "Webhook Twilio recebido sem WhatsApp de origem.",
    });
  }

  if (!gate) {
    const messageText = inboundText(payload);

    if (messageText) {
      after(async () => {
        // Memória da conversa → Claude responde como o Ruriá e CAPTA pra VIP.
        const historico = await loadConversationHistory(supabase, whatsappDigits);
        const dmResponse = await responderDM({
          whatsapp: whatsappDigits,
          mensagem: messageText,
          buttonPayload: receivedButtonPayload,
          buttonText: buttonText(payload),
          rawPayload: payload,
          historico,
        });
        if (dmResponse.skipped) {
          return;
        }

        const resposta = claudeReplyText(dmResponse as JsonObject);

        if (resposta) {
          try {
            await sendTwilioMessage({
              id: firstText(payload.MessageSid, payload.SmsMessageSid, payload.SmsSid),
              whatsapp: whatsappDigits,
              mensagem: resposta,
              etapa: "claude-dm-resposta",
              metadata: {
                source: "claude_dm",
                whatsapp_api: {
                  template_name: "trinca_aviso_oficial",
                  template_category: "UTILITY",
                  language: "pt_BR",
                  body_variables: {},
                  body_variable_order: [],
                },
              },
            });
          } catch (replyError) {
            console.error("Erro ao enviar resposta Claude pelo Twilio", replyError);
          }
        }

        // Captação automática: quando a lead esquenta, entra na LISTA VIP + nutrição.
        const dmData = asObject((dmResponse as JsonObject).data);
        const prontaVip = dmData.pronta_para_vip === true || cleanText(dmData.pronta_para_vip) === "true";
        if (prontaVip) {
          try {
            await fetch(`${url.origin}/api/prelancamento/registrar-vip`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                whatsapp: whatsappDigits,
                nome: cleanText(dmData.nome_detectado) || undefined,
                objetivo: cleanText(dmData.objetivo_detectado) || undefined,
                origem_captura: "whatsapp-claude",
              }),
            });
          } catch (vipErr) {
            console.error("Erro ao registrar VIP via conversa Claude", vipErr);
          }
        }

        await insertInteraction(supabase, {
          provider: "claude",
          from_whatsapp: whatsappDigits,
          message_sid:
            firstText(payload.MessageSid, payload.SmsMessageSid, payload.SmsSid) || null,
          button_payload: receivedButtonPayload || null,
          button_text: buttonText(payload) || null,
          raw_payload: {
            claude_response: dmResponse,
            source_payload: payload,
          },
          received_at: new Date().toISOString(),
        });
      });
    }

    return NextResponse.json({
      ok: true,
      ignored: "Webhook Twilio recebido sem botao mapeado para gate do fluxo.",
      button_payload: receivedButtonPayload || null,
    });
  }

  const gateMessage = await findGateMessage(supabase, gate.etapa, whatsappDigits);

  if (!gateMessage) {
    return NextResponse.json({
      ok: true,
      ignored: "Clique reconhecido, mas nenhum gate pendente foi encontrado para este WhatsApp.",
      etapa: gate.etapa,
    });
  }

  await markGateAsCompleted(supabase, gateMessage as JsonObject, payload, receivedButtonPayload);
  await updateLeadStage(supabase, gateMessage as JsonObject, gate.etapaFunil);
  const immediateDispatch = dryRun
    ? { dry_run: true, sent: [], skipped: [], failed: [] }
    : await dispatchDueMessagesAfterClick(supabase, gateMessage as JsonObject);

  return NextResponse.json({
    ok: true,
    completed: true,
    etapa: gate.etapa,
    description: gate.description,
    immediateDispatch,
  });
}

export async function GET(request: Request) {
  const authError = authorizeWebhook(request, {});

  if (authError) {
    return authError;
  }

  return NextResponse.json({
    ok: true,
    provider: "twilio",
    route: "/api/twilio/webhook",
    accepts: ["application/x-www-form-urlencoded", "multipart/form-data", "application/json"],
    mapped_button_payloads: Object.keys(BUTTON_GATE_BY_PAYLOAD),
    mapped_text_aliases: Object.keys(BUTTON_PAYLOAD_ALIASES),
    supabase_configured: Boolean(
      cleanText(process.env.SUPABASE_URL) && cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY)
    ),
    webhook_secret_configured: Boolean(cleanText(process.env.TWILIO_WEBHOOK_SECRET)),
  });
}
