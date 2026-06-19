/* Telegram — ponte de comunicação Ruriá <-> Claude
   Envia mensagens (alertas, relatórios, respostas) pro Telegram do Ruriá. */

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export function hasTelegram() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

export async function sendTelegramMessage(text: string, chatIdOverride?: string) {
  const token = clean(process.env.TELEGRAM_BOT_TOKEN);
  const chatId = clean(chatIdOverride) || clean(process.env.TELEGRAM_CHAT_ID);
  if (!token || !chatId) {
    return { ok: false, reason: "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID ausente." };
  }
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
    });
    const data = await r.json();
    return { ok: Boolean(data.ok), data };
  } catch (error) {
    return { ok: false, reason: String(error) };
  }
}
