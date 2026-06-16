"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Check, Lock, Play } from "lucide-react";
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
  "Treinos progressivos adaptados ao seu nível",
  "Alimentação com estrutura, sem dieta maluca",
  "Acompanhamento diário via grupo exclusivo",
  "Análise comportamental individualizada",
];

const painCards = [
  "😔 Começa segunda animada, na quarta some",
  "😩 Já tentou tudo e nada durou mais de 2 semanas",
  "😤 Se olha no espelho e não reconhece mais seu corpo",
];

const methodItems = [
  "Treinos progressivos adaptados ao seu nível",
  "Alimentação com estrutura (sem dieta maluca)",
  "Acompanhamento diário via grupo exclusivo",
  "Análise comportamental individualizada (só no RV)",
];

const proofStats = [
  { value: 5000, suffix: "+", prefix: "", label: "mulheres transformadas", display: "+5.000" },
  { value: 14, suffix: " anos", prefix: "", label: "de experiência", display: "14 anos" },
  { value: 10, suffix: "+", prefix: "", label: "de atuação", display: "+10 países" },
];

const transformationImages = [
  "/images/antesdepois.jpg",
  "/images/antesdepoiss.jpg",
  "/images/antesdepoisss.jpg",
  "/images/antesdepoissss.jpg",
  "/images/antesdepoissssss.jpg",
  "/images/antesdepo.jpg",
  "/images/antesdepoi.jpg",
  "/images/antesdepoii.jpg",
  "/images/antesdepoiii.jpg",
  "/images/antesdepoiiii.jpg",
  "/images/antesdepoo.jpg",
  "/images/aluna-1.jpg",
  "/images/aluna-2.jpg",
  "/images/aluna-3.jpg",
];

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

