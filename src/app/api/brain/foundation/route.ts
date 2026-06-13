import { NextResponse } from "next/server";
import { buildBrainFoundationReadiness } from "@/lib/brain/foundation";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readToken(request: Request) {
  const url = new URL(request.url);
  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.replace(/^Bearer\s+/i, "").trim();

  return [
    url.searchParams.get("token"),
    request.headers.get("x-automation-secret"),
    request.headers.get("x-token"),
    bearerToken,
  ]
    .map(cleanText)
    .filter(Boolean);
}

function authorize(request: Request) {
  const secret = cleanText(
    process.env.AUTOMATION_API_SECRET || process.env.KIWIFY_WEBHOOK_SECRET,
  );

  if (!secret) {
    return NextResponse.json(
      { error: "AUTOMATION_API_SECRET ainda nao configurado." },
      { status: 503 },
    );
  }

  if (!readToken(request).includes(secret)) {
    return NextResponse.json({ error: "Token invalido." }, { status: 401 });
  }

  return null;
}

export async function GET(request: Request) {
  const authError = authorize(request);

  if (authError) {
    return authError;
  }

  return NextResponse.json(await buildBrainFoundationReadiness());
}
