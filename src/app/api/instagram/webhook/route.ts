import { NextRequest, NextResponse } from "next/server";

const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN;

const COMMENT_TRIGGERS = [
  "SEGUNDA",
  "MENTIRA",
  "RECOMEÇO",
  "EU QUERO",
  "21",
  "QUERO SABER",
  "PROTOCOLO",
  "JESSICA",
  "TRINCA",
  "CIÊNCIA",
  "ABRIU",
  "QUERO",
  "RESULTADO",
  "ÚLTIMA CHANCE",
  "HOJE",
];

type InstagramWebhookBody = {
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: {
        text?: string;
        from?: { id?: string };
        media?: { id?: string };
      };
    }>;
    // Mensagens diretas (DM / resposta de story) chegam aqui, não em `changes`.
    messaging?: Array<{
      sender?: { id?: string };
      message?: { text?: string; is_echo?: boolean };
    }>;
  }>;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InstagramWebhookBody;

    if (body.entry) {
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === "comments") {
              const comment = change.value;
              const commentText = comment?.text?.toUpperCase() || "";
              const commenterId = cleanText(comment?.from?.id);
              const mediaId = cleanText(comment?.media?.id);
              const gatilhoAtivado = COMMENT_TRIGGERS.find((gatilho) =>
                commentText.includes(gatilho),
              );

              if (gatilhoAtivado && commenterId) {
                await saveCommentLead(commenterId, gatilhoAtivado, mediaId);
                await sendAutoDM(commenterId, gatilhoAtivado);
              }
            }
          }
        }
        // Mensagem direta / resposta de story → Claude responde e leva pra VIP.
        if (entry.messaging) {
          for (const m of entry.messaging) {
            const senderId = cleanText(m.sender?.id);
            const text = cleanText(m.message?.text);
            if (senderId && text && !m.message?.is_echo) {
              await handleDirectMessage(senderId, text);
            }
          }
        }
      }
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function saveCommentLead(userId: string, gatilho: string, mediaId: string) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabaseUrl = cleanText(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseServiceRoleKey = cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase URL ou service role ausente.");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  await supabase.from("comment_leads").upsert(
    {
      instagram_user_id: userId,
      gatilho_ativado: gatilho,
      media_id: mediaId || null,
      created_at: new Date().toISOString(),
    },
    { onConflict: "instagram_user_id" },
  );
}

async function sendAutoDM(userId: string, gatilho: string) {
  const instagramAccessToken = cleanText(process.env.INSTAGRAM_ACCESS_TOKEN);
  const anthropicApiKey = cleanText(process.env.ANTHROPIC_API_KEY);

  if (!instagramAccessToken || !anthropicApiKey) {
    return;
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: cleanText(process.env.ANTHROPIC_MODEL) || "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Você é o assistente de Ruriá Virgínio (@ruriavirginio), personal trainer com 14 anos de experiência e criador do PROTOCOLO RV.

Uma pessoa comentou "${gatilho}" em um post sobre TRINCA RV21 (desafio fitness feminino de 21 dias).

Estamos em PRÉ-LANÇAMENTO (aquecimento) — NÃO é pra vender nem falar de preço agora. O objetivo é convidar ela pra LISTA VIP, onde ela recebe o acesso antes de todo mundo.

Escreva exatamente uma DM curta, calorosa e direta (máx 4 linhas) que:
1. Reconhece o comentário dela
2. Convida pra entrar na lista VIP e garantir acesso antecipado (sem cobrança agora)
3. Direciona obrigatoriamente para: https://protocolorv.com.br/vip

Obrigatório incluir as expressões "lista VIP", "acesso antecipado" e "protocolorv.com.br/vip".
NÃO mencione preço. Tom: próximo, motivador, feminino. Máx 2 emojis.`,
        },
      ],
    }),
  });

  const data = await response.json();
  const message =
    data.content?.[0]?.text ||
    "Oi! Vi seu comentário 💛 Entra na lista VIP do TRINCA RV21 e garante seu acesso antecipado (sem cobrança agora). É só entrar aqui: https://protocolorv.com.br/vip";

  await fetch("https://graph.instagram.com/v21.0/me/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: userId },
      message: { text: message },
      access_token: instagramAccessToken,
    }),
  });
}

// Responde mensagens diretas (DM / resposta de story) com a Claude API e leva pra VIP.
async function handleDirectMessage(userId: string, text: string) {
  const instagramAccessToken = cleanText(process.env.INSTAGRAM_ACCESS_TOKEN);
  const anthropicApiKey = cleanText(process.env.ANTHROPIC_API_KEY);
  if (!instagramAccessToken || !anthropicApiKey) return;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: cleanText(process.env.ANTHROPIC_MODEL) || "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Você é o assistente de Ruriá Virgínio (@ruriavirginio), personal há 14 anos, criador do PROTOCOLO RV. Estamos em PRÉ-LANÇAMENTO do TRINCA RV21 (desafio fitness feminino de 21 dias) — NÃO venda nem fale preço.

A pessoa te mandou no direct: "${text}"

Responda em UMA mensagem curta (máx 4 linhas), calorosa e na voz do Ruriá: reconheça a mensagem dela, responda a dúvida se houver, e convide pra entrar na LISTA VIP (acesso antecipado, sem cobrança agora) mandando pra https://protocolorv.com.br/vip. Inclua obrigatoriamente "lista VIP", "acesso antecipado" e "protocolorv.com.br/vip". Tom próximo, motivador, feminino. Máx 2 emojis.`,
        },
      ],
    }),
  });

  const data = await response.json();
  const message =
    data.content?.[0]?.text ||
    "Oi! 💛 Que bom te ver por aqui. Entra na lista VIP do TRINCA RV21 e garante seu acesso antecipado (sem cobrança agora): https://protocolorv.com.br/vip";

  await fetch("https://graph.instagram.com/v21.0/me/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: userId },
      message: { text: message },
      access_token: instagramAccessToken,
    }),
  });
}
