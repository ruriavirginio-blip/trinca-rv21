"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  gaTrackBeginCheckout,
  gaTrackEvent,
  gaTrackLead,
} from "@/lib/google-analytics";
import {
  trackCustomEvent,
  trackInitiateCheckout,
  trackLead,
  trackViewContent,
} from "@/lib/meta-pixel";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  Crown,
  Dumbbell,
  FileText,
  Gift,
  HeartPulse,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Video,
  WalletCards,
} from "lucide-react";

const WHATSAPP_NUMBER = "5584998567078";
const WHATSAPP_MESSAGE =
  "Quero garantir minha vaga no TRINCA RV21. Ja preenchi minha inscricao na landing page.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE
)}`;
const CHECKOUT_URL = process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL || WHATSAPP_URL;
const PRODUCT_PRICE = 37.89;

function buildLeadTracking() {
  if (typeof window === "undefined") {
    return "";
  }

  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};

  params.forEach((value, key) => {
    if (
      key.startsWith("utm_") ||
      ["fbclid", "gclid", "ttclid", "src", "source", "ref"].includes(key)
    ) {
      utm[key] = value;
    }
  });

  return JSON.stringify({
    origem: "landing-trinca-rv21",
    landing_url: window.location.href,
    path: window.location.pathname,
    query: window.location.search,
    referrer: document.referrer || "",
    user_agent: navigator.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    utm,
  });
}

function checkoutUrlWithTracking() {
  if (typeof window === "undefined") {
    return CHECKOUT_URL;
  }

  try {
    const checkout = new URL(CHECKOUT_URL, window.location.origin);
    const currentParams = new URLSearchParams(window.location.search);

    currentParams.forEach((value, key) => {
      if (!checkout.searchParams.has(key)) {
        checkout.searchParams.set(key, value);
      }
    });

    checkout.searchParams.set("origem", "landing-trinca-rv21");

    return checkout.toString();
  } catch {
    return CHECKOUT_URL;
  }
}

function safeParseTracking(value: string) {
  try {
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

function objectiveLabel(value: string) {
  return objectiveOptions.find((option) => option.value === value)?.label || value;
}

const benefits = [
  "Treinos direcionados para 21 dias",
  "Dieta específica por objetivo",
  "Grupo exclusivo com direcionamento",
  "Check-ins para manter constância",
  "Ebook RV e Ebook Nutricional",
  "Cupom TRINCA PREMIUM50% pós-desafio",
];

const heroFlow = [
  "Inscrição segura",
  "Boas-vindas individual",
  "Grupo no final da sequência",
];

const painPoints = [
  "Você começa animada, mas perde ritmo quando a rotina aperta.",
  "Sente que precisa emagrecer, desinchar e voltar a gostar das fotos.",
  "Já tentou sozinha, mas faltou direção, cobrança e suporte real.",
  "Quer resultado, mas não quer um plano impossível de seguir.",
];

const fitItems = [
  "Quer viver 21 dias com direção em vez de improvisar mais uma tentativa.",
  "Está disposta a seguir treino, alimentação e check-ins com constância real.",
  "Quer entrar em um ambiente acompanhado, organizado e com comunicação clara.",
];

const commitmentItems = [
  "Não é uma promessa mágica, rápida ou sem esforço.",
  "Não substitui acompanhamento médico quando houver necessidade clínica.",
  "Não combina com quem quer apenas entrar no grupo sem viver a sequência.",
];

const pillars = [
  {
    icon: Dumbbell,
    title: "Treino RV",
    text: "Protocolos objetivos para colocar seu corpo em movimento com foco em emagrecimento, definição e condicionamento.",
  },
  {
    icon: HeartPulse,
    title: "Alimentação guiada",
    text: "Dieta específica para cada participante conforme o objetivo selecionado, elaborada por nutricionista conceituada.",
  },
  {
    icon: Users,
    title: "Grupo oficial",
    text: "Ambiente de acompanhamento para você não se sentir sozinha e manter compromisso durante o desafio.",
  },
  {
    icon: BadgeCheck,
    title: "Check-ins",
    text: "Pontos de controle para acompanhar evolução, ajustar comportamento e manter a constância.",
  },
  {
    icon: FileText,
    title: "Materiais de apoio",
    text: "Ebook RV, Ebook Nutricional e ferramentas para fortalecer disciplina, rotina e consciência alimentar.",
  },
  {
    icon: Crown,
    title: "Pós-desafio",
    text: "Ao finalizar, você recebe o cupom TRINCA PREMIUM50% para continuar sua evolução dentro da sistematização online RV.",
  },
];

const resultsImages = [
  "antesdepoo.jpg",
  "antesdepo.jpg",
  "antesdepoi.jpg",
  "antesdepoii.jpg",
  "antesdepoiii.jpg",
  "antesdepoiiii.jpg",
  "antesdepois.jpg",
  "antesdepoiss.jpg",
  "antesdepoisss.jpg",
  "antesdepoissss.jpg",
  "antesdepoissssss.jpg",
];

const marqueeResults = [...resultsImages, ...resultsImages];

const proofGallery = [
  {
    image: "antesdepoo.jpg",
    name: "Jessica",
    age: "34 anos",
    result: "Mais firmeza e constância",
  },
  {
    image: "antesdepo.jpg",
    name: "Mariana",
    age: "29 anos",
    result: "Medidas reduzidas",
  },
  {
    image: "antesdepoi.jpg",
    name: "Camila",
    age: "41 anos",
    result: "Voltou para a rotina",
  },
  {
    image: "antesdepoii.jpg",
    name: "Renata",
    age: "37 anos",
    result: "Mais disposição",
  },
  {
    image: "antesdepoiii.jpg",
    name: "Ana",
    age: "32 anos",
    result: "Corpo mais definido",
  },
  {
    image: "antesdepois.jpg",
    name: "Fernanda",
    age: "45 anos",
    result: "Confiança recuperada",
  },
];

const journey = [
  {
    step: "01",
    title: "Inscrição",
    text: "Você preenche seus dados e segue para finalizar sua entrada com pagamento seguro.",
  },
  {
    step: "02",
    title: "Aprovação",
    text: "Com o pagamento aprovado, sua entrada é marcada e a jornada de boas-vindas começa.",
  },
  {
    step: "03",
    title: "Entrada guiada",
    text: "Você confirma que está pronta, recebe o vídeo de boas-vindas e só então segue para orientações, materiais, dieta e ebooks.",
  },
  {
    step: "04",
    title: "Grupo oficial",
    text: "O link do grupo chega apenas no final da sequência individual, depois do vídeo de boas-vindas ao ambiente oficial.",
  },
];

const guidedExperience = [
  {
    icon: ShieldCheck,
    title: "Confirmação sem ansiedade",
    text: "A compra aprovada não vira um envio frio. Você recebe uma confirmação clara e só avança quando toca em Estou pronta.",
  },
  {
    icon: Video,
    title: "Boas-vindas antes dos materiais",
    text: "O vídeo inicial apresenta o compromisso dos 21 dias antes da entrega das orientações, dieta, ebooks e arquivos do desafio.",
  },
  {
    icon: MessageCircle,
    title: "Grupo no momento certo",
    text: "O grupo oficial é liberado depois da sequência individual, para proteger a ordem, o acolhimento e a experiência das alunas.",
  },
];

const bonuses = [
  "Dieta específica para seu objetivo, elaborada por nutricionista",
  "Ebook RV para mentalidade e constância",
  "Ebook Nutricional para melhorar escolhas",
  "Cupom TRINCA PREMIUM50% liberado no pós-desafio",
];

const offerFlow = [
  "Você preenche a inscrição e segue para o checkout seguro.",
  "Após a aprovação, recebe confirmação e vídeo de boas-vindas.",
  "Em seguida chegam orientações, materiais, dieta e ebooks.",
  "O link do grupo oficial é liberado no final da sequência.",
];

const objectiveOptions = [
  {
    value: "emagrecimento-barriga",
    label: "Perder barriga",
  },
  {
    value: "gluteos",
    label: "Definir glúteos e pernas",
  },
  {
    value: "emagrecimento-geral",
    label: "Perder peso geral",
  },
  {
    value: "autoestima",
    label: "Ganhar disposição e autoestima",
  },
];

const faqItems = [
  {
    question: "O desafio é para iniciantes?",
    answer:
      "Sim. O desafio atende iniciantes e também mulheres em nível moderado ou avançado, porque a estrutura dá direção conforme o objetivo e a realidade de cada participante.",
  },
  {
    question: "Preciso treinar em academia?",
    answer:
      "O ideal é ter acesso à academia, mas a orientação pode ser adaptada conforme sua realidade e nível.",
  },
  {
    question: "A dieta é igual para todo mundo?",
    answer:
      "Não. A proposta é direcionar uma dieta específica conforme o objetivo escolhido pela participante, com elaboração de nutricionista conceituada.",
  },
  {
    question: "O valor parcelado tem juros?",
    answer:
      "Sim. O valor à vista é R$ 37,89 e a entrada pode ser parcelada em até 8x no cartão. O parcelamento está sujeito a acréscimos da Kiwify.",
  },
  {
    question: "Quando recebo os materiais?",
    answer:
      "Após a aprovação do pagamento, você entra no fluxo de boas-vindas e recebe os materiais do desafio.",
  },
  {
    question: "O grupo é liberado antes do pagamento?",
    answer:
      "Não. O grupo oficial é enviado apenas após o pagamento aprovado e depois da sequência individual de boas-vindas, para manter a organização e proteger a experiência das alunas.",
  },
  {
    question: "O cupom de 50% pode ser usado quando?",
    answer:
      "O cupom TRINCA PREMIUM50% é pensado para o pós-desafio, como incentivo para continuar evoluindo dentro da sistematização online RV.",
  },
  {
    question: "E se eu começar e perder o ritmo?",
    answer:
      "A estrutura do desafio existe justamente para reduzir desistência: grupo, check-ins, mensagens de acompanhamento e uma rotina clara para você voltar para o processo rapidamente.",
  },
];

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const formStarted = useRef(false);

  useEffect(() => {
    trackViewContent({
      content_name: "TRINCA RV21 - landing principal",
      content_category: "landing_page",
    });
    gaTrackEvent("view_item", {
      currency: "BRL",
      value: PRODUCT_PRICE,
      items: [
        {
          item_id: "trinca-rv21",
          item_name: "TRINCA RV21",
          item_category: "desafio_fitness",
          price: PRODUCT_PRICE,
          quantity: 1,
        },
      ],
    });

    const reachedDepths = new Set<number>();
    const depths = [25, 50, 75, 90];

    function handleScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;

      if (scrollable <= 0) {
        return;
      }

      const currentDepth = Math.round((window.scrollY / scrollable) * 100);

      for (const depth of depths) {
        if (currentDepth >= depth && !reachedDepths.has(depth)) {
          reachedDepths.add(depth);
          trackCustomEvent("ScrollDepth", {
            content_name: "TRINCA RV21 - landing principal",
            depth,
          });
          gaTrackEvent("scroll_depth", {
            content_name: "TRINCA RV21 - landing principal",
            depth,
          });
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleLeadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSubmitError("");

    const formData = new FormData(event.currentTarget);
    const checkoutUrl = checkoutUrlWithTracking();
    const tracking = buildLeadTracking();

    const lead = {
      nome: String(formData.get("nome") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      whatsapp: String(formData.get("whatsapp") || "").trim(),
      objetivo: String(formData.get("objetivo") || ""),
      origem: "landing-trinca-rv21",
      status: "checkout-iniciado",
      etapaFunil: "checkout",
      utm: tracking,
      checkoutUrl,
      data: new Date().toISOString(),
    };
    const trackingData = safeParseTracking(tracking);

    try {
      trackLead({
        content_name: "TRINCA RV21 - formulario landing",
        content_category: "lead_capture",
        value: PRODUCT_PRICE,
        currency: "BRL",
        objective: lead.objetivo,
        objective_label: objectiveLabel(lead.objetivo),
        utm: trackingData.utm || {},
        source: "landing-trinca-rv21",
      });
      gaTrackLead({
        objective: lead.objetivo,
        objective_label: objectiveLabel(lead.objetivo),
        source: "landing-trinca-rv21",
      });

      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(lead),
      });

      if (!response.ok) {
        throw new Error("Nao foi possivel registrar o lead.");
      }

      trackInitiateCheckout({
        value: PRODUCT_PRICE,
        currency: "BRL",
        content_ids: ["trinca-rv21"],
        checkout_url: checkoutUrl,
        objective: lead.objetivo,
        objective_label: objectiveLabel(lead.objetivo),
        utm: trackingData.utm || {},
      });
      gaTrackBeginCheckout({
        checkout_url: checkoutUrl,
        objective: lead.objetivo,
        objective_label: objectiveLabel(lead.objetivo),
      });

      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Erro ao capturar lead:", error);
      setSubmitError(
        "Nao consegui registrar sua inscricao agora. Clique no botao do WhatsApp para continuar."
      );
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <div className="social-proof-bar">
        🔥 +5.000 mulheres transformadas • 14 anos • +10 países
      </div>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="TRINCA RV21">
          <Image
            src="/images/logorv.jpg"
            alt="Logo RV"
            width={42}
            height={42}
            className="brand-mark"
            priority
          />
          <span>TRINCA RV21</span>
        </a>

        <nav aria-label="Navegação principal">
          <a href="#metodo">Protocolo</a>
          <a href="#resultados">Resultados</a>
          <a href="#oferta">Oferta</a>
          <a href="#faq">Dúvidas</a>
        </nav>

        <a className="nav-cta" href="#inscricao">
          Garantir vaga
          <ArrowRight size={16} strokeWidth={2.2} />
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-inner">
          <p className="eyebrow">Desafio feminino oficial RV</p>

          <h1>21 dias para sair do ciclo de começar e desistir.</h1>

          <div className="hero-mobile-portrait" aria-hidden="true">
            <Image
              src="/images/ruria-rosto-premium.png"
              alt=""
              fill
              sizes="100vw"
              className="hero-mobile-photo"
              priority
            />
          </div>

          <p className="hero-lead">Protocolo RV. 14 anos. +5.000 mulheres.</p>

          <div className="hero-proof-video-card">
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/images/depoimento-coletivo-poster.jpg"
              aria-label="Depoimento real de alunas do Protocolo RV"
            >
              <source src="/media/depoimento-coletivo.mp4" type="video/mp4" />
            </video>
            <div className="hero-video-overlay">
              <span>Prova real</span>
              <strong>Alunas vivendo o método RV</strong>
            </div>
          </div>

          <div className="hero-actions">
            <a className="button button-primary" href="#inscricao">
              Garantir minha vaga agora →
            </a>
            <a className="button button-secondary" href="#metodo">
              Ver o protocolo
            </a>
          </div>

          <div className="hero-proof" aria-label="Provas de valor">
            <span>
              <Star size={16} />
              +5 mil mulheres impactadas pela estrutura RV
            </span>
            <span>
              <ShieldCheck size={16} />
              Pagamento seguro via Kiwify
            </span>
          </div>

          <div className="hero-flow" aria-label="Fluxo de entrada">
            {heroFlow.map((item, index) => (
              <span key={item}>
                <strong>{String(index + 1).padStart(2, "0")}</strong>
                {item}
              </span>
            ))}
          </div>
        </div>

        <aside className="hero-offer" aria-label="Resumo da oferta">
          <p>Sua decisão pelos próximos 21 dias</p>
          <strong>8x de R$ 4,74</strong>
          <span>R$ 37,89 à vista</span>
          <small>Parcelamento sujeito a acréscimos da Kiwify.</small>

          <div className="offer-divider" />

          <ul>
            {benefits.map((benefit) => (
              <li key={benefit}>
                <Check size={16} />
                {benefit}
              </li>
            ))}
          </ul>

          <a className="button button-primary" href="#inscricao">
            Garantir minha vaga agora →
          </a>
          <p className="launch-note">⏰ Preço de lançamento por tempo limitado</p>
        </aside>
      </section>

      <section className="section pain-section">
        <div className="section-copy">
          <p className="eyebrow">Você não está sem força</p>
          <h2>Talvez você só esteja cansada de tentar sozinha.</h2>
          <p>
            O TRINCA RV21 foi criado para mulheres que precisam de direção,
            clareza e um ambiente que sustente a decisão até o final.
          </p>
        </div>

        <div className="pain-list">
          {painPoints.map((item) => (
            <div className="pain-item" key={item}>
              <CheckCircle2 size={20} />
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section fit-section">
        <div className="section-copy wide">
          <p className="eyebrow">Decisão com clareza</p>
          <h2>O TRINCA RV21 é para mulheres que querem estrutura, não promessa vazia.</h2>
          <p>
            A proposta é simples: durante 21 dias, você entra em uma rotina
            guiada com treino, alimentação, materiais e um ambiente que ajuda a
            sustentar a decisão.
          </p>
        </div>

        <div className="fit-layout">
          <article className="fit-card fit-card-positive">
            <h3>Faz sentido para você se...</h3>
            <ul>
              {fitItems.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className="fit-card">
            <h3>Importante saber antes de entrar</h3>
            <ul>
              {commitmentItems.map((item) => (
                <li key={item}>
                  <ShieldCheck size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="authority-section">
        <div className="authority-media">
          <Image
            src="/images/ruria.jpg"
            alt="Ruriá Virgínio"
            fill
            sizes="(max-width: 900px) 100vw, 42vw"
            className="authority-photo"
          />
        </div>

        <div className="authority-copy">
          <p className="eyebrow">Por trás do protocolo</p>
          <h2>Ruriá Virgínio</h2>
          <p>
            Criador e idealizador do TRINCA RV21, Ruriá Virgínio reúne 14 anos
            de experiência conduzindo mulheres a reconstruírem autoestima,
            condicionamento, disciplina e confiança com estratégia,
            acompanhamento e constância.
          </p>
          <p>
            O protocolo nasce da vivência prática com transformações reais em
            mais de 10 países, unindo treino, direcionamento e uma experiência
            online organizada para que a participante saiba exatamente o que
            fazer nos próximos 21 dias.
          </p>

          <div className="authority-stats">
            <span>14 anos de experiência</span>
            <span>Transformações reais em +10 países</span>
            <span>Sistematização online de treinos reais e individualizados</span>
            <span>Criador e idealizador do protocolo TRINCA RV21</span>
          </div>
        </div>
      </section>

      <section className="section method-section" id="metodo">
        <div className="section-copy wide">
          <p className="eyebrow">A estrutura do desafio</p>
          <h2>O que você recebe dentro do TRINCA RV21</h2>
          <p>
            Um processo enxuto, intenso e possível de seguir. Não é só sobre
            perder peso: é sobre voltar a agir por você.
          </p>
        </div>

        <div className="pillar-grid">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <article className="pillar-card" key={pillar.title}>
                <Icon size={26} />
                <h3>{pillar.title}</h3>
                <p>{pillar.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section proof-gallery-section">
        <div className="section-copy wide">
          <p className="eyebrow">Antes e depois</p>
          <h2>Provas visuais de mulheres que decidiram seguir direção.</h2>
          <p>
            Transformações reais compartilhadas por alunas da estrutura RV,
            com trajetórias diferentes e o mesmo ponto em comum: constância.
          </p>
        </div>

        <div className="proof-gallery">
          {proofGallery.map((item) => (
            <figure className="proof-card" key={item.image}>
              <Image
                src={`/images/${item.image}`}
                alt={`${item.name}, ${item.age}: ${item.result}`}
                fill
                sizes="(max-width: 820px) 50vw, 28vw"
                className="proof-photo"
              />
              <figcaption>
                <strong>
                  {item.name}, {item.age}
                </strong>
                <span>{item.result}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="section journey-section">
        <div className="section-copy">
          <p className="eyebrow">Jornada organizada</p>
          <h2>Do cadastro ao grupo oficial, cada etapa tem função.</h2>
          <p>
            A experiência foi desenhada para acompanhar sua decisão desde a
            inscrição até a entrada no grupo, com orientação clara, retomada
            quando necessário e uma recepção cuidadosa após a confirmação.
          </p>
        </div>

        <div className="journey-list">
          {journey.map((item) => (
            <article className="journey-item" key={item.step}>
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section guided-section">
        <div className="section-copy wide">
          <p className="eyebrow">Experiência premium por dentro</p>
          <h2>Depois da compra, nada chega fora de ordem.</h2>
          <p>
            A entrada no TRINCA RV21 foi desenhada para reduzir ansiedade e
            aumentar adesão. Cada mensagem tem uma função: confirmar, orientar,
            entregar e só então abrir o ambiente oficial.
          </p>
        </div>

        <div className="guided-layout">
          <div className="guided-panel">
            <span>Fluxo protegido</span>
            <strong>2 cliques de confirmação</strong>
            <p>
              Antes dos vídeos e antes do grupo, a aluna confirma que está
              pronta. Isso mantém a experiência humana, organizada e segura.
            </p>
          </div>

          <div className="guided-grid">
            {guidedExperience.map((item) => {
              const Icon = item.icon;

              return (
                <article className="guided-card" key={item.title}>
                  <Icon size={24} />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="results-section" id="resultados">
        <div className="section-copy wide">
          <p className="eyebrow">Resultados reais</p>
          <h2>Mulheres reais, histórias reais e uma decisão em comum.</h2>
          <p>
            Resultados reais elevam confiança e mostram que a transformação é
            possível quando existe protocolo, acompanhamento e compromisso.
          </p>
        </div>

        <div className="results-marquee" aria-label="Galeria de resultados reais">
          <div className="results-track">
          {marqueeResults.map((image, index) => (
            <figure className="result-card" key={`${image}-${index}`}>
              <Image
                src={`/images/${image}`}
                alt={`Resultado real RV ${index + 1}`}
                fill
                sizes="(max-width: 700px) 82vw, (max-width: 1100px) 30vw, 22vw"
                className="result-photo"
              />
            </figure>
          ))}
          </div>
        </div>

        <p className="results-note">
          As imagens representam trajetórias reais compartilhadas com a estrutura
          RV. Resultados variam conforme rotina, execução, alimentação, contexto
          individual e constância.
        </p>
      </section>

      <section className="section offer-section" id="oferta">
        <div className="offer-copy">
          <p className="eyebrow">Inscrições abertas</p>
          <h2>Entre para o TRINCA RV21</h2>
          <p>
            Um investimento acessível para transformar tentativa em direção,
            rotina em constância e esforço em resultado visível.
          </p>

          <div className="price-row">
            <div>
              <span>Investimento de entrada no desafio</span>
              <strong>8x de R$ 4,74</strong>
              <small>R$ 37,89 à vista. Parcelamento sujeito a acréscimos da Kiwify.</small>
            </div>
            <WalletCards size={34} />
          </div>

          <div className="bonus-list">
            {bonuses.map((bonus) => (
              <span key={bonus}>
                <Gift size={16} />
                {bonus}
              </span>
            ))}
          </div>

          <div className="offer-flow" aria-label="O que acontece depois da inscrição">
            <h3>O que acontece depois que você entra</h3>
            <ol>
              {offerFlow.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>
        </div>

        <form
          className="lead-form"
          id="inscricao"
          onFocus={() => {
            if (formStarted.current) {
              return;
            }

            formStarted.current = true;
            trackCustomEvent("FormStart", {
              content_name: "TRINCA RV21 - formulario landing",
              content_category: "lead_capture",
            });
            gaTrackEvent("form_start", {
              content_name: "TRINCA RV21 - formulario landing",
              content_category: "lead_capture",
            });
          }}
          onSubmit={handleLeadSubmit}
        >
          <p className="form-kicker">Inscrição rápida</p>
          <h3>Preencha para garantir sua entrada no desafio.</h3>
          <p>
            Seus dados permitem acompanhar sua inscrição, orientar os próximos
            passos e retomar sua decisão caso você pare antes de finalizar.
          </p>

          <label>
            Nome completo
            <input type="text" name="nome" placeholder="Seu nome completo" required />
          </label>

          <label>
            Melhor e-mail
            <input type="email" name="email" placeholder="voce@email.com" required />
          </label>

          <label>
            WhatsApp com DDD
            <input type="tel" name="whatsapp" placeholder="(84) 99999-9999" required />
          </label>

          <fieldset className="objective-field">
            <legend>Principal objetivo</legend>
            <div className="objective-options">
              {objectiveOptions.map((option) => (
                <label className="objective-option" key={option.value}>
                  <input type="radio" name="objetivo" value={option.value} required />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="consent">
            <input type="checkbox" required />
            <span>
              Autorizo receber mensagens sobre minha inscrição, pagamento,
              orientações do TRINCA RV21 e próximos passos pelo WhatsApp e
              e-mail.
            </span>
          </label>

          {submitError ? <p className="form-error">{submitError}</p> : null}

          <button className="button button-primary form-submit" type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Garantir minha vaga agora →"}
          </button>

          <p className="launch-note form-launch-note">⏰ Preço de lançamento por tempo limitado</p>

          <small>
            Depois da aprovação, você recebe a sequência individual de
            boas-vindas, materiais e só então o link do grupo oficial.
          </small>
        </form>
      </section>

      <section className="after-section">
        <div className="section-copy wide">
          <p className="eyebrow">Depois da compra</p>
          <h2>O pagamento aprovado abre uma experiência de entrada completa.</h2>
        </div>

        <div className="after-grid">
          <article>
            <MessageCircle size={26} />
            <h3>Confirmação da inscrição</h3>
            <p>
              Assim que o pagamento for aprovado, a aluna recebe a confirmação
              de entrada e os próximos passos do desafio.
            </p>
          </article>
          <article>
            <Video size={26} />
            <h3>Apresentação do protocolo</h3>
            <p>
              Um vídeo de boas-vindas do criador e idealizador do TRINCA RV21,
              Ruriá Virgínio, explicando a proposta, o compromisso dos 21 dias
              e como aproveitar melhor a jornada.
            </p>
          </article>
          <article>
            <FileText size={26} />
            <h3>Dieta específica e ebooks</h3>
            <p>
              Dieta direcionada ao objetivo da participante, elaborada por
              nutricionista, além dos materiais de apoio.
            </p>
          </article>
          <article>
            <CalendarDays size={26} />
            <h3>Cupom pós-desafio</h3>
            <p>Liberação do TRINCA PREMIUM50% apenas após a finalização.</p>
          </article>
        </div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-copy wide">
          <p className="eyebrow">Dúvidas frequentes</p>
          <h2>Antes de entrar, veja o que você precisa saber.</h2>
        </div>

        <div className="faq-list">
          {faqItems.map((item) => (
            <article className="faq-item" key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <Sparkles size={34} />
        <h2>Você pode continuar adiando sua transformação ou começar agora.</h2>
        <p>
          O TRINCA RV21 foi criado para mulheres que decidiram parar de se
          abandonar e voltar a agir com direção.
        </p>
        <a className="button button-primary" href="#inscricao">
          Garantir minha vaga agora →
        </a>
        <p className="launch-note">⏰ Preço de lançamento por tempo limitado</p>
      </section>

      <footer className="footer">
        <div>
          <strong>TRINCA RV21</strong>
          <p>Desafio feminino oficial da sistematização online RV.</p>
        </div>
        <span>© 2026 Ruriá Virgínio. Todos os direitos reservados.</span>
      </footer>

    </main>
  );
}
