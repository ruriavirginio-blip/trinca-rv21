import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  FileText,
  HeartPulse,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

const studentSections = [
  {
    href: "/aluna/orientacoes",
    icon: ClipboardList,
    title: "Orientações iniciais",
    text: "Como viver os primeiros passos do TRINCA RV21 com clareza, ordem e compromisso.",
  },
  {
    href: "/aluna/materiais",
    icon: FileText,
    title: "Materiais do desafio",
    text: "Central para ebooks, arquivos de apoio, check-ins e documentos oficiais do processo.",
  },
  {
    href: "/aluna/dieta-treino",
    icon: HeartPulse,
    title: "Dieta e treino",
    text: "Área de direcionamento para alimentação, rotina de treino e execução dos 21 dias.",
  },
];

const flowSteps = [
  "Assista ao vídeo de boas-vindas enviado no WhatsApp.",
  "Leia as orientações antes de abrir os materiais.",
  "Separe seus arquivos e acompanhe os check-ins.",
  "Entre no grupo apenas quando o link oficial for liberado.",
];

export default function AlunaHubPage() {
  return (
    <main className="student-page">
      <section className="student-hero">
        <div className="student-copy">
          <Link className="student-brand" href="/">
            TRINCA RV21
          </Link>
          <p className="eyebrow">Área de entrada da aluna</p>
          <h1>Uma sequência organizada para você começar com direção.</h1>
          <p>
            Esta central reúne os destinos que serão enviados no WhatsApp após a
            aprovação da inscrição. Cada etapa existe para reduzir ansiedade,
            organizar sua execução e proteger a experiência do desafio.
          </p>

          <div className="student-trust">
            <span>
              <ShieldCheck size={16} />
              Acesso orientado por etapa
            </span>
            <span>
              <MessageCircle size={16} />
              Grupo oficial só no final da sequência
            </span>
          </div>
        </div>

        <aside className="student-flow">
          <p>Ordem recomendada</p>
          <ol>
            {flowSteps.map((step) => (
              <li key={step}>
                <CheckCircle2 size={18} />
                {step}
              </li>
            ))}
          </ol>
        </aside>
      </section>

      <section className="student-section-grid" aria-label="Seções da aluna">
        {studentSections.map((section) => {
          const Icon = section.icon;

          return (
            <Link className="student-section-card" href={section.href} key={section.href}>
              <Icon size={26} />
              <h2>{section.title}</h2>
              <p>{section.text}</p>
              <span>
                Abrir seção
                <ArrowRight size={16} />
              </span>
            </Link>
          );
        })}
      </section>

      <section className="student-note">
        <Dumbbell size={26} />
        <div>
          <h2>Conteúdo final em preparação</h2>
          <p>
            Vídeos, PDFs, dieta final e materiais específicos entram aqui assim
            que forem fechados. A estrutura já está pronta para receber os links
            oficiais no fluxo Twilio.
          </p>
        </div>
      </section>
    </main>
  );
}
