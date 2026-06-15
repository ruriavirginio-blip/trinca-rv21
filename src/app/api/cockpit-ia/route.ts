import { NextRequest, NextResponse } from "next/server";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const anthropicApiKey = cleanText(process.env.ANTHROPIC_API_KEY);

  if (!anthropicApiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY nao configurada." }, { status: 503 });
  }

  const body = await request.json();
  const prompt = `Dados do dia do TRINCA RV21:
- Leads hoje: ${body.leadsHoje ?? 0}
- Vendas hoje: ${body.vendasHoje ?? 0}
- Faturamento hoje: R$ ${Number(body.faturamentoHoje || 0).toFixed(2)}
- Conversao: ${Number(body.conversao || 0).toFixed(1)}%
- Gastos fixos: R$ ${Number(body.gastosFixos || 0).toFixed(2)}
- Lucro liquido estimado: R$ ${Number(body.lucroLiquido || 0).toFixed(2)}
- Leads por comentario hoje: ${body.commentLeadsHoje ?? 0}
- Total de leads: ${body.totalLeads ?? 0}
- Twilio: ${body.twilio ? `${body.twilio.currency} ${body.twilio.balance}` : "sem saldo disponivel"}

Analise o que esta bom, o que precisa de atencao e qual a proxima acao pratica.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: cleanText(process.env.ANTHROPIC_MODEL) || "claude-sonnet-4-6",
      max_tokens: 800,
      system:
        "Você é o assistente do Ruriá Virgínio, personal trainer de Natal/RN. Analise os dados e explique em linguagem simples, direta, com emojis, como se fosse para um amigo. Máximo 4 parágrafos.",
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return NextResponse.json(
      { error: "Falha ao chamar Claude API.", details: data },
      { status: response.status },
    );
  }

  return NextResponse.json({
    analysis: data.content?.[0]?.text || "Nao consegui gerar a analise agora.",
  });
}
