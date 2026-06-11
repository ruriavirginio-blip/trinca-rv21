import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  FileText,
  HeartPulse,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

type SectionItem = string | {
  href: string;
  text: string;
};

const sections = {
  orientacoes: {
    eyebrow: "Orientações iniciais",
    title: "Comece pelos fundamentos antes de executar.",
    description:
      "Use esta etapa para entender a ordem do desafio, preparar sua rotina e entrar nos 21 dias com clareza.",
    icon: ClipboardList,
    blocks: [
      {
        title: "Primeira decisão",
        items: [
          "Assista ao vídeo de boas-vindas enviado no WhatsApp.",
          "Separe um horário fixo para treino e leitura das orientações.",
          "Evite pular etapas: a sequência foi organizada para reduzir ansiedade.",
        ],
      },
      {
        title: "Vídeos reservados",
        items: [
          "Vídeo de boas-vindas pós-compra: entra aqui quando o arquivo final estiver aprovado.",
          "Vídeo de recuperação de pagamento: reservado para leads que travaram antes da compra.",
          "Vídeo de boas-vindas ao grupo: liberado somente antes do link oficial do grupo.",
        ],
      },
      {
        title: "Como acompanhar",
        items: [
          "Mantenha o WhatsApp cadastrado ativo.",
          "Acompanhe os check-ins e avisos oficiais.",
          "Use esta página como referência inicial antes de abrir os materiais.",
        ],
      },
    ],
  },
  materiais: {
    eyebrow: "Materiais do desafio",
    title: "Arquivos de apoio para manter constância.",
    description:
      "A central de materiais organiza ebooks, check-ins e documentos que acompanham a execução do TRINCA RV21.",
    icon: FileText,
    blocks: [
      {
        title: "Materiais previstos",
        items: [
          "Ebook RV para mentalidade, rotina e constância.",
          "Ebook Nutricional para melhorar escolhas e organização alimentar.",
          "Arquivos de apoio e orientações oficiais dos 21 dias.",
        ],
      },
      {
        title: "Arquivos em preparação",
        items: [
          "Ebook RV: espaço reservado para o PDF oficial.",
          "Ebook Nutricional: espaço reservado para o PDF oficial.",
          "Materiais complementares: espaço reservado para check-ins e documentos finais.",
        ],
      },
      {
        title: "Uso recomendado",
        items: [
          "Leia antes de começar o primeiro ciclo de execução.",
          "Guarde esta página para consultar durante o desafio.",
          "Volte aos materiais sempre que perder ritmo ou clareza.",
        ],
      },
    ],
  },
  "dieta-treino": {
    eyebrow: "Dieta e treino",
    title: "Direção prática para sair do improviso.",
    description:
      "Esta área será usada para organizar dieta, treino e recomendações de execução conforme o objetivo da participante.",
    icon: HeartPulse,
    blocks: [
      {
        title: "Estrutura da execução",
        items: [
          "Treinos direcionados para os 21 dias.",
          "Dieta por objetivo, com orientação clara para aplicar na rotina.",
          "Check-ins para acompanhar adesão, comportamento e constância.",
        ],
      },
      {
        title: "Dietas por objetivo",
        items: [
          {
            text: "Emagrecimento: abrir PDF oficial.",
            href: "/materials/dieta-emagrecimento.pdf",
          },
          {
            text: "Glúteos e firmeza corporal: abrir PDF oficial.",
            href: "/materials/dieta-gluteos-firmeza.pdf",
          },
          {
            text: "Autoestima e constância: abrir PDF oficial.",
            href: "/materials/dieta-autoestima.pdf",
          },
          {
            text: "Voltar a usar roupas antigas: abrir PDF oficial.",
            href: "/materials/dieta-roupas-antigas.pdf",
          },
        ],
      },
      {
        title: "Treinos por objetivo",
        items: [
          "Treino feminino 21 dias: espaço reservado para a versão oficial.",
          "Treino iniciante/intermediário: espaço reservado para ajuste final.",
          "Treino com foco em constância: espaço reservado para acompanhamento dos check-ins.",
        ],
      },
      {
        title: "Antes de começar",
        items: [
          "Siga a orientação recebida no WhatsApp.",
          "Não misture protocolos externos sem necessidade.",
          "Em caso de condição clínica, siga orientação profissional individual.",
        ],
      },
    ],
  },
};

type PageProps = {
  params: Promise<{
    secao: string;
  }>;
};

export function generateStaticParams() {
  return Object.keys(sections).map((secao) => ({ secao }));
}

export default async function AlunaSectionPage({ params }: PageProps) {
  const { secao } = await params;
  const section = sections[secao as keyof typeof sections];

  if (!section) {
    notFound();
  }

  const Icon = section.icon;

  return (
    <main className="student-page">
      <section className="student-detail">
        <Link className="student-back" href="/aluna">
          <ArrowLeft size={16} />
          Voltar para a central
        </Link>

        <div className="student-detail-hero">
          <div>
            <p className="eyebrow">{section.eyebrow}</p>
            <h1>{section.title}</h1>
            <p>{section.description}</p>
          </div>
          <Icon size={42} />
        </div>

        <div className="student-detail-grid">
          {section.blocks.map((block) => (
            <article className="student-detail-card" key={block.title}>
              <h2>{block.title}</h2>
              <ul>
                {block.items.map((item: SectionItem) => (
                  <li key={typeof item === "string" ? item : item.href}>
                    <CheckCircle2 size={18} />
                    {typeof item === "string" ? (
                      item
                    ) : (
                      <a href={item.href} rel="noreferrer" target="_blank">
                        {item.text}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <aside className="student-warning">
          <ShieldCheck size={22} />
          <p>
            O grupo oficial e os arquivos finais devem ser acessados apenas pela
            sequência enviada no WhatsApp. Isso protege a ordem da experiência e
            evita que etapas importantes sejam puladas.
          </p>
        </aside>

        <div className="student-detail-actions">
          <Link className="button button-secondary" href="/aluna">
            Ver todas as seções
          </Link>
          <Link className="button button-primary" href="/">
            Voltar para o TRINCA RV21
            <MessageCircle size={18} />
          </Link>
        </div>
      </section>

      <section className="student-note">
        <Dumbbell size={26} />
        <div>
          <h2>Espaço preparado para os arquivos oficiais</h2>
          <p>
            Quando vídeos, PDFs, dieta e treino final forem definidos, esta
            seção receberá os links oficiais sem alterar o fluxo principal.
          </p>
        </div>
      </section>
    </main>
  );
}
