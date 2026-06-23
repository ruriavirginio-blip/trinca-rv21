import { NextResponse } from "next/server";

/* Cérebro Claude pro Instagram (chamado pelo ManyChat External Request).
   Gera a DM de acolhimento NA VOZ DO RURIÁ e direciona pra Lista VIP (/vip).
   Recebe { name, comment } e devolve no formato que o ManyChat renderiza. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VIP_URL = "https://protocolorv.com.br/vip";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

// VOZ DO RURIÁ — gravada conforme ele definiu (homem, bem-humorado, jargões próprios).
const SYSTEM = [
  "Você é o Ruriá Virgínio (@ruriavirginio), personal há 14 anos e criador do PROTOCOLO RV. Está respondendo no DIRECT do Instagram alguém que comentou interessada no TRINCA RV21 (desafio feminino de 21 dias: treino direcionado + dieta de nutricionista + acompanhamento no grupo).",
  "ESTAMOS EM PRÉ-LANÇAMENTO: NÃO venda, NÃO fale preço, NÃO prometa resultado garantido, NÃO dê conselho médico. O objetivo é ACOLHER, criar conexão e levar a pessoa pra LISTA VIP (acesso antecipado, sem cobrança agora).",
  "SUA VOZ (regras de ouro):",
  "- Você é HOMEM: tom simpático, bem-humorado, divertido e alegre, mas SEM ser emotivo demais e SEM nada afeminado. NADA de emoji de coração. Emojis com parcimônia (no máx 1, masculinos: 💪🔥👊🙏 quando couber).",
  "- NUNCA comece com 'Oi'. Comece com 'E aí', 'Opa', 'Tudo joia?' ou 'Tudo tranquilo?'.",
  "- Use seus jargões com naturalidade quando couber: 'Cuida' (ex: cuida em virar a chave / cuidar na vida), 'Bora agir' (ex: bora agir nesse resultado / bora cuidar na vida?). São a sua identidade.",
  "- Tom motivacional e profissional. Fique mais sério se a pessoa estiver séria; mais leve se ela estiver leve. Adapte à pessoa, sem soar robótico.",
  "- Mensagem CURTA (2 a 4 linhas), natural, como se você mesmo tivesse digitado no celular. Use o nome dela se tiver.",
  "Estrutura: 1) abertura calorosa no seu estilo reconhecendo o interesse dela; 2) 1 frase rápida sobre o que é o TRINCA (sem preço); 3) convida pra entrar na LISTA VIP e fala que o link tá logo abaixo. NÃO repita o link no texto (vai num botão).",
].join("\n");

async function gerarMensagem(name: string, comment: string): Promise<string> {
  const apiKey = clean(process.env.ANTHROPIC_API_KEY);
  const fallback = `E aí${name ? `, ${name}` : ""}! Que satisfação te ver chegando 💪 O TRINCA RV21 é meu desafio de 21 dias pra virar a chave de verdade — treino, dieta e acompanhamento. Bora cuidar na vida? Entra na Lista VIP no botão aqui embaixo que você garante acesso antes de todo mundo. Bora agir!`;
  if (!apiKey) return fallback;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: clean(process.env.ANTHROPIC_MODEL) || "claude-sonnet-4-6",
        max_tokens: 320,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `A pessoa${name ? ` (nome: ${name})` : ""} comentou: "${comment || "demonstrou interesse"}". Escreva a DM de acolhimento dela agora, na sua voz.`,
          },
        ],
      }),
    });
    const data = await r.json();
    const txt = clean(data?.content?.[0]?.text);
    return txt || fallback;
  } catch {
    return fallback;
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  // ManyChat manda os campos que a gente definir; aceitamos vários nomes por robustez.
  const name = clean(body.name) || clean(body.first_name) || clean(body.nome);
  const comment =
    clean(body.comment) || clean(body.text) || clean(body.last_input_text) || clean(body.mensagem);

  const mensagem = await gerarMensagem(name, comment);

  // `reply` no topo = mapeamento fácil no External Request do ManyChat ($.reply).
  // `content` (v2) = caso use o modo Dynamic Block.
  return NextResponse.json({
    reply: mensagem,
    vip_url: `${VIP_URL}?o=ig-dm`,
    version: "v2",
    content: {
      messages: [
        {
          type: "text",
          text: mensagem,
          buttons: [
            { type: "url", caption: "👉 Entrar na Lista VIP", url: `${VIP_URL}?o=ig-dm` },
          ],
        },
      ],
    },
  });
}

// GET de teste rápido (sem ManyChat): /api/ig-claude-brain?name=Ana&comment=QUERO
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = clean(searchParams.get("name"));
  const comment = clean(searchParams.get("comment"));
  const mensagem = await gerarMensagem(name, comment);
  return NextResponse.json({ ok: true, preview: mensagem });
}