const authorityBullets = [
  "Personal trainer certificado",
  "+5.000 alunas em mais de 10 países",
  "Criador do PROTOCOLO RV (método exclusivo)",
  "Especialista em transformação estética feminina",
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

function CountUpStat({ stat }: { stat: (typeof proofStats)[number] }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const statRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = statRef.current;
    if (!element || started) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        setStarted(true);
        const duration = 1100;
        const start = performance.now();

        function frame(now: number) {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(stat.value * eased));

          if (progress < 1) {
            window.requestAnimationFrame(frame);
          }
        }

        window.requestAnimationFrame(frame);
        observer.disconnect();
      },
      { threshold: 0.4 },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [started, stat.value]);

  const value =
    stat.value >= 1000
      ? `+${new Intl.NumberFormat("pt-BR").format(count)}`
      : stat.display.includes("países")
        ? `+${count} países`
        : `${count}${stat.suffix}`;

  return (
    <article ref={statRef}>
      <strong>{started ? value : stat.display}</strong>
      <span>{stat.label}</span>
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
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
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
      <header className="rv-nav">
        <a className="rv-logo" href="#top">TRINCA RV21</a>
        <nav aria-label="Navegação principal">
          <a href="#metodo">Método</a>
          <a href="#resultados">Resultados</a>
          <a href="#oferta">Oferta</a>
          <a href="#faq">Dúvidas</a>
        </nav>
        <a className="rv-nav-cta" href="#inscricao">Entrar agora</a>
      </header>

      <section className="rv-hero" id="top">
        <div className="rv-hero-copy">
          <span className="rv-badge">✦ 14 anos · +5.000 mulheres transformadas</span>
          <h1>
            Você não falhou.
            <br />
            O método falhou
            <br />
            por você.
          </h1>
          <p>
            Em 21 dias, com o Protocolo RV, você finalmente tem direção — não promessa.
          </p>

          <figure className="rv-hero-photo" aria-label="Ruriá Virgínio, criador do Protocolo RV">
            <Image
              src="/images/hero-ruria.jpg"
              alt="Ruriá Virgínio"
              fill
              priority
              sizes="(max-width: 980px) 92vw, 480px"
              className="rv-hero-image"
            />
          </figure>
        </div>

        <aside className="rv-price-card">
          <del>De R$ 97,00</del>
          <strong>R$ 37,89</strong>
          <p>ou 8x de R$ 4,74</p>
          <a className="rv-button rv-button-primary cta-primary" href="#inscricao">Quero entrar no desafio agora</a>
          <footer>🔒 Pagamento seguro · Acesso imediato</footer>
        </aside>
      </section>

      <section className="rv-section rv-pain-section">
        <div className="rv-section-head">
          <h2>Você se identifica com isso?</h2>
        </div>
        <div className="rv-pain-grid">
          {painCards.map((item) => (
            <article key={item}>{item}</article>
          ))}
        </div>
        <p className="rv-center-copy">
          Se você marcou sim pra qualquer um desses — o TRINCA RV21 foi feito pra você.
        </p>
      </section>

      <section className="rv-section rv-method-section" id="metodo">
        <div className="rv-method-copy">
          <span className="rv-badge">✦ O que é o TRINCA RV21</span>
          <h2>21 dias. Protocolo real. Resultado visível.</h2>
          <p>
            O plano foi desenhado para mulheres reais: rotina corrida, corpo cansado de tentativas soltas
            e vontade de voltar a se reconhecer no espelho.
          </p>
        </div>
        <div className="rv-method-list">
          {methodItems.map((item) => (
            <article key={item}>
              <span>▸</span>
              {item}
            </article>
          ))}
        </div>
      </section>

      <section className="rv-section rv-proof-section" id="resultados">
        <div className="rv-section-head">
          <h2>Elas duvidavam. Hoje agradecem.</h2>
        </div>

        <div className="rv-proof-stats">
          {proofStats.map((stat) => (
            <CountUpStat key={stat.label} stat={stat} />
          ))}
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

        <div className="rv-masonry-grid" aria-label="Transformações reais de alunas">
          {transformationImages.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt={`Transformação real TRINCA RV21 ${index + 1}`}
              width={520}
              height={index % 3 === 0 ? 740 : index % 3 === 1 ? 620 : 680}
              sizes="(max-width: 720px) 46vw, 30vw"
              loading="lazy"
            />
          ))}
        </div>

        <div className="rv-proof-cta">
          <h3>Você pode ser a próxima.</h3>
          <a className="rv-button rv-button-primary cta-primary" href={CHECKOUT_URL}>Quero minha transformação</a>
        </div>
      </section>

      <section className="rv-section rv-authority-section">
        <div className="rv-authority-photo">
          <Image
            src="/images/ruria-sobre.jpg"
            alt="Ruriá Virgínio"
            fill
            sizes="(max-width: 900px) 92vw, 400px"
            className="rv-authority-image"
          />
        </div>
        <div className="rv-authority-copy">
          <h2>
            Sou Ruriá Virgínio.
            <br />
            14 anos transformando mulheres reais.
          </h2>
          <ul>
            {authorityBullets.map((item) => (
              <li key={item}>
                <span>✦</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rv-section rv-offer-section" id="oferta">
        <div className="rv-section-head">
          <h2>Comece hoje. Sem desculpa.</h2>
        </div>

        <div className="rv-final-offer-card">
          <h3>TRINCA RV21</h3>
          <span className="rv-old-price">De R$ 97,00</span>
          <strong>R$ 37,89</strong>
          <p>ou 8x de R$ 4,74</p>
          <CountdownTimer />
          <ul>
            {includedItems.map((item) => (
              <li key={item}>
                <Check size={16} />
                {item}
              </li>
            ))}
          </ul>
          <a className="rv-button rv-button-primary rv-offer-button cta-primary" href="#inscricao">
            Quero entrar no desafio agora
          </a>
          <footer>
            <span>🔒 Pagamento 100% seguro via Kiwify</span>
            <span>Vagas limitadas por turma</span>
          </footer>
        </div>
      </section>

      <section className="rv-section rv-form-section" id="inscricao">
        <div className="rv-form-copy">
          <span className="rv-label">INSCRIÇÃO RÁPIDA</span>
          <h2>Escolha seu objetivo e entre no TRINCA RV21.</h2>
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
            {loading ? "Enviando..." : "Quero entrar no desafio agora"}
          </button>
          <small>
            <Lock size={13} />
            Pagamento seguro via Kiwify após o cadastro.
          </small>
        </form>
      </section>

      <section className="rv-section rv-faq-section" id="faq">
        <div className="rv-section-head">
          <h2>Perguntas antes de entrar.</h2>
        </div>
        <div className="rv-faq-list">
          {faqItems.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="rv-footer">
        <strong>TRINCA RV21</strong>
        <nav>
          <a href="#metodo">Método</a>
          <a href="#oferta">Oferta</a>
          <a href="#faq">Dúvidas</a>
        </nav>
        <span>© 2026 Ruriá Virgínio</span>
      </footer>
    </main>
  );
}
