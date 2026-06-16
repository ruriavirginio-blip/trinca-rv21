import { NextResponse } from "next/server";
import { cockpitUrl, sendInternalRuriaNotification } from "@/lib/internal-notifications";
import { cleanText } from "@/lib/whatsapp/phone";

type Payload = {
  trigger?: unknown;
  title?: unknown;
  description?: unknown;
  dedupeKey?: unknown;
};

function readBearer(request: Request) {
  return cleanText(request.headers.get("authorization")).replace(/^Bearer\s+/i, "");
}

function authorize(request: Request) {
  const expected = cleanText(process.env.AUTOMATION_API_SECRET);

  if (!expected || readBearer(request) !== expected) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  return null;
}

function videoReadyMessage() {
  return `🎬 *TRINCA RV21 — Ação necessária*

Seu vídeo está pronto e aguarda aprovação.

👉 Acesse o Cockpit, aba Conteúdo:
${cockpitUrl()}`;
}

function criticalAlertMessage(description: string) {
  return `⚠️ *TRINCA RV21 — Atenção necessária*

${description}

👉 Verifique agora:
${cockpitUrl()}`;
}

export async function POST(request: Request) {
  const unauthorized = authorize(request);

  if (unauthorized) return unauthorized;

  const payload = (await request.json()) as Payload;
  const trigger = cleanText(payload.trigger);
  const title = cleanText(payload.title) || "Video TRINCA RV21";
  const description = cleanText(payload.description) || "Alerta crítico sem descrição.";
  const explicitDedupeKey = cleanText(payload.dedupeKey);

  if (trigger === "video_ready") {
    const result = await sendInternalRuriaNotification({
      type: "video_ready",
      dedupeKey: explicitDedupeKey || `video_ready:${title.toLowerCase()}`,
      message: videoReadyMessage(),
    });

    return NextResponse.json(result);
  }

  if (trigger === "critical_alert") {
    const result = await sendInternalRuriaNotification({
      type: "critical_alert",
      dedupeKey: explicitDedupeKey || `critical_alert:${description.toLowerCase()}`,
      message: criticalAlertMessage(description),
    });

    return NextResponse.json(result);
  }

  return NextResponse.json(
    { error: "trigger deve ser video_ready ou critical_alert." },
    { status: 400 },
  );
}
