import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/telegram";

/* ============================================================
   Telegram Webhook — você fala com @RVexpert_bot, o Claude responde.
   - /start ou /id  -> devolve seu chat_id (pra configurar TELEGRAM_CHAT_ID)
   - qualquer texto -> Claude responde com o contexto do projeto
   Segurança: confere o header secreto do Telegram.
   ============================================================ */

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

async function projectContext(): Promise<string> {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return "Sem acesso ao banco agora.";
    const db = createClient(url, key, { auth: { persistSession: false } });
    const hoje = new Date().toISOString().slice(0, 10);
    const { count: totalLeads } = await db.from("leads").select("*", { count: "exact", head: true });
    const { count: leadsHoje } = await db
      .from("leads")
      .select("*", { count: "exact", head: true })
      .gte("capturado_em", `${hoje}T00:00:00`);
    const { count: googleLeads } = await db
      .from("leads")
      .select("*", { count: "exact", head: true })
      .eq("origem", "google");
    return `Leads totais: ${totalLeads ?? 0}. Leads hoje: ${leadsHoje ?? 0}. Leads do Google: ${googleLeads ?? 0}. Meta: 1.000 leads. Lançamento: 30/06/2026.`;
  } catch {
    return "Sem acesso ao banco agora.";
  }
}

async function askClaude(pergunta: string, contexto: string): Promise<string> {
  const apiKey = clean(process.env.ANTHROPIC_API_KEY);
  if (!apiKey) return "⚠️ Claude não configurado (ANTHROPIC_API_KEY).";
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: clean(process.env.ANTHROPIC_MODEL) || "claude-sonnet-4-6",
        max_tokens: 900,
        system:
          "Você é o braço-direito do Ruriá Virgínio no projeto TRINCA RV21 (desafio fitness feminino de 21 dias, R$37,89, lançamento 30/06). Responda em português simples, direto, com emojis, como um sócio de confiança. Use o contexto do projeto. Se ele pedir uma AÇÃO que exige construir código/deploy, explique que isso é feito no Claude Code (no Mac dele) e resuma o passo. Máximo 5 parágrafos.",
        messages: [{ role: "user", content: `CONTEXTO DO PROJETO: ${contexto}\n\nPERGUNTA DO RURIÁ: ${pergunta}` }],
      }),
    });
    const data = await r.json();
    if (!r.ok) return "⚠️ Erro ao falar com o Claude agora. Tenta de novo.";
    return data.content?.[0]?.text || "Não consegui responder agora.";
  } catch {
    return "⚠️ Erro de conexão com o Claude.";
  }
}

export async function POST(request: NextRequest) {
  // segurança: header secreto do Telegram
  const expected = clean(process.env.TELEGRAM_WEBHOOK_SECRET);
  if (expected) {
    const got = request.headers.get("x-telegram-bot-api-secret-token");
    if (got !== expected) return NextResponse.json({ ok: true }); // ignora silencioso
  }

  const update = await request.json().catch(() => ({}));
  const message = update?.message ?? update?.edited_message;
  const text = clean(message?.text);
  const chatId = message?.chat?.id ? String(message.chat.id) : "";
  if (!chatId || !text) return NextResponse.json({ ok: true });

  // comandos utilitários
  if (text === "/start" || text === "/id") {
    await sendTelegramMessage(
      `👋 Oi Ruriá! Sou seu canal direto com o Claude.\n\n` +
        `Seu *chat_id* é: \`${chatId}\`\n` +
        `(Guarde — vou usar pra te mandar alertas e relatórios.)\n\n` +
        `Agora é só me mandar qualquer pergunta sobre o projeto. 👊`,
      chatId,
    );
    return NextResponse.json({ ok: true });
  }

  const contexto = await projectContext();
  const resposta = await askClaude(text, contexto);
  await sendTelegramMessage(resposta, chatId);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, info: "Telegram webhook ativo." });
}
