import { NextResponse } from "next/server";

type JsonObject = Record<string, unknown>;

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readTokens(request: Request) {
  const url = new URL(request.url);
  const authorization = request.headers.get("authorization") || "";
  const bearerToken = authorization.replace(/^Bearer\s+/i, "").trim();

  return [
    url.searchParams.get("token"),
    request.headers.get("x-automation-secret"),
    request.headers.get("x-cron-secret"),
    request.headers.get("x-token"),
    bearerToken,
  ]
    .map(cleanText)
    .filter(Boolean);
}

function authorizedSecrets() {
  return [
    process.env.AUTOMATION_API_SECRET,
    process.env.CRON_SECRET,
    process.env.KIWIFY_WEBHOOK_SECRET,
  ]
    .map(cleanText)
    .filter(Boolean);
}

function authorize(request: Request) {
  const secrets = authorizedSecrets();

  if (!secrets.length) {
    return NextResponse.json(
      { error: "AUTOMATION_API_SECRET ou CRON_SECRET ainda nao configurado." },
      { status: 503 }
    );
  }

  const received = readTokens(request);

  if (!received.some((token) => secrets.includes(token))) {
    return NextResponse.json({ error: "Token invalido." }, { status: 401 });
  }

  return null;
}

function internalToken() {
  return cleanText(
    process.env.AUTOMATION_API_SECRET ||
      process.env.CRON_SECRET ||
      process.env.KIWIFY_WEBHOOK_SECRET
  );
}

function pathWithToken(pathname: string, token: string) {
  const separator = pathname.includes("?") ? "&" : "?";

  return `${pathname}${separator}token=${encodeURIComponent(token)}`;
}

async function postJson(origin: string, pathname: string) {
  const response = await fetch(`${origin}${pathname}`, { method: "POST" });
  const text = await response.text();
  let payload: JsonObject = {};

  try {
    payload = text ? (JSON.parse(text) as JsonObject) : {};
  } catch {
    payload = { raw: text };
  }

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  const authError = authorize(request);

  if (authError) {
    return authError;
  }

  const token = internalToken();
  const url = new URL(request.url);
  const origin = url.origin;
  const dryRun = url.searchParams.get("dry_run") === "true";
  const rawDispatchCycles = Number(url.searchParams.get("dispatch_cycles") || 1);
  const dispatchCycles = Number.isFinite(rawDispatchCycles)
    ? Math.min(Math.max(rawDispatchCycles, 1), 3)
    : 1;
  const recoverLimit = Number(url.searchParams.get("recover_limit") || 50);
  const dispatchLimit = Number(url.searchParams.get("dispatch_limit") || 10);
  const minAgeMinutes = Number(url.searchParams.get("min_age_minutes") || 5);
  const syncInbound = url.searchParams.get("sync_inbound") !== "false";
  const syncPath = pathWithToken(
    `/api/twilio/sync-inbound?lookback_minutes=240${dryRun ? "&dry_run=true" : ""}`,
    token
  );
  const recoverPath = pathWithToken(
    `/api/automation/recover-leads?limit=${Math.min(Math.max(recoverLimit, 1), 100)}&min_age_minutes=${Math.max(minAgeMinutes, 1)}${dryRun ? "&dry_run=true" : ""}`,
    token
  );
  const inboundSync = syncInbound ? await postJson(origin, syncPath) : null;
  const recover = await postJson(origin, recoverPath);
  const dispatchRuns = [];

  for (let cycle = 1; cycle <= dispatchCycles; cycle += 1) {
    const dispatchPath = pathWithToken(
      `/api/automation/dispatch?limit=${Math.min(Math.max(dispatchLimit, 1), 20)}${dryRun ? "&dry_run=true" : ""}`,
      token
    );

    dispatchRuns.push({
      cycle,
      ...(await postJson(origin, dispatchPath)),
    });
  }

  const dispatchFailed = dispatchRuns.some((run) => !run.ok);
  const ok = (!inboundSync || inboundSync.ok) && recover.ok && !dispatchFailed;

  return NextResponse.json(
    {
      ok,
      dry_run: dryRun,
      checked_at: new Date().toISOString(),
      inbound_sync: inboundSync,
      recover,
      dispatch_runs: dispatchRuns,
      summary: {
        inbound_processed: inboundSync
          ? Array.isArray(inboundSync.payload.processed)
            ? inboundSync.payload.processed.length
            : 0
          : 0,
        recovery_queued: Number(recover.payload.queued || 0),
        dispatch_sent: dispatchRuns.reduce((sum, run) => {
          const sent = Array.isArray(run.payload.sent) ? run.payload.sent.length : 0;

          return sum + sent;
        }, 0),
        dispatch_failed: dispatchRuns.reduce((sum, run) => {
          const failed = Array.isArray(run.payload.failed) ? run.payload.failed.length : 0;

          return sum + failed;
        }, 0),
        dispatch_skipped: dispatchRuns.reduce((sum, run) => {
          const skipped = Array.isArray(run.payload.skipped) ? run.payload.skipped.length : 0;

          return sum + skipped;
        }, 0),
      },
    },
    { status: ok ? 200 : 500 }
  );
}
