"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { gaTrackEvent, gaTrackPurchase } from "@/lib/google-analytics";
import { trackPurchase, trackViewContent } from "@/lib/meta-pixel";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  MessageCircle,
  ShieldCheck,
  Video,
} from "lucide-react";

const nextSteps = [
  {
    icon: Video,
    title: "Assista à apresentação",
    text: "O vídeo de boas-vindas será enviado primeiro no WhatsApp cadastrado.",
  },
  {
    icon: FileText,
    title: "Receba os materiais",
    text: "Orientações, arquivos, dieta, Ebook RV e Ebook Nutricional serão enviados na sequência oficial.",
  },
  {
    icon: MessageCircle,
    title: "Entre no grupo oficial",
    text: "O link do grupo será enviado no final da sequência individual de boas-vindas.",
  },
];

export default function ObrigadoPage() {
  useEffect(() => {
    trackViewContent({
      content_name: "TRINCA RV21 - obrigado",
      content_category: "post_purchase",
    });
    gaTrackEvent("view_item", {
      content_name: "TRINCA RV21 - obrigado",
      content_category: "post_purchase",
    });
    trackPurchase({
      value: 37.89,
      currency: "BRL",
      content_type: "product",
      content_ids: ["trinca-rv21"],
      content_name: "TRINCA RV21",
      source: "obrigado_page",
    });
    gaTrackPurchase({
      transaction_id: `obrigado-page-${Date.now()}`,
      source: "obrigado_page",
    });
  }, []);

  return (
    <main className="thanks-page">
      <section className="thanks-hero">
        <div className="thanks-copy">
          <Link className="thanks-brand" href="/">
            <Image
              src="/images/logorv.jpg"
              alt="Logo RV"
              width={44}
              height={44}
              className="brand-mark"
              priority
            />
            <span>TRINCA RV21</span>
          </Link>

          <p className="eyebrow">Inscrição confirmada</p>
          <h1>Bem-vinda ao desafio.</h1>
          <p>
            Sua entrada no TRINCA RV21 foi confirmada. Agora acompanhe o
            WhatsApp cadastrado para receber a apresentação, as orientações, os
            materiais e, no final da sequência, o acesso ao grupo oficial.
          </p>

          <div className="thanks-actions">
            <Link className="button button-primary" href="/">
              Voltar para a landing
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="thanks-trust">
            <span>
              <ShieldCheck size={16} />
              Acesso liberado após pagamento aprovado
            </span>
            <span>
              <CheckCircle2 size={16} />
              Materiais enviados pela estrutura RV
            </span>
          </div>
        </div>

        <div className="thanks-card">
          <p>Próximos passos</p>
          <div className="thanks-steps">
            {nextSteps.map((step) => {
              const Icon = step.icon;

              return (
                <article key={step.title}>
                  <Icon size={22} />
                  <div>
                    <h2>{step.title}</h2>
                    <p>{step.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
