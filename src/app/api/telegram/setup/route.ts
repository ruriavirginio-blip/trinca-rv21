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
  const testClaude = request.nextUrl.searchParams.get("testclaude") === "1";

  try {
    if (testClaude) {
      const apiKey = clean(process.env.ANTHROPIC_API_KEY);
      if (!apiKey) return NextResponse.json({ ok: false, claude: "sem ANTHROPIC_API_KEY" });
      const candidates = [
        clean(process.env.ANTHROPIC_MODEL),
        "claude-sonnet-4-6",
        "claude-sonnet-4-5",
        "claude-3-5-sonnet-latest",
      ].filter(Boolean);
      const results: Record<string, unknown>[] = [];
      for (const model of candidates) {
        try {
          const r = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
            body: JSON.stringify({ model, max_tokens: 8, messages: [{ role: "user", content: "ping" }] }),
          });
          const data = await r.json();
          results.push({ model, status: r.status, ok: r.ok, error: r.ok ? null : data?.error?.message || "erro" });
        } catch (e) {
          results.push({ model, ok: false, error: String(e) });
        }
      }
      const working = results.find((x) => x.ok)?.model || null;
      return NextResponse.json({ ok: Boolean(working), action: "testclaude", configuredModel: clean(process.env.ANTHROPIC_MODEL) || "(vazio)", working, results });
    }

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
