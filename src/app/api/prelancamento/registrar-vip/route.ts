import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendServerEvent, createServerEventId } from "@/lib/meta-capi";

type VipPayload = {
  instagram_user?: unknown;
  nome?: unknown;
  whatsapp?: unknown;
  email?: unknown;
  event_id?: unknown;
  objetivo?: unknown; // persona detectada na conversa (emagrecer, gluteos, etc.)
  origem_captura?: unknown; // ex.: "whatsapp-claude"
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function vipEmail(instagramUser: string, whatsapp: string) {
  const reference = instagramUser || whatsapp || crypto.randomUUID();

  return `${reference.toLowerCase().replace(/[^a-z0-9._-]+/g, "_")}@instagram-vip.trincarv21.local`;
}

export async function POST(request: Request) {
  const payload = (await request.json()) as VipPayload;
  const instagramUser = cleanText(payload.instagram_user).replace(/^@+/, "");
  const nome = cleanText(payload.nome) || instagramUser || "Lead VIP Instagram";
  const whatsapp = cleanText(payload.whatsapp);
  const emailInformado = cleanText(payload.email).toLowerCase();
  const eventId = cleanText(payload.event_id) || createServerEventId("Lead", whatsapp || instagramUser);

  if (!instagramUser && !whatsapp) {
    return NextResponse.json(
      { error: "instagram_user ou whatsapp e obrigatorio." },
      { status: 400 },
    );
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
  const objetivoDetectado = cleanText(payload.objetivo);
  const origemCaptura = cleanText(payload.origem_captura);
  const lead = {
    nome,
    email: emailInformado && isValidEmail(emailInformado) ? emailInformado : vipEmail(instagramUser, whatsapp),
    whatsapp,
    instagram: instagramUser || null,
    objetivo: objetivoDetectado || "lista-vip-pre-lancamento",
    origem: origemCaptura || "instagram-lista-vip",
    status: "lista-vip",
    etapa_funil: "pre-lancamento",
    utm: JSON.stringify({
      instagram_user: instagramUser || null,
      source: "prelancamento_vip",
      captured_at: new Date().toISOString(),
    }),
    capturado_em: new Date().toISOString(),
  };

  const lookup = whatsapp
    ? supabase.from("leads").select("id").eq("whatsapp", whatsapp).limit(1).maybeSingle()
    : supabase.from("leads").select("id").eq("email", lead.email).limit(1).maybeSingle();
  const { data: existingLead, error: lookupError } = await lookup;

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  const mutation = existingLead
    ? supabase.from("leads").update(lead).eq("id", existingLead.id)
    : supabase.from("leads").insert(lead);
  const { error } = await mutation;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // CAPI: evento Lead server-side (otimização de tráfego pago p/ a Lista VIP).
  // Mesmo event_id do Pixel no browser → Meta deduplica. Best-effort, não derruba o cadastro.
  try {
    await sendServerEvent(
      "Lead",
      { email: lead.email, phone: whatsapp },
      { event_id: eventId, content_name: "Lista VIP TRINCA RV21" },
    );
  } catch {
    /* CAPI best-effort */
  }

  // Motor de nutrição VIP — LEAN (4 toques, custo mínimo Twilio).
  // Sequência ancorada no LANCAMENTO_OFICIAL = 2026-07-16.
  // Só semeia se for lead nova (evita duplicar em re-cadastro).
  if (!existingLead && whatsapp) {
    const firstName = nome.split(/\s+/)[0] || "você";
    const nowMs = Date.now();
    const orderId = `VIP-${whatsapp || instagramUser || nowMs}`;

    // Datas fixas de envio (BRT = UTC-3, convertido para UTC)
    const D_AQUECIMENTO = "2026-07-11T13:00:00.000Z"; // 11/07 10h BRT (D-5)
    const D_VESPERA     = "2026-07-15T13:00:00.000Z"; // 15/07 10h BRT (D-1)
    const D_ABERTURA    = "2026-07-16T15:00:00.000Z"; // 16/07 12h BRT (D0 carrinho)

    const mk = (etapa: string, enviarEm: string, fallback: string) => ({
      email: lead.email,
      whatsapp,
      nome,
      order_id: orderId,
      etapa,
      canal: "whatsapp",
      mensagem: fallback,
      enviar_em: enviarEm,
      status: "pendente",
      metadata: {
        sequence: "vip-lancamento",
        lancamento: "2026-07-16",
        whatsapp_api: { body_variables: { nome: firstName } },
      },
    });

    try {
      await supabase.from("automation_messages").insert([
        // M1 — Boas-vindas (imediato)
        mk(
          "vip-boas-vindas",
          new Date(nowMs).toISOString(),
          `${firstName}, você está dentro da Lista VIP do TRINCA RV21. Quando o carrinho abrir, você recebe antes de todo mundo. Guarda esse contato.`,
        ),
        // M2 — Aquecimento D-5 (só envia se ainda futuro)
        ...(new Date(D_AQUECIMENTO).getTime() > nowMs ? [mk(
          "vip-aquecimento",
          D_AQUECIMENTO,
          `${firstName}, faltam 5 dias pro TRINCA RV21. 21 dias, 15 minutos por dia. Sem milagre — só protocolo. Fique de olho aqui.`,
        )] : []),
        // M3 — Véspera D-1
        ...(new Date(D_VESPERA).getTime() > nowMs ? [mk(
          "vip-vespera",
          D_VESPERA,
          `${firstName}, é amanhã. O carrinho abre às 12h e fecha em 48h. Você já decidiu — só falta clicar.`,
        )] : []),
        // M4 — Carrinho aberto D0 (mensagem de conversão)
        ...(new Date(D_ABERTURA).getTime() > nowMs ? [mk(
          "vip-abertura",
          D_ABERTURA,
          `${firstName}, abriu agora. Você foi das primeiras a entrar na lista — merece ser das primeiras a garantir. Link: protocolorv.com.br/vip`,
        )] : []),
      ]);
    } catch {
      /* nutrição é best-effort; não derruba o cadastro VIP */
    }
  }

  return NextResponse.json({ ok: true });
}
