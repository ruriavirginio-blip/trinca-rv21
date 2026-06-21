import { NextRequest, NextResponse } from "next/server";

/* ============================================================
   Telegram Setup / Diagnóstico — garante o canal sempre vivo.
   GET                -> mostra o status do webhook (getWebhookInfo)
   GET ?register=1    -> (re)registra o webhook na URL de produção
   A URL de destino é sempre a PRÓPRIA origem (sem aceitar URL externa),
   então é idempotente e seguro chamar a qualquer momento.
   ============================================================ */

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function api(token: string, method: string) {
  return `https://api.telegram.org/bot${token}/${method}`;
}

export async function GET(request: NextRequest) {
  const token = clean(process.env.TELEGRAM_BOT_TOKEN);
  if (!token) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_BOT_TOKEN ausente." }, { status: 503 });
  }

  // origem real desta requisição (https://protocolorv.com.br)
  const origin = request.nextUrl.origin;
  const webhookUrl = `${origin}/api/telegram/webhook`;
  const secret = clean(process.env.TELEGRAM_WEBHOOK_SECRET);

  const register = request.nextUrl.searchParams.get("register") === "1";

  try {
    if (register) {
      const body: Record<string, unknown> = {
        url: webhookUrl,
        allowed_updates: ["message", "edited_message"],
        drop_pending_updates: false,
      };
      if (secret) body.secret_token = secret;
      const r = await fetch(api(token, "setWebhook"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const setResult = await r.json();
      const infoRes = await fetch(api(token, "getWebhookInfo"));
      const info = await infoRes.json();
      return NextResponse.json({ ok: Boolean(setResult.ok), action: "register", webhookUrl, setResult, info: info.result });
    }

    const infoRes = await fetch(api(token, "getWebhookInfo"));
    const info = await infoRes.json();
    const result = info.result || {};
    const registeredHere = clean(result.url) === webhookUrl;
    return NextResponse.json({
      ok: true,
      action: "status",
      expectedWebhookUrl: webhookUrl,
      registeredHere,
      hasSecretConfigured: Boolean(secret),
      secretMatches: Boolean(result.has_custom_certificate === false) && registeredHere,
      info: result,
      hint: registeredHere
        ? "Webhook registrado corretamente. Canal vivo."
        : "Webhook NÃO aponta para cá. Chame ?register=1 para corrigir.",
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
