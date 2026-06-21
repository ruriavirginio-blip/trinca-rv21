import { NextResponse } from "next/server";

/* Gerencia o perfil do WhatsApp Business (Twilio) — foto, sobre, descricao.
   GET                -> lista os senders (pra achar o SID)
   GET ?do=update&sid=XXXXX  -> atualiza perfil (foto premium + sobre + descricao)
   O nome de exibicao passa por revisao da Meta (nao é instantaneo). */

export const dynamic = "force-dynamic";

const PHOTO = "https://protocolorv.com.br/images/whatsapp-profile-trinca-rv21-premium.png";
const ABOUT = "TRINCA RV21 · Desafio feminino de 21 dias";
const DESCRIPTION = "Protocolo RV · 14 anos transformando mulheres. Treino + dieta + acompanhamento.";

function auth() {
  const sid = (process.env.TWILIO_ACCOUNT_SID || "").trim();
  const token = (process.env.TWILIO_AUTH_TOKEN || "").trim();
  return { sid, token, header: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64") };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const a = auth();
  if (!a.sid || !a.token) return NextResponse.json({ ok: false, error: "Twilio creds ausentes." }, { status: 503 });

  const doUpdate = url.searchParams.get("do") === "update";
  const sid = (url.searchParams.get("sid") || "").trim();

  try {
    if (!doUpdate) {
      // Lista os WhatsApp senders (Messaging v2)
      const r = await fetch("https://messaging.twilio.com/v2/Channels/Senders?Channel=whatsapp&PageSize=50", {
        headers: { Authorization: a.header },
      });
      const data = await r.json().catch(() => ({}));
      return NextResponse.json({ ok: r.ok, status: r.status, hint: "Pegue o sid (XExxxx) e chame ?do=update&sid=...", data });
    }

    if (!sid) return NextResponse.json({ ok: false, error: "Informe ?sid=" }, { status: 400 });

    const body = {
      profile: {
        name: "TRINCA RV21",
        about: ABOUT,
        description: DESCRIPTION,
        logo_url: PHOTO,
        vertical: "HEALTH",
      },
    };
    const r = await fetch(`https://messaging.twilio.com/v2/Channels/Senders/${encodeURIComponent(sid)}`, {
      method: "POST",
      headers: { Authorization: a.header, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json({ ok: r.ok, status: r.status, enviado: body, resposta: data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
