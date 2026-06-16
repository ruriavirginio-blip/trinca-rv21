"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Check, Lock, Play, X } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
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

const WHATSAPP_NUMBER = "5584998567078";
const WHATSAPP_MESSAGE =
  "Quero garantir minha vaga no TRINCA RV21. Ja preenchi minha inscricao na landing page.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE,
)}`;
const CHECKOUT_URL = process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL || WHATSAPP_URL;
const PRODUCT_PRICE = 37.89;

const includedItems = [
  "Treinos direcionados para 21 dias",
  "Dieta específica por objetivo (nutricionista)",
  "Grupo exclusivo com direcionamento",
  "Check-ins para manter constância",
  "Ebook RV + Ebook Nutricional",
  "Cupom 50% pós-desafio (TRINCA PREMIUM)",
];

const painBullets = [
  "Tentou várias dietas e nenhuma funcionou",
  "Começa motivada e para na primeira semana",
  "Quer resultado mas não quer sofrimento",
];

const proofBadges = ["⭐ +5.000 mulheres", "🔒 Kiwify", "📅 14 anos"];

const studentVideos = [
  {
    id: "jessica",
    name: "Depoimento Jessica",
    result: "Vídeo real preservado",
    quote: "Depoimento em vídeo da aluna.",
    src: "/media/depoimento-jessica.mp4",
    poster: "/images/depoimento-jessica-poster.jpg",
  },
  {
    id: "coletivo",
    name: "Alunas RV",
    result: "Depoimentos reais preservados",
    quote: "Registros em vídeo das alunas.",
    src: "/media/depoimento-coletivo.mp4",
    poster: "/images/depoimento-coletivo-poster.jpg",
  },
  {
    id: "resultado",
    name: "Antes/depois real",
    result: "Imagem real preservada",
    quote: "Registro visual de resultado.",
    fallbackImage: "/images/antesdepoo.jpg",
  },
];

const emotionalPain = [
  "Você se olha no espelho e não se reconhece.",
  "Você começa animada, mas perde ritmo quando a rotina aperta.",
  "Sente que precisa emagrecer, desinchar e voltar a gostar das fotos.",
  "Já tentou sozinha, mas faltou direção, cobrança e suporte real.",
  "Quer resultado, mas não quer um plano impossível de seguir.",
  "Sente vergonha de como está e evita espelhos e fotos.",
  "Já perdeu a conta de quantas segundas-feiras você recomeçou.",
];

const personas = [
  {
    icon: "🎯",
    name: "RENATA",
    title: "Iniciante Frustrada",
    text: "Já tentou de tudo. Quer protocolo real, com suporte, que respeite sua rotina.",
  },
  {
    icon: "💎",
    name: "RAYANE",
    title: "Premium Aspiracional",
    text: "Sabe o que quer. Busca método sério, resultado estético visível e exclusividade.",
  },
  {
    icon: "⚡",
    name: "GUERREIRA",
    title: "Sedentária que Decidiu",
    text: "Saiu do zero. Precisa de estrutura simples, motivação e alguém que acredite nela.",
  },
];

const protocolSteps = [
  {
    title: "Você se inscreve e escolhe seu objetivo",
    text: "Perder barriga, definir glúteos ou emagrecimento geral — você decide o foco.",
  },
  {
    title: "Recebe boas-vindas + vídeo pessoal do Ruriá",
    text: "Não é automação fria. É direcionamento personalizado desde o primeiro momento.",
  },
  {
    title: "Dieta específica por nutricionista",
    text: "Elaborada para o SEU objetivo. Não genérica. Não impossível.",
  },
  {
    title: "Treinos + Ebooks + suporte no grupo",
    text: "21 dias com estrutura diária. Você só precisa aparecer.",
  },
  {
    title: "Você conclui e recebe cupom 50%",
    text: "Para continuar na sistematização completa com desconto exclusivo.",
  },
];

const authorityStats = [
  { value: "+5.000", label: "mulheres transformadas" },
  { value: "14 anos", label: "de experiência" },
  { value: "+10", label: "países de alcance" },
  { value: "21 dias", label: "de resultado comprovado" },
];

const faqItems = [
  {
    question: "Funciona para quem não tem academia?",
    answer: "Sim. Os treinos foram desenvolvidos para casa ou academia. Você escolhe.",
  },
  {
    question: "Tenho que fazer dieta muito restrita?",
    answer: "Não. A dieta é elaborada por nutricionista e respeita sua realidade. É guiada, não punitiva.",
  },
  {
    question: "Quanto tempo preciso por dia?",
    answer: "30 a 45 minutos. Menos tempo do que você passa no Instagram.",
  },
  {
    question: "Funciona para menopausa / após os 40?",
    answer: "Sim. Mais de 40% das participantes têm 40+. O protocolo respeita seu metabolismo.",
  },
  {
    question: "É muito barato, será que é sério?",
    answer:
      "R$37,89 é o preço de entrada, não o valor do que você recebe. Quem completa recebe cupom 50% para a próxima etapa.",
  },
  {
    question: "Como recebo o conteúdo?",
    answer:
      "Via WhatsApp. Imediatamente após confirmação do pagamento você recebe boas-vindas, vídeo pessoal do Ruriá, dieta e acesso ao grupo.",
  },
];

const objectiveOptions = [
  { value: "emagrecimento-barriga", label: "Perder barriga" },
  { value: "gluteos", label: "Definir glúteos e pernas" },
  { value: "emagrecimento-geral", label: "Perder peso geral" },
  { value: "autoestima", label: "Ganhar disposição e autoestima" },
];

function buildLeadTracking() {
  if (typeof window === "undefined") return "";

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
  if (typeof window === "undefined") return CHECKOUT_URL;

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

function VideoProofCard({
  video,
  isPlaying,
  onPlay,
}: {
  video: (typeof studentVideos)[number];
  isPlaying: boolean;
  onPlay: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  async function handlePlay() {
    onPlay();
    await videoRef.current?.play();
  }

  return (
    <article className="rv-video-card result-card fade-in">
      <div className="rv-video-frame">
        {video.src ? (
          <>
            <video
              ref={videoRef}
              poster={video.poster}
              playsInline
              preload="metadata"
              controls={isPlaying}
            >
              <source src={video.src} type="video/mp4" />
            </video>
            {!isPlaying ? (
              <button className="rv-play-button" type="button" onClick={handlePlay} aria-label={`Assistir ${video.name}`}>
                <Play size={24} fill="currentColor" />
              </button>
            ) : null}
          </>
        ) : (
          <Image
            src={video.fallbackImage || "/images/antesdepoo.jpg"}
            alt={`Resultado real de ${video.name}`}
            fill
            sizes="(max-width: 820px) 92vw, 30vw"
            className="rv-fallback-proof"
          />
        )}
      </div>
      <div className="rv-video-info">
        <strong>{video.name}</strong>
        <span>{video.result}</span>
        <p>“{video.quote}”</p>
      </div>
    </article>
  );
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [playingVideo, setPlayingVideo] = useState("");
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
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    function handleScroll() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;

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
    document.querySelectorAll(".fade-in").forEach((element) => observer.observe(element));
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
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
        headers: { "Content-Type": "application/json" },
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
      setSubmitError("Nao consegui registrar sua inscricao agora. Clique no WhatsApp para continuar.");
      setLoading(false);
    }
  }

  return (
    <main className="rv-page">
      <div className="rv-announcement">
        <span>🔥 Pré-lançamento • Inscrições abertas • Preço de lançamento por tempo limitado</span>
      </div>

      <header className="rv-nav">
        <a className="rv-logo" href="#top">TRINCA RV21</a>
        <nav aria-label="Navegação principal">
          <a href="#protocolo">Protocolo</a>
          <a href="#resultados">Resultados</a>
          <a href="#oferta">Oferta</a>
          <a href="#faq">Dúvidas</a>
        </nav>
        <a className="rv-nav-cta" href="#inscricao">Garantir vaga →</a>
      </header>

      <section className="rv-hero fade-in" id="top">
        <div className="rv-hero-copy fade-in">
          <span className="rv-badge">Desafio feminino oficial RV</span>
          <h1>
            21 dias para
            <br />
            sair do ciclo de
            <br />
            <em>começar e desistir.</em>
          </h1>
          <p>
            O Protocolo RV que transformou +5.000 mulheres em 14 anos.
            Agora num desafio de 21 dias com treino, dieta e suporte real.
          </p>

          <div className="rv-pain-bullets">
            {painBullets.map((item) => (
              <span key={item}>
                <X size={16} />
                {item}
              </span>
            ))}
          </div>

          <div className="rv-hero-actions">
            <a className="rv-button rv-button-primary cta-primary" href="#inscricao">Quero entrar no TRINCA RV21 →</a>
            <a className="rv-button rv-button-secondary" href="#protocolo">Ver o protocolo ↓</a>
          </div>

          <CountdownTimer />

          <div className="rv-proof-badges">
            {proofBadges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        </div>

        <figure className="rv-hero-photo fade-in" aria-label="Ruriá Virgínio, criador do Protocolo RV">
          <Image
            src="/images/hero-ruria.jpg"
            alt="Ruriá Virgínio"
            fill
            priority
            sizes="(max-width: 980px) 92vw, 31vw"
            className="rv-hero-image"
          />
          <span>🔥 Pré-lançamento</span>
        </figure>

        <aside className="rv-price-card fade-in">
          <span>Sua decisão pelos próximos 21 dias</span>
          <del>De R$ 97,00</del>
          <strong>R$ 37,89</strong>
          <small>à vista</small>
          <p>ou 8x de R$ 4,74</p>
          <small>Parcelamento sujeito a acréscimos Kiwify</small>

          <div className="rv-card-divider" />

          <ul>
            {includedItems.map((item) => (
              <li key={item}>
                <Check size={16} />
                {item}
              </li>
            ))}
          </ul>

          <a className="rv-button rv-button-solid cta-primary" href="#inscricao">Quero entrar no TRINCA RV21 →</a>
          <footer>🔒 Preço de lançamento por tempo limitado</footer>
        </aside>
      </section>

      <section className="rv-section rv-video-section fade-in" id="resultados">
        <div className="rv-section-head">
          <span>PROVAS REAIS</span>
          <h2>Elas duvidavam. Hoje agradecem.</h2>
        </div>
        <div className="rv-video-grid">
          {studentVideos.map((video) => (
            <VideoProofCard
              key={video.id}
              video={video}
              isPlaying={playingVideo === video.id}
              onPlay={() => setPlayingVideo(video.id)}
            />
          ))}
        </div>
      </section>

      {/* WALL OF PROOF — aguardando screenshots reais de WhatsApp/DM do Ruriá. */}

      <section className="rv-section rv-pain-section fade-in">
        <div>
          <span className="rv-label">VOCÊ NÃO ESTÁ SEM FORÇA</span>
          <h2>
            Talvez você só esteja
            <br />
            no método errado.
          </h2>
          <p>
            O TRINCA RV21 foi criado para quem já tentou. Para quem conhece a sensação de começar na
            segunda animada e parar na quarta sem entender por quê. O problema nunca foi você.
          </p>
        </div>
        <div className="rv-pain-card-list">
          {emotionalPain.map((item) => (
            <article className="fade-in" key={item}>{item}</article>
          ))}
        </div>
      </section>

      <section className="rv-section rv-persona-section fade-in">
        <div className="rv-section-head">
          <span>DECISÃO COM CLAREZA</span>
          <h2>O TRINCA RV21 é para mulheres que querem estrutura, não mais uma promessa.</h2>
        </div>
        <div className="rv-persona-grid">
          {personas.map((persona) => (
            <article className="rv-persona-card result-card fade-in" key={persona.name}>
              <span>{persona.icon}</span>
              <h3>{persona.name}</h3>
              <strong>{persona.title}</strong>
              <p>{persona.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rv-section rv-protocol-section fade-in" id="protocolo">
        <div className="rv-section-head">
          <span>O MÉTODO RV</span>
          <h2>21 dias com direção real. Não mais tentativas no escuro.</h2>
        </div>
        <div className="rv-timeline">
          {protocolSteps.map((step, index) => (
            <article className="rv-timeline-item fade-in" key={step.title}>
              <span>{index + 1}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rv-section rv-authority-section fade-in">
        <div className="rv-authority-photo">
          <Image
            src="/images/ruria.jpg"
            alt="Ruriá Virgínio"
            fill
            sizes="(max-width: 900px) 100vw, 40vw"
            className="rv-authority-image"
          />
          <b>14 anos</b>
        </div>
        <div className="rv-authority-copy">
          <span className="rv-label">QUEM CRIA O PROTOCOLO</span>
          <h2>Ruriá Virgínio</h2>
          <p className="rv-authority-sub">Personal Trainer • Natal/RN • Criador do Protocolo RV</p>
          <div className="rv-stat-grid">
            {authorityStats.map((stat) => (
              <article className="fade-in" key={stat.label}>
                <strong className="stat-number">{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
          <p>
            Em 14 anos transformando mulheres, aprendi que o maior obstáculo não é o corpo — é o
            método errado. O Protocolo RV existe porque eu vi, pessoalmente, o que funciona e o que
            desperdiça tempo e energia das mulheres.
          </p>
        </div>
      </section>

      <section className="rv-section rv-offer-section fade-in" id="oferta">
        <div className="rv-section-head">
          <span>SUA DECISÃO</span>
          <h2>21 dias. Um protocolo real. O preço de uma pizza.</h2>
        </div>

        <div className="rv-final-offer-card">
          <h3>TRINCA RV21</h3>
          <span className="rv-old-price">De R$ 97,00</span>
          <strong>R$ 37,89</strong>
          <small>à vista</small>
          <p>ou 8x de R$ 4,74</p>
          <ul>
            {includedItems.map((item) => (
              <li key={item}>
                <Check size={16} />
                {item}
              </li>
            ))}
          </ul>
          <a className="rv-button rv-button-primary rv-offer-button cta-primary" href="#inscricao">
            Quero entrar no TRINCA RV21 →
          </a>
          <footer>
            <span>🔒 Pagamento 100% seguro via Kiwify</span>
            <span>💳 Cartão, PIX ou boleto</span>
          </footer>
        </div>
      </section>

      <section className="rv-section rv-form-section fade-in" id="inscricao">
        <div className="rv-form-copy">
          <span className="rv-label">INSCRIÇÃO RÁPIDA</span>
          <h2>Escolha seu objetivo e garanta o preço de lançamento.</h2>
          <p>
            Esse campo alimenta a dieta que você recebe depois da compra. Escolha o foco real dos
            próximos 21 dias.
          </p>
        </div>
        <form
          className="rv-lead-form"
          onFocus={() => {
            if (formStarted.current) return;

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
          <fieldset>
            <legend>Principal objetivo</legend>
            <div className="rv-objectives">
              {objectiveOptions.map((option) => (
                <label key={option.value}>
                  <input type="radio" name="objetivo" value={option.value} required />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="rv-consent">
            <input type="checkbox" required />
            <span>Autorizo receber mensagens sobre inscrição, pagamento e próximos passos pelo WhatsApp e e-mail.</span>
          </label>
          {submitError ? <p className="rv-form-error">{submitError}</p> : null}
          <button className="rv-button rv-button-primary rv-submit cta-primary" type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Quero entrar no TRINCA RV21 →"}
          </button>
          <small>
            <Lock size={13} />
            Pagamento seguro via Kiwify após o cadastro.
          </small>
        </form>
      </section>

      <section className="rv-section rv-faq-section fade-in" id="faq">
        <div className="rv-section-head">
          <span>DÚVIDAS</span>
          <h2>Perguntas antes de entrar.</h2>
        </div>
        <div className="rv-faq-list">
          {faqItems.map((item) => (
            <details className="fade-in" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="rv-footer">
        <strong>TRINCA RV21</strong>
        <nav>
          <a href="#protocolo">Protocolo</a>
          <a href="#oferta">Oferta</a>
          <a href="#faq">Dúvidas</a>
        </nav>
        <span>© 2026 Ruriá Virgínio</span>
      </footer>
    </main>
  );
}
