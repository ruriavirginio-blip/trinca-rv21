import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramMessage } from "@/lib/telegram";
import { publishByType } from "@/lib/instagram";
import { computeProjectMetrics } from "@/lib/project-metrics";

export const maxDuration = 60;

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
    const m = await computeProjectMetrics(db);
    const { data: st } = await db.from("project_status").select("*").eq("id", 1).single();
    const statusTxt = st
      ? `\nANDAMENTO ATUAL (centro operacional): Fase: ${st.fase}. Em execução agora: ${st.em_execucao}. Resumo: ${st.resumo}. Próximos passos: ${st.proximos_passos}. (atualizado ${st.atualizado_em})`
      : "";
    return `MÉTRICAS AO VIVO (agora): Leads totais: ${m.leads_total} de ${m.meta_leads} (${m.progresso_pct}% da meta). Leads hoje: ${m.leads_hoje}. Leads do Google: ${m.leads_google}. Checkouts iniciados: ${m.checkout_iniciado}. Vendas: ${m.vendas}. Faltam ${m.dias_para_lancamento} dias para o lançamento (${m.lancamento}).${statusTxt}`;
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

  // Aprovação/rejeição de post pendente (funciona com Ruriá offline)
  const lc = text.toLowerCase().trim();
  const isApprove = /^(sim|aprovad|aprovar|publicar|publica|pode publicar|👍|✅)/.test(lc);
  const isReject = /^(n[ãa]o|rejeit|cancela|nao publica)/.test(lc);
  if (isApprove || isReject) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      const db = createClient(url, key, { auth: { persistSession: false } });
      const { data: pend } = await db
        .from("content_factory")
        .select("*")
        .eq("status", "em_aprovacao")
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!pend) {
        await sendTelegramMessage("Não tem nenhum post aguardando aprovação agora. 👍", chatId);
        return NextResponse.json({ ok: true });
      }
      if (isReject) {
        await db.from("content_factory").update({ status: "rejeitado" }).eq("id", pend.id);
        await sendTelegramMessage("❌ Beleza, post rejeitado — não publiquei nada. Me diz o que ajustar.", chatId);
        return NextResponse.json({ ok: true });
      }
      await sendTelegramMessage("⏳ Publicando seu carrossel no Instagram...", chatId);
      const res = await publishByType(pend.tipo, pend.asset_url || "", pend.legenda || "");
      if (res.ok) {
        await db.from("content_factory").update({ status: "publicado", instagram_media_id: res.mediaId, publicado_em: new Date().toISOString() }).eq("id", pend.id);
        await sendTelegramMessage("✅ Publicado no seu Instagram! 🎉 Já pode conferir no @ruriavirginio.", chatId);
      } else {
        await db.from("content_factory").update({ status: "erro", erro_msg: res.reason }).eq("id", pend.id);
        await sendTelegramMessage("⚠️ Deu erro ao publicar: " + res.reason, chatId);
      }
      return NextResponse.json({ ok: true });
    }
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
