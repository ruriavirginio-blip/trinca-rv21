import { after, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { qualificarLead } from "@/lib/claude-ai";
import { cockpitUrl, sendInternalRuriaNotification } from "@/lib/internal-notifications";

type LeadPayload = {
  nome?: string;
  email?: string;
  whatsapp?: string;
  objetivo?: string;
  origem?: string;
  status?: string;
  etapaFunil?: string;
  utm?: string;
  checkoutUrl?: string;
  data?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const payload = (await request.json()) as LeadPayload;
  const rawUtm = cleanText(payload.utm);
  const checkoutUrl = cleanText(payload.checkoutUrl);

  const lead = {
    nome: cleanText(payload.nome),
    email: cleanText(payload.email).toLowerCase(),
    whatsapp: cleanText(payload.whatsapp),
    objetivo: cleanText(payload.objetivo),
    origem: cleanText(payload.origem) || "landing-trinca-rv21",
    status: cleanText(payload.status) || "novo-lead",
    etapa_funil: cleanText(payload.etapaFunil) || "captacao",
    utm: rawUtm
      ? JSON.stringify({
          captured_at: new Date().toISOString(),
          checkout_url: checkoutUrl || null,
          tracking: rawUtm,
        })
      : "",
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

  const { data: existingByEmail, error: emailLookupError } = await supabase
    .from("leads")
    .select("id")
    .eq("email", lead.email)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (emailLookupError) {
    return NextResponse.json({ error: emailLookupError.message }, { status: 500 });
  }

  let existingLead = existingByEmail;

  if (!existingLead) {
    const { data: existingByWhatsapp, error: whatsappLookupError } = await supabase
      .from("leads")
      .select("id")
      .eq("whatsapp", lead.whatsapp)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (whatsappLookupError) {
      return NextResponse.json({ error: whatsappLookupError.message }, { status: 500 });
    }

    existingLead = existingByWhatsapp;
  }

  const mutation = existingLead
    ? supabase.from("leads").update(lead).eq("id", existingLead.id)
    : supabase.from("leads").insert(lead);

  const { error } = await mutation;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  after(() => {
    if (!existingLead) {
      void supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .then(({ count, error }) => {
          if (error || !count || count % 10 !== 0) {
            return;
          }

          void sendInternalRuriaNotification({
            type: "lead_milestone",
            dedupeKey: `lead_milestone:${count}`,
            message: `👥 *TRINCA RV21 — Leads chegando!*

+10 novas leads captadas.
Total acumulado: ${count} leads

👉 Veja no Cockpit:
${cockpitUrl()}`,
          });
        });
    }

    void qualificarLead({
      ...lead,
      etapaFunil: lead.etapa_funil,
      checkoutUrl,
    }).then(async (qualification) => {
      if (qualification.skipped) {
        return;
      }

      const metadata = {
        ...(rawUtm ? { tracking: rawUtm } : {}),
        claude_qualification: {
          ...qualification,
          analyzed_at: new Date().toISOString(),
        },
      };

      try {
        await supabase
          .from("leads")
          .update({
            utm: JSON.stringify({
              captured_at: new Date().toISOString(),
              checkout_url: checkoutUrl || null,
              ...metadata,
            }),
          })
          .eq("email", lead.email);
      } catch (qualificationError) {
        console.error("Erro ao salvar qualificacao Claude", qualificationError);
      }
    });
  });

  return NextResponse.json({
    ok: true,
    mode: existingLead ? "updated" : "created",
  });
}
