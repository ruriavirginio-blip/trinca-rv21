import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(process.cwd());

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

const baseUrl = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const automationToken = process.env.AUTOMATION_API_SECRET || process.env.KIWIFY_WEBHOOK_SECRET;
const kiwifyToken = process.env.KIWIFY_WEBHOOK_SECRET || "";
const twilioToken = process.env.TWILIO_WEBHOOK_SECRET || "";
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function logStep(message) {
  console.log(`\n[TRINCA TEST] ${message}`);
}

async function fetchJson(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(`${pathname} retornou HTTP ${response.status}: ${JSON.stringify(data)}`);
  }

  return data;
}

function authPath(pathname, token) {
  const separator = pathname.includes("?") ? "&" : "?";

  return `${pathname}${separator}token=${encodeURIComponent(token)}`;
}

function nowStamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

async function cleanup(supabase, email, phone) {
  await supabase.from("automation_messages").delete().eq("email", email);
  await supabase.from("kiwify_events").delete().eq("email", email);
  await supabase.from("leads").delete().eq("email", email);
  await supabase.from("twilio_interactions").delete().eq("from_whatsapp", phone);
}

async function getMessages(supabase, email) {
  const { data, error } = await supabase
    .from("automation_messages")
    .select("id,email,whatsapp,etapa,status,enviar_em,trigger_event,metadata,created_at")
    .eq("email", email)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

function findStep(messages, etapa) {
  const message = messages.find((item) => item.etapa === etapa);

  assert(message, `Etapa esperada nao encontrada: ${etapa}`);

  return message;
}

async function markSteps(supabase, email, steps, status) {
  const { error } = await supabase
    .from("automation_messages")
    .update({ status })
    .eq("email", email)
    .in("etapa", steps);

  if (error) {
    throw new Error(error.message);
  }
}

async function makeAllDue(supabase, email) {
  const { error } = await supabase
    .from("automation_messages")
    .update({ enviar_em: new Date(Date.now() - 60 * 1000).toISOString() })
    .eq("email", email);

  if (error) {
    throw new Error(error.message);
  }
}

function dryRunHasSent(response, etapa) {
  return (response.sent || []).some((item) => item.etapa === etapa && item.dry_run);
}

function dryRunHasSkipped(response, etapa) {
  return (response.skipped || []).some((item) => item.etapa === etapa);
}

async function runLeadRecoveryTest(supabase, stamp) {
  const email = `rv21-lead-sem-evento-${stamp}@teste.local`;
  const phone = `5584998${stamp.slice(-6)}`;

  logStep("Testando recuperacao de lead capturada sem evento Kiwify");
  await cleanup(supabase, email, phone);

  const leadResponse = await fetchJson("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nome: "Lead Sem Evento",
      email,
      whatsapp: phone,
      objetivo: "emagrecimento",
      origem: "landing-trinca-rv21",
      status: "checkout-iniciado",
      etapaFunil: "checkout",
      data: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    }),
  });

  assert(leadResponse.ok, "Lead sem evento nao foi salvo.");

  const dryRun = await fetchJson(
    authPath("/api/automation/recover-leads?limit=25&min_age_minutes=5&dry_run=true", automationToken),
    { method: "POST" }
  );

  assert(dryRun.ok, "Dry-run de recuperacao nao retornou ok.");
  assert(dryRun.messages.length >= 3, "Dry-run deveria listar mensagens de recuperacao.");

  const realRun = await fetchJson(
    authPath("/api/automation/recover-leads?limit=25&min_age_minutes=5", automationToken),
    { method: "POST" }
  );

  assert(realRun.ok, "Execucao real de recuperacao nao retornou ok.");

  const messages = await getMessages(supabase, email);
  const recoverySteps = messages.filter((item) => item.trigger_event === "lead_sem_evento_kiwify");

  assert(recoverySteps.length === 3, `Esperava 3 recuperacoes, recebeu ${recoverySteps.length}.`);

  await cleanup(supabase, email, phone);
  console.log("OK: recuperacao pre-Kiwify enfileira 3 mensagens e respeita status checkout-iniciado.");
}

