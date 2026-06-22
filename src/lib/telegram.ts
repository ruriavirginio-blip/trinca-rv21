/* Telegram — ponte de comunicação Ruriá <-> Claude
   Envia mensagens (alertas, relatórios, respostas) pro Telegram do Ruriá,
   inclusive alertas de erro com botão "Resolver problema" (inline keyboard). */

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export type InlineButton = { text: string; callback_data: string };

export function hasTelegram() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

type SendOptions = { buttons?: InlineButton[][] };

export async function sendTelegramMessage(
  text: string,
  chatIdOverride?: string,
  options?: SendOptions,
) {
  const token = clean(process.env.TELEGRAM_BOT_TOKEN);
  const chatId = clean(chatIdOverride) || clean(process.env.TELEGRAM_CHAT_ID);
  if (!token || !chatId) {
    return { ok: false, reason: "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID ausente." };
  }
  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    };
    if (options?.buttons?.length) {
      body.reply_markup = { inline_keyboard: options.buttons };
    }
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    return { ok: Boolean(data.ok), data };
  } catch (error) {
    return { ok: false, reason: String(error) };
  }
}

/** Confirma o clique do botão (tira o "carregando" do Telegram). */
export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const token = clean(process.env.TELEGRAM_BOT_TOKEN);
  if (!token || !callbackQueryId) return { ok: false };
  try {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId, text: clean(text) || undefined }),
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Edita a mensagem do alerta (ex: trocar pelos botões por "✅ Resolvido"). */
export async function editTelegramMessage(
  chatId: string,
  messageId: number,
  text: string,
  options?: SendOptions,
) {
  const token = clean(process.env.TELEGRAM_BOT_TOKEN);
  if (!token || !chatId || !messageId) return { ok: false };
  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    };
    if (options?.buttons?.length) {
      body.reply_markup = { inline_keyboard: options.buttons };
    }
    const r = await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    return { ok: Boolean(data.ok), data };
  } catch {
    return { ok: false };
  }
}
