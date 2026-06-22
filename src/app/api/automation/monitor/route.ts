import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { buildAutomationReadiness } from "@/lib/automation/readiness";
import { sendInternalRuriaNotification } from "@/lib/internal-notifications";
import { REMEDIATION, type ActionKey } from "@/lib/automation/remediation";

// MOTOR DE ERROS — Central de Comando TRINCA RV21
// GET  -> retorna o status de saúde (somente leitura, para o painel do Cockpit)
// POST -> roda a checagem E dispara critical_alert no WhatsApp do Ruriá se houver falha
//         (com anti-spam por hora). Acionado por cron/Make.com 24/7.

type JsonObject = Record<string, unknown>;
type SupabaseTable = { Row: JsonObject; Insert: JsonObject; Update: JsonObject; Relationships: [] };
type Database = {
  public: {
    Tables: { automation_messages: SupabaseTable; leads: SupabaseTable };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
type AppSupabaseClient = SupabaseClient<Database>;

type Severity = "ok" | "warn" | "critical";

const DUE_PENDING_ALERT_THRESHOLD = 25; // fila vencida acima disso = travamento

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readAutomationToken(request: Request) {
  const url = new URL(request.url);
  const bearer = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  return [url.searchParams.get("token"), request.headers.get("x-automation-secret"), bearer]
    .map(cleanText)
    .filter(Boolean);
}

function authorize(request: Request) {
  // Aceita o secret geral da automação OU um token dedicado do monitor (MONITOR_TOKEN),
  // usado pelo gatilho 24/7 do Make.com sem precisar expor o AUTOMATION_API_SECRET.
  const validSecrets = [
    process.env.AUTOMATION_API_SECRET,
    process.env.KIWIFY_WEBHOOK_SECRET,
    process.env.MONITOR_TOKEN,
  ]
    .map(cleanText)
    .filter(Boolean);
  if (!validSecrets.length) {
    return NextResponse.json({ error: "AUTOMATION_API_SECRET ainda nao configurado." }, { status: 503 });
  }
  const provided = readAutomationToken(request);
  if (!provided.some((token) => validSecrets.includes(token))) {
    return NextResponse.json({ error: "Token invalido." }, { status: 401 });
  }
  return null;
}

function getSupabaseClient(): AppSupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, { auth: { persistSession: false } });
}

async function countAutomation(
  supabase: AppSupabaseClient,
  status: string,
  options: { dueOnly?: boolean } = {},
) {
  let query = supabase.from("automation_messages").select("id", { count: "exact", head: true }).eq("status", status);
  if (options.dueOnly) {
    query = query.lte("enviar_em", new Date().toISOString());
  }
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count || 0;
}

