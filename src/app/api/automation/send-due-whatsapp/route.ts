import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTwilioMessage, isTwilioConfigured } from "@/lib/whatsapp/twilio";
import { sendTelegramMessage } from "@/lib/telegram";

/* Motor de nutrição WhatsApp — Lista VIP TRINCA RV21
   Roda a cada 30min via GitHub Actions.
   Lê mensagens pendentes da tabela automation_messages,
   envia via Twilio e marca como enviada/erro.
   Máx 10 mensagens por execução para controlar custo. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 55; // Vercel Hobby: 60s limit

const LANCAMENTO = "2026-07-16";
const MAX_POR_RUN = 10;

function cleanText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function supa() {
  const url = cleanText(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

function autenticado(req: NextRequest) {
  const validos = [process.env.AUTOMATION_API_SECRET, process.env.MONITOR_TOKEN]
    .map(cleanText)
    .filter(Boolean);
  const recebido =
    cleanText(req.headers.get("x-automation-secret")) ||
    cleanText(req.nextUrl.searchParams.get("token"));
  return validos.length > 0 && validos.includes(recebido);
}

export async function POST(req: NextRequest) {
  if (!autenticado(req)) {
    return NextResponse.json({ error: "Token invalido." }, { status: 401 });
  }

  const db = supa();
  if (!db) {
    return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });
  }

  if (!isTwilioConfigured()) {
    return NextResponse.json({ error: "Twilio nao configurado (TWILIO_ACCOUNT_SID/AUTH_TOKEN)." }, { status: 503 });
  }

  const agora = new Date().toISOString();

  // Claim atômico: pega e marca como 'enviando' para evitar double-send
  // em caso de execuções paralelas
  const { data: candidatas, error: erroQuery } = await db
    .from("automation_messages")
    .select("id,whatsapp,nome,etapa,canal,mensagem,metadata,enviar_em")
    .eq("status", "pendente")
    .eq("canal", "whatsapp")
    .lte("enviar_em", agora)
    .order("enviar_em", { ascending: true })
    .limit(MAX_POR_RUN);

  if (erroQuery) {
    return NextResponse.json({ error: erroQuery.message }, { status: 500 });
  }

  if (!candidatas || candidatas.length === 0) {
    return NextResponse.json({ ok: true, enviadas: 0, mensagem: "Nenhuma mensagem pendente agora." });
  }

  const ids = candidatas.map((m: { id: string }) => m.id);

  // Marcar como 'enviando' (claim atômico — bloqueia outras instâncias)
  await db
    .from("automation_messages")
    .update({ status: "enviando" })
    .in("id", ids)
    .eq("status", "pendente"); // só muta se ainda pendente

  // Confirma quantas foram realmente capturadas por esta instância
  const { data: claimed } = await db
    .from("automation_messages")
    .select("id,whatsapp,nome,etapa,canal,mensagem,metadata")
    .in("id", ids)
    .eq("status", "enviando");

  if (!claimed || claimed.length === 0) {
    return NextResponse.json({ ok: true, enviadas: 0, mensagem: "Nenhuma mensagem capturada (outra instância pegou primeiro)." });
  }

  const resultados: Array<{ id: string; etapa: string; ok: boolean; sid?: string; erro?: string }> = [];

  for (const msg of claimed) {
    const id = String(msg.id);
    try {
      const result = await sendTwilioMessage({
        id,
        whatsapp: msg.whatsapp,
        mensagem: msg.mensagem,
        etapa: msg.etapa,
        metadata: msg.metadata || {},
      });

      await db
        .from("automation_messages")
        .update({
          status: "enviada",
          metadata: {
            ...(typeof msg.metadata === "object" && msg.metadata !== null ? msg.metadata : {}),
            enviada_em: new Date().toISOString(),
            twilio_message_ids: result.messageIds,
          },
        })
        .eq("id", id);

      resultados.push({ id, etapa: String(msg.etapa || ""), ok: true, sid: result.messageIds[0] });
    } catch (err) {
      const motivo = err instanceof Error ? err.message : String(err);

      await db
        .from("automation_messages")
        .update({
          status: "erro",
          metadata: {
            ...(typeof msg.metadata === "object" && msg.metadata !== null ? msg.metadata : {}),
            erro_msg: motivo,
            erro_em: new Date().toISOString(),
          },
        })
        .eq("id", id);

      resultados.push({ id, etapa: String(msg.etapa || ""), ok: false, erro: motivo });
    }
  }

  const enviadas = resultados.filter((r) => r.ok).length;
  const falhas = resultados.filter((r) => !r.ok).length;

  // Alerta no Telegram se houve falhas
  if (falhas > 0) {
    const detalhe = resultados
      .filter((r) => !r.ok)
      .map((r) => `• ${r.etapa}: ${r.erro}`)
      .join("\n");
    await sendTelegramMessage(
      `⚠️ *Motor WhatsApp — ${falhas} falha(s)*\n\n${detalhe}\n\n_Lançamento: ${LANCAMENTO}_`
    ).catch(() => {});
  }

  return NextResponse.json({
    ok: true,
    enviadas,
    falhas,
    total: claimed.length,
    resultados,
  });
}

// GET leve — mostra fila pendente sem enviar (diagnóstico)
export async function GET(req: NextRequest) {
  if (!autenticado(req)) {
    return NextResponse.json({ error: "Token invalido." }, { status: 401 });
  }

  const db = supa();
  if (!db) return NextResponse.json({ error: "Supabase nao configurado." }, { status: 503 });

  const agora = new Date().toISOString();

  const { data: pendentes } = await db
    .from("automation_messages")
    .select("id,nome,etapa,enviar_em,status,whatsapp")
    .in("status", ["pendente", "enviando"])
    .order("enviar_em", { ascending: true })
    .limit(50);

  const { data: proximas } = await db
    .from("automation_messages")
    .select("id,nome,etapa,enviar_em")
    .eq("status", "pendente")
    .gt("enviar_em", agora)
    .order("enviar_em", { ascending: true })
    .limit(10);

  return NextResponse.json({
    ok: true,
    agora,
    vencidas_nao_enviadas: (pendentes || []).filter((m: { enviar_em: string }) => m.enviar_em <= agora).length,
    em_fila: pendentes?.length || 0,
    proximas_a_enviar: proximas || [],
  });
}
