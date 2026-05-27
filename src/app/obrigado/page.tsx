import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  MessageCircle,
  ShieldCheck,
  Video,
} from "lucide-react";

const WHATSAPP_GROUP_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_GROUP_URL ||
  "https://chat.whatsapp.com/GFgMskDS6DfK5Ujf29N4PE?mode=gi_t";

const nextSteps = [
  {
    icon: MessageCircle,
    title: "Entre no grupo oficial",
    text: "O grupo será o ponto central de avisos, direcionamentos e acompanhamento do desafio.",
  },
  {
    icon: Video,
    title: "Assista à apresentação",
    text: "Você receberá a explicação do método, da proposta dos 21 dias e de como aproveitar melhor a jornada.",
  },
  {
    icon: FileText,
    title: "Aguarde seus materiais",
    text: "A dieta específica, Ebook RV e Ebook Nutricional serão enviados conforme a organização oficial do desafio.",
  },
];

export default function ObrigadoPage() {
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
            Sua entrada no TRINCA RV21 foi confirmada. Agora o próximo passo é
            entrar no grupo oficial para receber os avisos, a apresentação do
            método e os materiais de preparação.
          </p>

          <div className="thanks-actions">
            <a className="button button-primary" href={WHATSAPP_GROUP_URL}>
              Entrar no grupo oficial
              <ArrowRight size={18} />
            </a>
            <Link className="button button-secondary" href="/">
              Voltar para a landing
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
