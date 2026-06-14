import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!cleanText(body.videoUrl) || !cleanText(body.gancho) || !cleanText(body.gatilho)) {
    return NextResponse.json(
      { error: "videoUrl, gancho e gatilho sao obrigatorios" },
      { status: 400 },
    );
  }

  const workerUrl = cleanText(process.env.REMOTION_WORKER_URL);

  if (!workerUrl) {
    return NextResponse.json(
      { error: "REMOTION_WORKER_URL nao configurado" },
      { status: 500 },
    );
  }

  const response = await fetch(`${workerUrl}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}
