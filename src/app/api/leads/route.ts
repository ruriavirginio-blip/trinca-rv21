import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type LeadPayload = {
  nome?: string;
  email?: string;
  whatsapp?: string;
  objetivo?: string;
  origem?: string;
  status?: string;
  etapaFunil?: string;
  utm?: string;
  data?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const payload = (await request.json()) as LeadPayload;

  const lead = {
    nome: cleanText(payload.nome),
    email: cleanText(payload.email).toLowerCase(),
    whatsapp: cleanText(payload.whatsapp),
    objetivo: cleanText(payload.objetivo),
    origem: cleanText(payload.origem) || "landing-trinca-rv21",
    status: cleanText(payload.status) || "novo-lead",
    etapa_funil: cleanText(payload.etapaFunil) || "captacao",
    utm: cleanText(payload.utm),
    capturado_em: payload.data || new Date().toISOString(),
  };

  if (!lead.nome || !lead.email || !lead.whatsapp || !lead.objetivo) {
    return NextResponse.json(
      { error: "Preencha nome, email, WhatsApp e objetivo." },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return NextResponse.json(
      { error: "Supabase ainda nao configurado no ambiente." },
      { status: 503 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  const { error } = await supabase.from("leads").insert(lead);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
