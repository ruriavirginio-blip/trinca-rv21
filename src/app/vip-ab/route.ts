import { NextRequest, NextResponse } from "next/server";

/* /vip-ab — Redirecionador A/B 50/50 da captura da Lista VIP (decidido com o Ruriá).
   Metade vai pro /vip (formulário plano), metade pro /vip-quiz (quiz). origem distinta
   (o=ig-dm-plano | o=ig-dm-quiz) pra medir a conversão de cada arm na aba Lista VIP.
   A DM do ManyChat aponta pra cá. NÃO captura nada aqui — só sorteia e redireciona. */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const quiz = Math.random() < 0.5;
  const dest = quiz ? "/vip-quiz" : "/vip";
  const o = quiz ? "ig-dm-quiz" : "ig-dm-plano";

  const url = new URL(dest, req.url);
  url.searchParams.set("o", o);

  // preserva o @ do Instagram, se vier (ig=/u=)
  const ig = req.nextUrl.searchParams.get("ig") || req.nextUrl.searchParams.get("u");
  if (ig) url.searchParams.set("ig", ig);

  return NextResponse.redirect(url, 302);
}
