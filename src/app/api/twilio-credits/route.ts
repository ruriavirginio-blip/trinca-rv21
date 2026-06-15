import { NextResponse } from "next/server";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const accountSid = cleanText(process.env.TWILIO_ACCOUNT_SID);
  const authToken = cleanText(process.env.TWILIO_AUTH_TOKEN);

  if (!accountSid || !authToken) {
    return NextResponse.json(
      { error: "TWILIO_ACCOUNT_SID ou TWILIO_AUTH_TOKEN nao configurado." },
      { status: 503 },
    );
  }

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Balance.json`, {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: "Falha ao consultar saldo Twilio.", details: data },
      { status: response.status },
    );
  }

  return NextResponse.json({
    balance: String(data.balance ?? ""),
    currency: String(data.currency ?? ""),
  });
}
