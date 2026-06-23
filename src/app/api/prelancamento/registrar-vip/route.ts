import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendServerEvent, createServerEventId } from "@/lib/meta-capi";

type VipPayload = {
  instagram_user?: unknown;
  nome?: unknown;
  whatsapp?: unknown;
  email?: unknown;
  event_id?: unknown;
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
  const lead = {
    nome,
    email: emailInformado && isValidEmail(emailInformado) ? emailInformado : vipEmail(instagramUser, whatsapp),
    whatsapp,
    objetivo: "lista-vip-pre-lancamento",
    origem: "instagram-lista-vip",
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

  // Motor de nutrição VIP: ao ENTRAR na lista (lead nova), agenda os 3 toques.
  // Enviados via template aprovado pela Meta (etapa -> TWILIO_CONTENT_SID_VIP_NUTRICAO_*).
  // So semeia se for lead nova (evita re-semear em re-cadastro).
  if (!existingLead) {
    const firstName = nome.split(/\s+/)[0] || "amiga";
    const nowMs = Date.now();
    const orderId = `VIP-${whatsapp || instagramUser || nowMs}`;
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
        sequence: "vip-nutricao",
        whatsapp_api: { body_variables: { "1": firstName } },
      },
    });
    try {
      await supabase.from("automation_messages").insert([
        mk(
          "vip-nutricao-boas-vindas",
          new Date(nowMs).toISOString(),
          `${firstName}, você entrou na Lista VIP do TRINCA RV21! Vai receber o acesso antes de todo mundo.`,
        ),
        mk(
          "vip-nutricao-valor",
          new Date(nowMs + 2 * 24 * 60 * 60 * 1000).toISOString(),
          `${firstName}, falta pouco pro TRINCA RV21. Resultado vem de direção, não de sacrifício.`,
        ),
        mk(
          "vip-nutricao-vespera",
          new Date("2026-07-01T13:00:00.000Z").toISOString(),
          `${firstName}, é amanhã! Você recebe o link de acesso antes de todo mundo.`,
        ),
      ]);
    } catch {
      /* nutrição é best-effort; não derruba o cadastro VIP */
    }
  }

  return NextResponse.json({ ok: true });
}
