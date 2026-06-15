import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type VipPayload = {
  instagram_user?: unknown;
  nome?: unknown;
  whatsapp?: unknown;
};

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
    email: vipEmail(instagramUser, whatsapp),
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

  return NextResponse.json({ ok: true });
}