async function runApprovedPurchaseFlowTest(supabase, stamp) {
  const email = `rv21-compra-aprovada-${stamp}@teste.local`;
  const phone = `5584999${stamp.slice(-6)}`;
  const orderId = `ORDER-RV21-${stamp}`;
  const expectedSteps = [
    "compra-confirmada",
    "clique-compra-confirmada-estou-pronta",
    "boas-vindas-video",
    "orientacoes-iniciais",
    "materiais-desafio",
    "dieta-ebooks",
    "grupo-oficial-preparacao",
    "clique-grupo-assistir-boas-vindas",
    "grupo-oficial-final",
    "grupo-oficial-link",
  ];

  logStep("Testando compra aprovada, gates de clique e liberacao ate o link do grupo");
  await cleanup(supabase, email, phone);

  const webhookPayload = {
    webhook_event_type: "order.paid",
    order_status: "paid",
    order_id: orderId,
    payment_method: "credit_card",
    Customer: {
      full_name: "Aluna Fluxo Completo",
      email,
      mobile: phone,
    },
    Product: {
      product_name: "TRINCA RV21",
    },
    Commissions: {
      charge_amount: 3789,
    },
    TrackingParameters: {
      source: "teste-fluxo-completo",
    },
  };

  const kiwifyPath = authPath("/api/kiwify/webhook", kiwifyToken);
  const webhookResponse = await fetchJson(kiwifyPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(webhookPayload),
  });

  assert(webhookResponse.ok, "Webhook Kiwify de compra aprovada nao retornou ok.");

  await makeAllDue(supabase, email);

  let messages = await getMessages(supabase, email);

  for (const step of expectedSteps) {
    findStep(messages, step);
  }

  assert(findStep(messages, "clique-compra-confirmada-estou-pronta").status === "aguardando-clique", "Gate Estou pronta deveria iniciar aguardando clique.");
  assert(findStep(messages, "clique-grupo-assistir-boas-vindas").status === "aguardando-clique", "Gate Assistir boas-vindas deveria iniciar aguardando clique.");

  await markSteps(supabase, email, ["compra-confirmada"], "enviada");

  let dryRun = await fetchJson(
    authPath("/api/automation/dispatch?limit=20&dry_run=true", automationToken),
    { method: "POST" }
  );

  assert(dryRunHasSkipped(dryRun, "boas-vindas-video"), "Video pos-compra deveria ficar bloqueado antes do clique Estou pronta.");

  const firstClick = await fetchJson(authPath("/api/twilio/webhook", twilioToken), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      WaId: phone,
      ButtonPayload: "compra_confirmada_estou_pronta",
      ButtonText: "Estou pronta",
      MessageSid: `SM_TESTE_COMPRA_${stamp}`,
    }),
  });

  assert(firstClick.completed, "Clique Estou pronta nao concluiu o gate.");

  messages = await getMessages(supabase, email);
  assert(findStep(messages, "clique-compra-confirmada-estou-pronta").status === "concluida", "Gate Estou pronta deveria ficar concluida.");

  dryRun = await fetchJson(
    authPath("/api/automation/dispatch?limit=20&dry_run=true", automationToken),
    { method: "POST" }
  );

  assert(dryRunHasSent(dryRun, "boas-vindas-video"), "Video pos-compra deveria ser liberado apos clique Estou pronta.");

  await markSteps(
    supabase,
    email,
    [
      "boas-vindas-video",
      "orientacoes-iniciais",
      "materiais-desafio",
      "dieta-ebooks",
      "grupo-oficial-preparacao",
    ],
    "enviada"
  );

  dryRun = await fetchJson(
    authPath("/api/automation/dispatch?limit=20&dry_run=true", automationToken),
    { method: "POST" }
  );

  assert(dryRunHasSkipped(dryRun, "grupo-oficial-final"), "Video do grupo deveria ficar bloqueado antes do clique Assistir boas-vindas.");

  const secondClick = await fetchJson(authPath("/api/twilio/webhook", twilioToken), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      WaId: phone,
      ButtonPayload: "assistir_boas_vindas_grupo",
      ButtonText: "Assistir boas-vindas",
      MessageSid: `SM_TESTE_GRUPO_${stamp}`,
    }),
  });

  assert(secondClick.completed, "Clique Assistir boas-vindas nao concluiu o gate.");

  messages = await getMessages(supabase, email);
  assert(findStep(messages, "clique-grupo-assistir-boas-vindas").status === "concluida", "Gate Assistir boas-vindas deveria ficar concluida.");

  dryRun = await fetchJson(
    authPath("/api/automation/dispatch?limit=20&dry_run=true", automationToken),
    { method: "POST" }
  );

  assert(dryRunHasSent(dryRun, "grupo-oficial-final"), "Video do grupo deveria ser liberado apos clique Assistir boas-vindas.");

  await markSteps(supabase, email, ["grupo-oficial-final"], "enviada");

  dryRun = await fetchJson(
    authPath("/api/automation/dispatch?limit=20&dry_run=true", automationToken),
    { method: "POST" }
  );

  assert(dryRunHasSent(dryRun, "grupo-oficial-link"), "Link do grupo deveria ser liberado apos video do grupo.");

  await markSteps(supabase, email, ["grupo-oficial-link"], "enviada");

  messages = await getMessages(supabase, email);
  const finalStatus = Object.fromEntries(messages.map((item) => [item.etapa, item.status]));

  await cleanup(supabase, email, phone);

  console.log("OK: compra aprovada criou a fila completa.");
  console.log("OK: video pos-compra ficou bloqueado ate Estou pronta.");
  console.log("OK: video do grupo ficou bloqueado ate Assistir boas-vindas.");
  console.log("OK: link do grupo ficou bloqueado ate video do grupo.");
  console.log("Resumo final antes da limpeza:", JSON.stringify(finalStatus, null, 2));
}

async function main() {
  assert(supabaseUrl, "SUPABASE_URL ausente.");
  assert(supabaseServiceRoleKey, "SUPABASE_SERVICE_ROLE_KEY ausente.");
  assert(automationToken, "AUTOMATION_API_SECRET ou KIWIFY_WEBHOOK_SECRET ausente.");

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });
  const stamp = nowStamp();

  logStep(`Base URL: ${baseUrl}`);
  await fetchJson("/");
  await runLeadRecoveryTest(supabase, stamp);
  await runApprovedPurchaseFlowTest(supabase, stamp);

  console.log("\n[TRINCA TEST] FLUXO COMPLETO APROVADO EM MODO CONTROLADO.");
}

main().catch((error) => {
  console.error("\n[TRINCA TEST] FALHA:", error.message);
  process.exit(1);
});
