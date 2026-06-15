import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cleanText, normalizeBrazilianWhatsapp } from "@/lib/whatsapp/phone";

type JsonObject = Record<string, unknown>;
type VipLead = {
  id: string;
  nome: string | null;
  email: string | null;
  whatsapp: string | null;
  utm?: string | null;
};

const vipMessage = `Faltam 24h para abrir o TRINCA RV21.

Voce esta na lista VIP e vai receber acesso antecipado ao protocolo.

Amanha, 23/06, entra por aqui:
https://protocolorv.com.br/bio`;

function readBearer(request: Request) {
  return cleanText(request.headers.get("authorization")).replace(/^Bearer\s+/i, "");
}

function twilioFrom(value: unknown) {
  const digits = cleanText(value).replace(/\D/g, "");

  return digits ? `whatsapp:+${digits}` : "";
}

async function sendVipWhatsapp(whatsapp: unknown, body: string) {
  const accountSid = cleanText(process.env.TWILIO_ACCOUNT_SID);
  const authToken = cleanText(process.env.TWILIO_AUTH_TOKEN);
  const messagingServiceSid = cleanText(process.env.TWILIO_MESSAGING_SERVICE_SID);
  const from = twilioFrom(process.env.TWILIO_WHATSAPP_FROM);
  const toDigits = normalizeBrazilianWhatsapp(whatsapp);

  if (!accountSid || !authToken) {
    throw new Error("TWILIO_ACCOUNT_SID e TWILIO_AUTH_TOKEN ainda nao configurados.");
  }

  if (!messagingServiceSid && !from) {
    throw new Error("Configure TWILIO_MESSAGING_SERVICE_SID ou TWILIO_WHATSAPP_FROM.");
  }

  if (!toDigits) {
    throw new Error("WhatsApp da lead ausente ou invalido.");
  }

  const params = new URLSearchParams();

  params.set("To", `whatsapp:+${toDigits}`);
  params.set("Body", body);

  if (messagingServiceSid) {
    params.set("MessagingServiceSid", messagingServiceSid);
  } else {
    params.set("From", from);
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );
  const text = await response.text();
  let data: unknown = text;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const object = data && typeof data === "object" && !Array.isArray(data) ? (data as JsonObject) : {};
    throw new Error(cleanText(object.message) || `Twilio retornou HTTP ${response.status}.`);
  }

  return data;
}

export async function POST(request: Request) {
  const expectedToken = cleanText(process.env.AUTOMATION_API_SECRET);
  const receivedToken = readBearer(request);

  if (!expectedToken || receivedToken !== expectedToken) {
    return NextResponse.json({ error: "Nao autorizado." }, { status: 401 });
  }

  const supabaseUrl = cleanText(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseServiceRoleKey = cleanText(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Supabase ainda nao configurado no ambiente." },
      { status: 503 },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("leads")
    .select("id,nome,email,whatsapp,utm")
    .eq("status", "lista-vip")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sent: Array<{ id: string; provider_response: unknown }> = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const lead of (data || []) as VipLead[]) {
    try {
      const providerResponse = await sendVipWhatsapp(lead.whatsapp, vipMessage);
      const { error: updateError } = await supabase
        .from("leads")
        .update({
          status: "mensagem-vip-enviada",
          etapa_funil: "pre-lancamento-vip-enviado",
          utm: JSON.stringify({
            previous_utm: lead.utm || null,
            vip_message_sent_at: new Date().toISOString(),
            vip_message: "24h antes",
          }),
        })
        .eq("id", lead.id);

      if (updateError) throw new Error(updateError.message);

      sent.push({ id: lead.id, provider_response: providerResponse });
    } catch (error) {
      failed.push({
        id: lead.id,
        error: error instanceof Error ? error.message : "Erro desconhecido.",
      });
    }
  }

  return NextResponse.json({
    ok: failed.length === 0,
    scanned: (data || []).length,
    sent: sent.length,
    failed,
  });
}
