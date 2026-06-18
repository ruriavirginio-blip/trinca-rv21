import type { Metadata } from "next";

// Comando 2 — banner premium (ckm:banner-design) como imagem de compartilhamento.
// Quando o link e enviado no WhatsApp/Instagram, aparece o card profissional.
export const metadata: Metadata = {
  title: "TRINCA RV21 · Desafio Feminino de 21 Dias",
  description:
    "Você não falhou. O método é que falhou com você. 21 dias com treino direcionado, dieta por objetivo e acompanhamento diário. +5.000 mulheres transformadas.",
  keywords: [
    "desafio fitness feminino",
    "emagrecer 21 dias",
    "treino para mulheres",
    "protocolo RV",
    "Ruriá Virgínio",
    "perder barriga",
    "dieta por objetivo",
  ],
  alternates: { canonical: "https://protocolorv.com.br/nova" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    title: "TRINCA RV21 · Você não falhou. O método falhou.",
    description:
      "21 dias pra você voltar a se reconhecer no espelho. +5.000 mulheres, 14 anos de método.",
    url: "https://protocolorv.com.br/nova",
    siteName: "TRINCA RV21",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/images/og-trinca-nova.png",
        width: 1200,
        height: 630,
        alt: "TRINCA RV21 — Protocolo RV, desafio de 21 dias",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TRINCA RV21 · Você não falhou. O método falhou.",
    description: "21 dias pra você voltar a se reconhecer no espelho.",
    images: ["/images/og-trinca-nova.png"],
  },
};

export default function NovaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
