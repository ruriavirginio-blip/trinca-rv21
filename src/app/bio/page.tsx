"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { gaTrackEvent } from "@/lib/google-analytics";
import { trackViewContent } from "@/lib/meta-pixel";
import {
  ArrowRight,
  Dumbbell,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";

const WHATSAPP_NUMBER = "5584998567078";
const WHATSAPP_MESSAGE =
  "Vim pelo link da bio e quero entender o TRINCA RV21.";
const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE
)}`;

const landingBioUrl =
  "/?utm_source=instagram&utm_medium=bio&utm_campaign=trinca_rv21_lancamento";
const landingDirectUrl =
  "/?utm_source=instagram&utm_medium=direct&utm_campaign=trinca_rv21_lancamento";

const bioActions = [
  {
    href: landingBioUrl,
    icon: Dumbbell,
    title: "Garantir minha vaga no TRINCA RV21",
    text: "Ir para a página oficial do desafio e iniciar minha inscrição.",
    primary: true,
  },
  {
    href: whatsappUrl,
    icon: MessageCircle,
    title: "Falar com a equipe RV",
    text: "Tirar dúvida antes de entrar no desafio.",
    primary: false,
  },
  {
    href: landingDirectUrl,
    icon: Sparkles,
    title: "Ver como funciona",
    text: "Entender a sequência, os materiais e a entrada no grupo oficial.",
    primary: false,
  },
];

export default function BioPage() {
  useEffect(() => {
    trackViewContent({
      content_name: "TRINCA RV21 - bio Instagram",
      content_category: "bio_page",
      source: "instagram",
    });
    gaTrackEvent("view_item", {
      content_name: "TRINCA RV21 - bio Instagram",
      content_category: "bio_page",
      source: "instagram",
      items: [
        {
          item_id: "trinca-rv21",
          item_name: "TRINCA RV21",
          item_category: "desafio_fitness",
        },
      ],
    });
  }, []);

  return (
    <main className="bio-page">
      <section className="bio-card">
        <div className="bio-brand">
          <Image
            src="/images/logorv.jpg"
            alt="Logo RV"
            width={68}
            height={68}
            className="brand-mark"
            priority
          />
          <div>
            <p className="eyebrow">Desafio feminino oficial RV</p>
            <h1>TRINCA RV21</h1>
          </div>
        </div>

        <p className="bio-lead">
          21 dias para sair do improviso, recuperar direção e entrar em uma
          experiência guiada com treino, alimentação, suporte e grupo oficial.
        </p>

        <div className="bio-trust">
          <span>
            <ShieldCheck size={16} />
            Inscrição segura via Kiwify
          </span>
          <span>
            <Star size={16} />
            Link oficial da bio RV
          </span>
        </div>

        <div className="bio-actions">
          {bioActions.map((action) => {
            const Icon = action.icon;

            return (
              <Link
                className={`bio-link ${action.primary ? "is-primary" : ""}`}
                href={action.href}
                key={action.title}
              >
                <Icon size={22} />
                <span>
                  <strong>{action.title}</strong>
                  <small>{action.text}</small>
                </span>
                <ArrowRight size={18} />
              </Link>
            );
          })}
        </div>

        <p className="bio-note">
          O grupo oficial é liberado somente no final da sequência individual
          pós-compra, para manter a experiência organizada e segura.
        </p>
      </section>
    </main>
  );
}
