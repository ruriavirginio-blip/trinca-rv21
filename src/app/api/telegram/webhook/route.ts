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
    const { data: st } = await db.from("project_status").select("*").eq("id", 1).single();
    const statusTxt = st
      ? `\nANDAMENTO ATUAL (centro operacional): Fase: ${st.fase}. Em execução agora: ${st.em_execucao}. Resumo: ${st.resumo}. Próximos passos: ${st.proximos_passos}. (atualizado ${st.atualizado_em})`
      : "";
    return `Leads totais: ${totalLeads ?? 0}. Leads hoje: ${leadsHoje ?? 0}. Leads do Google: ${googleLeads ?? 0}. Meta: 1.000 leads. Lançamento: 30/06/2026.${statusTxt}`;
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
          "Você é o braço-direito do Ruriá Virgínio no projeto TRINCA RV21 (desafio fitness feminino de 21 dias, R$37,89, lançamento 30/06). REGRA DE OURO: seja OBJETIVO e DIRETO. Pergunta simples = resposta curta (1-2 frases). Só dê resposta longa/detalhada quando ele PEDIR detalhes ou o assunto exigir. Nada de textão. Tom de sócio de confiança, pode usar 1 emoji. Se ele pedir uma ação que exige construir código/deploy, diga em 1 linha que isso é feito no Claude Code.",
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

  // Salva toda mensagem recebida (fila de lembranças do Ruriá)
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key && message?.message_id) {
      const db = createClient(url, key, { auth: { persistSession: false } });
      const isLembrete = /lembr|n[ãa]o esque|anota|guarda|me lembr|tarefa|pend[êe]ncia/i.test(text);
      await db.from("telegram_messages").upsert({
        id: message.message_id,
        chat_id: chatId,
        nome: clean(message?.chat?.first_name),
        texto: text,
        is_lembrete: isLembrete,
      });
    }
  } catch {
    /* log silencioso */
  }

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
  return NextResponse.json({
    ok: true,
    info: "Telegram webhook ativo.",
    env: {
      hasToken: Boolean(clean(process.env.TELEGRAM_BOT_TOKEN)),
      hasSecret: Boolean(clean(process.env.TELEGRAM_WEBHOOK_SECRET)),
      hasChat: Boolean(clean(process.env.TELEGRAM_CHAT_ID)),
      hasClaude: Boolean(clean(process.env.ANTHROPIC_API_KEY)),
    },
  });
}
