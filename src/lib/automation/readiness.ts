type ReadinessStatus = "ok" | "warning" | "missing" | "invalid";

type EnvRequirement = {
  key: string;
  label: string;
  required?: boolean;
  mustBeHttps?: boolean;
  allowLocalhost?: boolean;
  fallbackValue?: string;
};

export type ReadinessItem = {
  key: string;
  label: string;
  configured: boolean;
  status: ReadinessStatus;
  reason?: string;
};

export type ReadinessGroup = {
  key: string;
  label: string;
  items: ReadinessItem[];
  status: ReadinessStatus;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function envValue(key: string) {
  return cleanText(process.env[key]);
}

function publicAssetUrl(path: string) {
  const siteUrl = envValue("NEXT_PUBLIC_SITE_URL") || "https://trinca-rv21.vercel.app";
  return `${siteUrl.replace(/\/+$/, "")}${path}`;
}

function looksLikePlaceholder(value: string) {
  const normalized = value.toLowerCase();

  return (
    normalized.includes("seu-") ||
    normalized.includes("sua-") ||
    normalized.includes("[link") ||
    normalized.includes("example.com") ||
    normalized.includes("localhost")
  );
}

function isValidHttpsUrl(value: string, allowLocalhost = false) {
  try {
    const url = new URL(value);
    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

    if (allowLocalhost && isLocalhost) {
      return true;
    }

    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function evaluateRequirement(requirement: EnvRequirement): ReadinessItem {
  const value = envValue(requirement.key) || cleanText(requirement.fallbackValue);

  if (!value) {
    return {
      key: requirement.key,
      label: requirement.label,
      configured: false,
      status: requirement.required === false ? "warning" : "missing",
      reason: requirement.required === false ? "Opcional ainda nao configurado." : "Variavel ausente.",
    };
  }

  if (looksLikePlaceholder(value)) {
    return {
      key: requirement.key,
      label: requirement.label,
      configured: true,
      status: "invalid",
      reason: "Valor parece placeholder ou ambiente local.",
    };
  }

  if (requirement.mustBeHttps && !isValidHttpsUrl(value, requirement.allowLocalhost)) {
    return {
      key: requirement.key,
      label: requirement.label,
      configured: true,
      status: "invalid",
      reason: "Precisa ser uma URL HTTPS publica.",
    };
  }

  return {
    key: requirement.key,
    label: requirement.label,
    configured: true,
    status: "ok",
  };
}

function groupStatus(items: ReadinessItem[]): ReadinessStatus {
  if (items.some((item) => item.status === "missing" || item.status === "invalid")) {
    return "invalid";
  }

  if (items.some((item) => item.status === "warning")) {
    return "warning";
  }

  return "ok";
}

function buildGroup(key: string, label: string, requirements: EnvRequirement[]): ReadinessGroup {
  const items = requirements.map(evaluateRequirement);

  return {
    key,
    label,
    items,
    status: groupStatus(items),
  };
}

function twilioSenderItem(): ReadinessItem {
  const hasFrom = Boolean(envValue("TWILIO_WHATSAPP_FROM"));
  const hasMessagingService = Boolean(envValue("TWILIO_MESSAGING_SERVICE_SID"));

  return {
    key: "TWILIO_SENDER",
    label: "Remetente Twilio",
    configured: hasFrom || hasMessagingService,
    status: hasFrom || hasMessagingService ? "ok" : "missing",
    reason:
      hasFrom || hasMessagingService
        ? undefined
        : "Configure TWILIO_WHATSAPP_FROM ou TWILIO_MESSAGING_SERVICE_SID.",
  };
}

function buildTwilioGroup(): ReadinessGroup {
  const baseItems = buildGroup("twilio", "Twilio WhatsApp", [
    { key: "TWILIO_ACCOUNT_SID", label: "Twilio Account SID", required: true },
    { key: "TWILIO_AUTH_TOKEN", label: "Twilio Auth Token", required: true },
    { key: "TWILIO_WEBHOOK_SECRET", label: "Token do inbound Twilio", required: true },
    {
      key: "TWILIO_WHATSAPP_FROM",
      label: "Numero WhatsApp Twilio",
      required: false,
    },
    {
      key: "TWILIO_MESSAGING_SERVICE_SID",
      label: "Messaging Service SID",
      required: false,
    },
  ]).items;
  const items = [...baseItems, twilioSenderItem()];

  return {
    key: "twilio",
    label: "Twilio WhatsApp",
    items,
    status: groupStatus(items),
  };
}

export function buildAutomationReadiness() {
  const groups = [
    buildGroup("core", "Base tecnica", [
      { key: "SUPABASE_URL", label: "Supabase URL", required: true, mustBeHttps: true },
      { key: "SUPABASE_SERVICE_ROLE_KEY", label: "Supabase service role", required: true },
      {
        key: "NEXT_PUBLIC_SITE_URL",
        label: "Dominio oficial do projeto",
        required: true,
        mustBeHttps: true,
      },
      { key: "AUTOMATION_API_SECRET", label: "Token interno da automacao", required: true },
      { key: "CRON_SECRET", label: "Token do agendamento automatico", required: true },
      { key: "KIWIFY_WEBHOOK_SECRET", label: "Token do webhook Kiwify", required: true },
    ]),
    buildGroup("checkout", "Checkout e grupo", [
      {
        key: "NEXT_PUBLIC_KIWIFY_CHECKOUT_URL",
        label: "Checkout Kiwify",
        required: true,
        mustBeHttps: true,
      },
      {
        key: "NEXT_PUBLIC_WHATSAPP_GROUP_URL",
        label: "Link do grupo oficial",
        required: true,
        mustBeHttps: true,
      },
    ]),
    buildTwilioGroup(),
    buildGroup("content_sids", "Templates Twilio", [
      {
        key: "TWILIO_CONTENT_SID_COMPRA_CONFIRMADA",
        label: "Compra confirmada",
        required: true,
      },
      {
        key: "TWILIO_CONTENT_SID_BOAS_VINDAS_VIDEO",
        label: "Video pos-compra",
        required: true,
      },
      {
        key: "TWILIO_CONTENT_SID_ORIENTACOES_INICIAIS",
        label: "Orientacoes iniciais",
        required: true,
      },
      {
        key: "TWILIO_CONTENT_SID_MATERIAIS_DESAFIO",
        label: "Materiais do desafio",
        required: true,
      },
      {
        key: "TWILIO_CONTENT_SID_DIETA_EBOOKS",
        label: "Dieta e ebooks",
        required: true,
      },
      {
        key: "TWILIO_CONTENT_SID_GRUPO_OFICIAL_PREPARACAO",
        label: "Preparacao para grupo",
        required: true,
      },
      {
        key: "TWILIO_CONTENT_SID_GRUPO_OFICIAL_FINAL",
        label: "Video final do grupo",
        required: true,
      },
      {
        key: "TWILIO_CONTENT_SID_GRUPO_OFICIAL_LINK",
        label: "Link do grupo",
        required: true,
      },
    ]),
    buildGroup("premium_content", "Conteudo premium", [
      {
        key: "TRINCA_WELCOME_VIDEO_URL",
        label: "Video de boas-vindas pos-compra",
        required: true,
        mustBeHttps: true,
      },
      {
        key: "TRINCA_ABANDONMENT_VIDEO_URL",
        label: "Video de recuperacao de pagamento",
        required: true,
        mustBeHttps: true,
      },
      {
        key: "TRINCA_GROUP_WELCOME_VIDEO_URL",
        label: "Video de boas-vindas ao grupo",
        required: true,
        mustBeHttps: true,
      },
      {
        key: "TRINCA_ORIENTATION_URL",
        label: "Orientacoes iniciais",
        required: true,
        mustBeHttps: true,
      },
      {
        key: "TRINCA_MATERIALS_URL",
        label: "Materiais do desafio",
        required: true,
        mustBeHttps: true,
      },
      {
        key: "TRINCA_DIET_URL",
        label: "Dieta e treino",
        required: true,
        mustBeHttps: true,
      },
      {
        key: "TRINCA_DIET_EMAGRECIMENTO_URL",
        label: "Dieta de emagrecimento",
        required: false,
        mustBeHttps: true,
        fallbackValue: publicAssetUrl("/materials/dieta-emagrecimento.pdf"),
      },
      {
        key: "TRINCA_DIET_GLUTEOS_URL",
        label: "Dieta de gluteos e firmeza",
        required: false,
        mustBeHttps: true,
        fallbackValue: publicAssetUrl("/materials/dieta-gluteos-firmeza.pdf"),
      },
      {
        key: "TRINCA_DIET_AUTOESTIMA_URL",
        label: "Dieta de autoestima e constancia",
        required: false,
        mustBeHttps: true,
        fallbackValue: publicAssetUrl("/materials/dieta-autoestima.pdf"),
      },
      {
        key: "TRINCA_DIET_ROUPAS_URL",
        label: "Dieta para voltar a usar roupas antigas",
        required: false,
        mustBeHttps: true,
        fallbackValue: publicAssetUrl("/materials/dieta-roupas-antigas.pdf"),
      },
      {
        key: "TRINCA_EBOOK_RV_URL",
        label: "Ebook RV",
        required: true,
        mustBeHttps: true,
        fallbackValue: publicAssetUrl("/materials/ebook-rv-trinca-rv21.pdf"),
      },
      {
        key: "TRINCA_EBOOK_NUTRITION_URL",
        label: "Ebook nutricional",
        required: true,
        mustBeHttps: true,
        fallbackValue: publicAssetUrl("/materials/ebook-nutricional-julia-macena.pdf"),
      },
    ]),
  ];

  const blockers = groups.flatMap((group) =>
    group.items
      .filter((item) => item.status === "missing" || item.status === "invalid")
      .map((item) => ({
        group: group.key,
        key: item.key,
        label: item.label,
        status: item.status,
        reason: item.reason || "",
      }))
  );
  const warnings = groups.flatMap((group) =>
    group.items
      .filter((item) => item.status === "warning")
      .map((item) => ({
        group: group.key,
        key: item.key,
        label: item.label,
        reason: item.reason || "",
      }))
  );

  return {
    ok: true,
    checked_at: new Date().toISOString(),
    launch_ready: blockers.length === 0,
    blockers,
    warnings,
    groups,
  };
}