async function buildStatus() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      severity: "critical" as Severity,
      checked_at: new Date().toISOString(),
      problems: ["Supabase nao configurado no ambiente."],
      warnings: [] as string[],
      counts: {} as Record<string, number>,
      signature: "supabase-missing",
    };
  }

  const problems: string[] = [];
  const warnings: string[] = [];
  let counts: Record<string, number> = {};

  try {
    const [errors, duePending, processing, waitingClicks] = await Promise.all([
      countAutomation(supabase, "erro"),
      countAutomation(supabase, "pendente", { dueOnly: true }),
      countAutomation(supabase, "processando"),
      countAutomation(supabase, "aguardando-clique"),
    ]);
    counts = { automation_error_total: errors, automation_due_pending: duePending, automation_processing: processing, automation_waiting_clicks: waitingClicks };

    if (errors > 0) problems.push(`${errors} mensagem(ns) com ERRO na automacao.`);
    if (duePending >= DUE_PENDING_ALERT_THRESHOLD) {
      problems.push(`Fila possivelmente travada: ${duePending} mensagens vencidas nao enviadas.`);
    } else if (duePending > 0) {
      warnings.push(`${duePending} mensagens pendentes vencidas.`);
    }
    if (processing > 0) warnings.push(`${processing} mensagens em processamento.`);
    if (waitingClicks > 0) warnings.push(`${waitingClicks} gates aguardando clique.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido ao consultar o banco.";
    problems.push(`Falha ao checar a automacao: ${message}`);
  }

  try {
    const readiness = buildAutomationReadiness();
    if (!readiness.launch_ready) {
      for (const blocker of readiness.blockers) {
        const text =
          typeof blocker === "string"
            ? blocker
            : ((blocker as { label?: string })?.label ?? "");
        if (text) warnings.push(`Setup: ${text}`);
      }
    }
  } catch {
    // readiness é best-effort; não derruba o monitor
  }

  const severity: Severity = problems.length ? "critical" : warnings.length ? "warn" : "ok";
  const signature = problems.length ? problems.map((p) => p.slice(0, 24)).join("|") : "ok";

  return { severity, checked_at: new Date().toISOString(), problems, warnings, counts, signature };
}

type Diagnosis = { tipo: string; onde: string; causa: string; action: ActionKey };

// Traduz o estado do motor em diagnóstico exato + ação de conserto.
function diagnose(status: Awaited<ReturnType<typeof buildStatus>>): Diagnosis {
  const c = status.counts;
  if (
    status.signature === "supabase-missing" ||
    status.problems.some((p) => /Falha ao checar|Supabase/i.test(p))
  ) {
    return {
      tipo: "Banco/infra do motor",
      onde: "Conexão com o Supabase / servidor",
      causa: "O sistema não conseguiu falar com o banco — o motor pode ter parado.",
      action: "code",
    };
  }
  if ((c.automation_error_total || 0) > 0) {
    return {
      tipo: "Mensagens com erro no WhatsApp",
      onde: "Fila de automação (Twilio)",
      causa: `${c.automation_error_total} mensagem(ns) falharam no envio para as leads.`,
      action: "dispatch",
    };
  }
  if ((c.automation_due_pending || 0) >= DUE_PENDING_ALERT_THRESHOLD) {
    return {
      tipo: "Motor de mensagens travado",
      onde: "Fila de automação (mensagens vencidas)",
      causa: `${c.automation_due_pending} mensagens venceram e não foram enviadas — o despachante pode ter parado.`,
      action: "dispatch",
    };
  }
  return {
    tipo: "Falha na operação",
    onde: "Motor de automação",
    causa: status.problems[0] || "Problema detectado pelo monitor.",
    action: "code",
  };
}

// AUTO-CONSERTO: roda a remediação no servidor NA HORA (sem esperar o Ruriá tocar).
// Funciona com o Mac do Ruriá desligado.
async function autoHeal(
  origin: string,
  action: ActionKey,
): Promise<{ tried: boolean; ok: boolean; summary: string }> {
  const rem = REMEDIATION[action];
  if (rem.kind !== "server" || !rem.endpoint) return { tried: false, ok: false, summary: "" };
  const secret = cleanText(process.env.AUTOMATION_API_SECRET) || cleanText(process.env.MONITOR_TOKEN);
  if (!secret) return { tried: true, ok: false, summary: "sem secret no servidor" };
  try {
    const r = await fetch(`${origin}${rem.endpoint}`, {
      method: "POST",
      headers: { "x-automation-secret": secret, "content-type": "application/json" },
    });
    const d = (await r.json().catch(() => ({}))) as Record<string, unknown>;
    if (!r.ok) return { tried: true, ok: false, summary: `erro ${r.status}` };
    const c = d.enviadas ?? d.sent ?? d.dispatched ?? d.processed ?? d.recovered ?? d.recuperadas;
    return { tried: true, ok: true, summary: c !== undefined ? `${c} item(ns) processado(s)` : "concluído" };
  } catch (e) {
    return { tried: true, ok: false, summary: String(e) };
  }
}

function alertMessage(status: Awaited<ReturnType<typeof buildStatus>>, dx: Diagnosis) {
  const lines = status.problems.map((p) => `• ${p}`).join("\n");
  return (
    `🚨 *TRINCA RV21 — PROBLEMA DETECTADO*\n\n` +
    `*O que houve:* ${dx.tipo}\n` +
    `*Onde:* ${dx.onde}\n` +
    `*Causa provável:* ${dx.causa}\n` +
    `*Quem resolve:* ${REMEDIATION[dx.action].agente}\n\n` +
    `Detalhes:\n${lines}\n\n` +
    `👇 Toque no botão pra eu resolver agora (funciona mesmo com seu Mac desligado).`
  );
}

export async function GET(request: Request) {
  const authError = authorize(request);
  if (authError) return authError;
  const status = await buildStatus();
  return NextResponse.json({ ok: true, ...status, alerted: false });
}

export async function POST(request: Request) {
  const authError = authorize(request);
  if (authError) return authError;

  const status = await buildStatus();
  let alerted = false;
  let alertResult: unknown = null;

  let diagnosis: Diagnosis | null = null;
  let heal: { tried: boolean; ok: boolean; summary: string } | null = null;
  if (status.severity === "critical") {
    diagnosis = diagnose(status);
    const action = diagnosis.action;

    // 1) AUTO-CONSERTO imediato (não espera o Ruriá tocar; roda com Mac desligado)
    const origin = new URL(request.url).origin;
    heal = await autoHeal(origin, action);

    // 2) mensagem: se já resolveu sozinho, avisa que resolveu; senão, manda botão de backup
    let extra = "";
    let buttons: { text: string; callback_data: string }[][] | undefined;
    if (heal.tried && heal.ok) {
      extra = `\n\n✅ *Já resolvi automaticamente:* ${heal.summary}. Se voltar a falhar, te aviso de novo.`;
    } else if (heal.tried && !heal.ok) {
      extra = `\n\n⚠️ Tentei resolver sozinho mas não consegui (${heal.summary}). Toque no botão abaixo.`;
      buttons = [[{ text: REMEDIATION[action].label, callback_data: `fix:${action}` }]];
    } else {
      // ação de código: não dá pra auto-consertar com Mac desligado
      buttons = [[{ text: REMEDIATION[action].label, callback_data: `fix:${action}` }]];
    }

    // anti-spam: no máximo 1 alerta por hora por assinatura de problema
    const hourBucket = new Date().toISOString().slice(0, 13); // YYYY-MM-DDTHH
    alertResult = await sendInternalRuriaNotification({
      type: "critical_alert",
      dedupeKey: `monitor:${status.signature}:${heal.ok ? "healed" : "open"}:${hourBucket}`,
      message: alertMessage(status, diagnosis) + extra,
      telegramButtons: buttons,
    });
    alerted = true;
  }

  return NextResponse.json({ ok: true, ...status, diagnosis, heal, alerted, alert_result: alertResult });
}
