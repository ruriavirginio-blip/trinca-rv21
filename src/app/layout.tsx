import type { Metadata } from "next";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import MetaPixel from "@/components/MetaPixel";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRINCA RV21 | Desafio Feminino Oficial RV",
  description:
    "21 dias de treino, alimentacao, suporte e acompanhamento para mulheres que querem recuperar autoestima, disciplina e resultado real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-full flex flex-col">
        <GoogleAnalytics />
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
