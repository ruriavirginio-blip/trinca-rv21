import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type JsonObject = Record<string, unknown>;
type SupabaseTable = {
  Row: JsonObject;
  Insert: JsonObject;
  Update: JsonObject;
  Relationships: [];
};

type Database = {
  public: {
    Tables: {
      automation_messages: SupabaseTable;
      kiwify_events: SupabaseTable;
      leads: SupabaseTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

type AppSupabaseClient = SupabaseClient<Database>;

type LeadRow = {
  id?: unknown;
  nome?: unknown;
  email?: unknown;
  whatsapp?: unknown;
  objetivo?: unknown;
  status?: unknown;
  etapa_funil?: unknown;
  capturado_em?: unknown;
  created_at?: unknown;
};

const LEAD_RECOVERY_STEPS = [
  "lead-formulario-abandonado-5min",
  "lead-formulario-abandonado-2h",
  "lead-formulario-abandonado-24h",
];

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function readAutomationToken(request: Request) {
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
    process.env.AUTOMATION_API_SECRET || process.env.KIWIFY_WEBHOOK_SECRET
  );

  if (!secret) {
    return NextResponse.json(
      { error: "AUTOMATION_API_SECRET ainda nao configurado." },
      { status: 503 }
    );
  }

  if (!readAutomationToken(request).includes(secret)) {
    return NextResponse.json({ error: "Token invalido." }, { status: 401 });
  }

  return null;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

function firstName(nome: unknown) {
  return cleanText(nome).split(" ").filter(Boolean)[0] || "Oi";
}

function recoveryMessage(lead: LeadRow, step: string) {
  const nome = firstName(lead.nome);
  const checkoutUrl =
    process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL || "https://pay.kiwify.com.br/mEhmYNt";

  if (step === "lead-formulario-abandonado-2h") {
    return (
      `${nome}, passando para te lembrar que sua inscricao no TRINCA RV21 ficou pendente.\n\n` +
      "As alunas recebem direcionamento, grupo oficial, dieta dos 21 dias, Ebook RV, Ebook Nutricional e check-ins para manter constancia.\n\n" +
      "O investimento de entrada e de R$ 37,89 a vista ou em ate 8x no cartao, com parcelamento sujeito a acrescimos da Kiwify.\n\n" +
      `Concluir agora: ${checkoutUrl}`
    );
  }

  if (step === "lead-formulario-abandonado-24h") {
    return (
      `${nome}, talvez essa seja exatamente a hora de parar de adiar voce.\n\n` +
      "O TRINCA RV21 nao e sobre perfeicao. E sobre entrar em movimento com estrutura, suporte e compromisso por 21 dias.\n\n" +
      `Se voce ainda quer participar, finalize sua entrada aqui: ${checkoutUrl}`
    );
  }

  return (
    `${nome}, vi que voce iniciou sua inscricao no TRINCA RV21, mas ainda nao concluiu o checkout.\n\n` +
    "Esse desafio foi criado para mulheres que querem 21 dias de direcao, treino, alimentacao e suporte para sair do improviso.\n\n" +
    `Sua entrada no desafio continua disponivel por aqui: ${checkoutUrl}`
  );
}

function delayForStep(step: string) {
  if (step.endsWith("-2h")) {
    return 120;
  }

  if (step.endsWith("-24h")) {
    return 1440;
  }

  return 5;
}

function withTemplateMetadata(message: JsonObject) {
  const metadata = asObject(message.metadata);
  const checkoutUrl =
    process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL || "https://pay.kiwify.com.br/mEhmYNt";
  const twilioContentSid = cleanText(process.env.TWILIO_CONTENT_SID_RETOMADA_INSCRICAO);

  return {
    ...message,
    metadata: {
      ...metadata,
      whatsapp_api: {
        template_name: "trinca_retomada_inscricao",
        template_category: "MARKETING",
        language: "pt_BR",
        body_variables: {
          nome: metadata.nome_primeiro || "Oi",
          produto: "TRINCA RV21",
        },
        body_variable_order: ["nome"],
        buttons: {
          checkout_url: checkoutUrl,
        },
        ...(twilioContentSid ? { twilio_content_sid: twilioContentSid } : {}),
      },
    },
  };
}

function buildRecoveryRows(lead: LeadRow) {
  const now = Date.now();
  const email = cleanText(lead.email).toLowerCase();
  const abandonmentVideoUrl = cleanText(process.env.TRINCA_ABANDONMENT_VIDEO_URL);

  return LEAD_RECOVERY_STEPS.map((step) => {
    const delayMinutos = delayForStep(step);
    const metadata = {
      source: "lead_capture",
      sequence: "lead-sem-evento-kiwify",
      sequence_order: LEAD_RECOVERY_STEPS.indexOf(step) + 1,
      nome_primeiro: firstName(lead.nome),
      objective: cleanText(lead.objetivo) || null,
      required_previous_steps: [],
      ...(step === "lead-formulario-abandonado-5min" && abandonmentVideoUrl
        ? { asset_url: abandonmentVideoUrl }
        : {}),
    };

    return withTemplateMetadata({
      email,
      whatsapp: cleanText(lead.whatsapp),
      nome: cleanText(lead.nome) || "Lead TRINCA RV21",
      order_id: null,
      payment_method: null,
      trigger_event: "lead_sem_evento_kiwify",
      etapa: step,
      canal: "whatsapp",
      mensagem: recoveryMessage(lead, step),
      delay_minutos: delayMinutos,
      enviar_em: new Date(now + delayMinutos * 60 * 1000).toISOString(),
      status: "pendente",
      metadata,
      dedupe_key: [email, "lead_sem_evento_kiwify", step].join(":"),
    });
  });
}

async function existingKiwifyEventEmails(supabase: AppSupabaseClient, emails: string[]) {
  if (!emails.length) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from("kiwify_events")
    .select("email")
    .in("email", emails);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data || []).map((event) => cleanText((event as JsonObject).email)));
}

async function alreadyQueuedEmails(supabase: AppSupabaseClient, emails: string[]) {
  if (!emails.length) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from("automation_messages")
    .select("email")
    .eq("trigger_event", "lead_sem_evento_kiwify")
    .in("email", emails);

  if (error) {
    throw new Error(error.message);
  }

  return new Set((data || []).map((message) => cleanText((message as JsonObject).email)));
}

export async function POST(request: Request) {
  const authError = authorize(request);

  if (authError) {
    return authError;
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase ainda nao configurado no ambiente." },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const rawLimit = Number(url.searchParams.get("limit") || 25);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 25;
  const rawMinAge = Number(url.searchParams.get("min_age_minutes") || 5);
  const minAgeMinutes = Number.isFinite(rawMinAge) ? Math.max(rawMinAge, 1) : 5;
  const dryRun = url.searchParams.get("dry_run") === "true";
  const cutoff = new Date(Date.now() - minAgeMinutes * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("leads")
    .select("id,nome,email,whatsapp,objetivo,status,etapa_funil,capturado_em,created_at")
    .eq("origem", "landing-trinca-rv21")
    .in("status", ["novo-lead", "lead-capturado", "checkout-iniciado"])
    .lte("capturado_em", cutoff)
    .order("capturado_em", { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const leads = ((data || []) as LeadRow[]).filter((lead) => cleanText(lead.email));
  const emails = leads.map((lead) => cleanText(lead.email).toLowerCase());
  const kiwifyEmails = await existingKiwifyEventEmails(supabase, emails);
  const queuedEmails = await alreadyQueuedEmails(supabase, emails);
  const eligibleLeads = leads.filter((lead) => {
    const email = cleanText(lead.email).toLowerCase();

    return !kiwifyEmails.has(email) && !queuedEmails.has(email);
  });
  const rows = eligibleLeads.flatMap(buildRecoveryRows);

  if (!rows.length || dryRun) {
    return NextResponse.json({
      ok: true,
      dry_run: dryRun,
      scanned: leads.length,
      eligible: eligibleLeads.length,
      queued: 0,
      skipped_with_kiwify_event: kiwifyEmails.size,
      skipped_already_queued: queuedEmails.size,
      messages: rows,
    });
  }

  const { error: insertError } = await supabase
    .from("automation_messages")
    .upsert(rows, { onConflict: "dedupe_key", ignoreDuplicates: true });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    dry_run: false,
    scanned: leads.length,
    eligible: eligibleLeads.length,
    queued: rows.length,
    skipped_with_kiwify_event: kiwifyEmails.size,
    skipped_already_queued: queuedEmails.size,
  });
}
