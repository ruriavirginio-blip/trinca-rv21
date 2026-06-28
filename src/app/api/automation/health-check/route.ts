import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "@/lib/instagram";
import { sendTelegramMessage } from "@/lib/telegram";

/* Health check semanal do motor de publicação.
   Chamado pelo GitHub Actions toda segunda-feira às 08h BRT.
   Testa o token do Instagram com uma chamada real à API.
   Se inválido → alerta Telegram imediatamente.
   Retorna JSON com status. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export async function POST(request: NextRequest) {
  const validSecrets = [process.env.AUTOMATION_API_SECRET, process.env.MONITOR_TOKEN]
    .map(clean)
    .filter(Boolean);
  const got =
    clean(request.headers.get("x-automation-secret")) ||
    clean(request.nextUrl.searchParams.get("token"));
  if (validSecrets.length && !validSecrets.includes(got)) {
    return NextResponse.json({ error: "Token invalido." }, { status: 401 });
  }

  const { valid, reason, igName } = await validateToken();

  if (valid) {
    // Token OK — só notifica se forçado (?notify=1)
    const notify = request.nextUrl.searchParams.get("notify") === "1";
    if (notify) {
      await sendTelegramMessage(
        `✅ *Health Check Instagram* — Token válido\nConta: @${igName}\nMotor de publicação operacional.`
      );
    }
    return NextResponse.json({ ok: true, valid: true, igName });
  }

  // Token inválido → alerta crítico no Telegram
  await sendTelegramMessage(
    `🚨 *ALERTA CRÍTICO — Token Instagram inválido*\n\n` +
      `O token de publicação automática está com problema:\n` +
      `\`${reason}\`\n\n` +
      `*Impacto:* posts agendados NÃO serão publicados enquanto isso não for corrigido.\n\n` +
      `*Ação:* acesse Meta Business Suite → Usuários do Sistema → gerar novo token para o app TRINCA RV21 Publisher.`
  );

  return NextResponse.json({ ok: false, valid: false, reason }, { status: 200 });
}

export async function GET(request: NextRequest) {
  // GET público leve — só retorna se o token existe (sem chamar a API)
  const valid = Boolean(
    process.env.IG_BUSINESS_ACCOUNT_ID && process.env.IG_PAGE_ACCESS_TOKEN
  );
  return NextResponse.json({ ok: true, credenciais_presentes: valid });
}
