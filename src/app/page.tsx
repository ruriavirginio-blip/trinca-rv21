"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Check, Lock, Play } from "lucide-react";
import { CountdownTimer } from "@/components/CountdownTimer";
import { PhotoMarquee } from "@/components/PhotoMarquee";
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

const heroOfferItems = [
  "Treino direcionado para casa ou academia",
  "Dieta específica por objetivo",
  "Grupo exclusivo com acompanhamento",
  "Check-ins para não sumir no meio",
  "Ebook RV + orientação de próximos passos",
  "Cupom TRINCA para a próxima etapa",
];

const identityCards = [
  {
    title: "Você começa animada e se perde no meio.",
    text: "O RV21 reduz a decisão diária: você sabe exatamente o treino, a alimentação e o próximo passo.",
  },
  {
    title: "Você já tentou dieta, treino e promessa.",
    text: "A diferença aqui é estrutura: uma sequência curta, guiada e feita para mulheres com rotina real.",
  },
  {
    title: "Você quer resultado sem virar outra pessoa.",
    text: "Sem radicalismo. O foco é constância, estética, disposição e confiança no corpo que você vê no espelho.",
  },
];

const DORES = [
  { emoji: '😔', text: 'Começa segunda animada, na quarta some' },
  { emoji: '😩', text: 'Já tentou tudo e nada durou mais de 2 semanas' },
  { emoji: '😞', text: 'Se olha no espelho e não reconhece mais seu corpo' },
  { emoji: '😤', text: 'Treina e acha que não tá adiantando nada' },
  { emoji: '😰', text: 'Tem vergonha de tirar foto mesmo de biquíni' },
  { emoji: '😓', text: 'Dieta nova todo mês, resultado zero' },
  { emoji: '🫠', text: 'Sente que todo mundo tem resultado menos você' },
  { emoji: '😞', text: 'Parou de acreditar que seu corpo pode mudar' },
]

const METODO_ITENS = [
  { icon: '🏋️', titulo: 'Treinos progressivos adaptados ao seu nível', desc: '30 a 45 minutos por dia. Progressivo e feito para quem tem rotina corrida.' },
  { icon: '🥗', titulo: 'Alimentação com estrutura (sem dieta maluca)', desc: 'Sem proibições radicais. Um plano real, feito por nutricionista, que você consegue seguir.' },
  { icon: '💬', titulo: 'Acompanhamento diário via grupo exclusivo', desc: 'Grupo privado no WhatsApp com suporte diário. Você não faz o desafio sozinha.' },
  { icon: '🧠', titulo: 'Análise comportamental individualizada (só no RV)', desc: 'Identificamos o padrão que te fez desistir antes e trabalhamos em cima dele.' },
]

const proofStats = [
  { value: 5000, suffix: "+", prefix: "", label: "mulheres transformadas", display: "+5.000" },
  { value: 14, suffix: " anos", prefix: "", label: "de experiência", display: "14 anos" },
  { value: 10, suffix: "+", prefix: "", label: "de atuação", display: "+10 países" },
];

type StudentVideo = {
  fallbackImage?: string;
  id: string;
  name: string;
  poster?: string;
  quote: string;
  result: string;
  src?: string;
};

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

const studentVideos: StudentVideo[] = [
  {
    id: "jessica",
    name: "Depoimento Jessica",
    result: "DEPOIMENTO REAL",
    quote: "Depoimento em vídeo da aluna.",
    src: "/media/depoimento-jessica.mp4",
    poster: "/images/depoimento-jessica-poster.jpg",
  },
  {
    id: "coletivo",
    name: "Alunas RV",
    result: "ANTES & DEPOIS",
    quote: "Registros em vídeo das alunas.",
    src: "/media/depoimento-coletivo.mp4",
    poster: "/images/depoimento-coletivo-poster.jpg",
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
  video: StudentVideo;
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

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".rv-transform-card"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target as HTMLElement;
          const delay = Number(element.dataset.index || 0) * 80;
          window.setTimeout(() => {
            element.classList.add("is-visible");
          }, delay);
          observer.unobserve(element);
        });
      },
      { threshold: 0.18 },
    );

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  // Camada premium: revelacao suave de secoes/cards ao rolar (progressivo e seguro).
  useEffect(() => {
    const page = document.querySelector<HTMLElement>(".rv-page");
    if (!page) return;
    const selector =
      ".rv-section, .rv-form-section, .rv-faq-section, .rv-video-card, .rv-authority-photo, .rv-objectives, .rv-section-head, .rv-offer-button";
    const targets = Array.from(document.querySelectorAll<HTMLElement>(selector));
    if (!targets.length) return;
    targets.forEach((el, i) => {
      el.classList.add("rv-reveal");
      el.style.setProperty("--rv-reveal-delay", `${Math.min(i % 4, 3) * 70}ms`);
    });
    page.classList.add("rv-anim-on");
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("rv-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
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
      <header className="rv-nav rv4-nav">
        <a className="rv-logo" href="#top">TRINCA RV21</a>
        <nav aria-label="Navegação principal">
          <a href="#metodo">Protocolo</a>
          <a href="#resultados">Resultados</a>
          <a href="#oferta">Oferta</a>
          <a href="#faq">Dúvidas</a>
        </nav>
        <a className="rv-nav-cta" href="#inscricao">Entrar agora</a>
      </header>

      <section className="rv4-hero" id="top">
        <div className="rv4-hero-bg" aria-hidden="true" />
        <div className="rv4-hero-grid">
          <div className="rv4-hero-copy">
            <p className="rv4-kicker">Protocolo RV21 · 21 dias · turma aberta</p>
            <h1>
              Volte a se reconhecer no espelho.
              <span> Com direção diária por 21 dias.</span>
            </h1>
            <p className="rv4-lead">
              Para mulheres que cansaram de começar forte e sumir no meio. O TRINCA RV21 entrega treino,
              alimentação e acompanhamento para você executar sem adivinhar.
            </p>
            <div className="rv4-hero-actions">
              <a className="rv4-primary-link" href="#inscricao">Quero entrar no TRINCA RV21</a>
              <a className="rv4-secondary-link" href="#resultados">Ver resultados reais</a>
            </div>
            <div className="rv4-trust-row" aria-label="Pontos de confiança">
              <span>21 dias guiados</span>
              <span>Rotina possível</span>
              <span>Protocolo RV exclusivo</span>
            </div>
          </div>

          <figure className="rv4-hero-portrait" aria-label="Ruriá Virgínio">
            <Image
              src="/images/ruria-rosto-premium.png"
              alt="Ruriá Virgínio"
              fill
              priority
              sizes="(max-width: 1080px) 92vw, 34vw"
            />
            <figcaption>
              <strong>Ruriá Virgínio</strong>
              <span>14 anos guiando transformações reais</span>
            </figcaption>
          </figure>

          <aside className="rv4-offer-card" aria-label="Oferta TRINCA RV21">
            <span className="rv4-card-eyebrow">Sua decisão pelos próximos 21 dias</span>
            <strong>8x de R$ 5,51</strong>
            <p>R$ 37,89 à vista</p>
            <small>Parcelamento sujeito a acréscimos da Kiwify</small>
            <div className="rv4-card-line" />
            <ul>
              {heroOfferItems.map((item) => (
                <li key={item}>
                  <Check size={18} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a className="rv4-offer-button" href="#inscricao">Garantir minha vaga</a>
          </aside>
        </div>
      </section>

      <section className="rv4-diagnosis">
        <div className="rv4-section-head">
          <p className="rv4-kicker">O ciclo que trava seu resultado</p>
          <h2>Não é falta de potencial. É falta de direção quando a motivação acaba.</h2>
        </div>
        <div className="rv4-identity-grid">
          {identityCards.map((card) => (
            <article key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
        <div className="rv4-pain-marquee" aria-label="Dores comuns das alunas">
          <div className="marquee-track">
            {[...DORES, ...DORES].map((d, i) => (
              <div className="rv4-pain-pill" key={`${d.text}-${i}`}>
                <span>{d.emoji}</span>
                <p>{d.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rv4-method" id="metodo">
        <div className="rv4-method-copy">
          <p className="rv4-kicker">Protocolo, não promessa</p>
          <h2>Treino, alimentação e comportamento em uma rota simples.</h2>
          <p>
            O plano existe para você parar de improvisar: recebe o que fazer, quando fazer e como
            manter o ritmo mesmo nos dias difíceis.
          </p>
        </div>
        <div className="rv4-method-grid">
          {METODO_ITENS.map((item, index) => (
            <article key={item.titulo}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>{item.icon}</div>
              <h3>{item.titulo}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rv4-results" id="resultados">
        <div className="rv4-results-layout">
          <div className="rv4-results-copy">
            <div className="rv4-section-head align-left">
              <p className="rv4-kicker">Resultados reais</p>
              <h2>Transformações visíveis de mulheres que decidiram continuar.</h2>
              <p>
                Fotos e depoimentos reais do ecossistema RV. Não é sobre perfeição:
                é sobre seguir uma rota clara até o corpo começar a responder.
              </p>
            </div>

            <div className="rv4-stat-strip">
              {proofStats.map((stat) => (
                <CountUpStat key={stat.label} stat={stat} />
              ))}
            </div>

            <div className="rv4-video-head">
              <p className="rv4-kicker">Depoimentos em vídeo</p>
              <h3>Quando existe direção, o processo deixa de depender só de força de vontade.</h3>
            </div>
            <div className="rv4-video-grid">
              {studentVideos.map((video) => (
                <article className="rv4-video-card" key={video.id}>
                  <div className="rv4-video-frame">
                    <video poster={video.poster} controls playsInline preload="metadata">
                      <source src={video.src} type="video/mp4" />
                    </video>
                    <span>{video.result}</span>
                  </div>
                  <div className="rv4-video-copy">
                    <strong>{video.name}</strong>
                    <p>{video.quote}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="rv4-transform-reel" aria-label="Transformações reais TRINCA RV21">
            <div className="rv4-reel-head">
              <span>Antes e depois</span>
              <strong>Prova real das alunas</strong>
            </div>
            <div className="rv4-reel-grid">
              {transformationImages.map((src, index) => (
                <article className="rv-transform-card rv4-proof-card" data-index={index} key={src}>
                  <Image
                    src={src}
                    alt={`Transformação real de aluna TRINCA RV21 ${index + 1}`}
                    width={360}
                    height={index % 3 === 0 ? 480 : 430}
                    sizes="(max-width: 760px) 45vw, 180px"
                    loading="lazy"
                  />
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </article>
              ))}
            </div>
            <a className="rv4-reel-cta" href="#inscricao">Quero minha transformação</a>
          </aside>
        </div>

        <div className="rv4-cloudinary-reel">
          <div className="rv4-reel-head">
            <span>Mais registros RV</span>
            <strong>Alunas em movimento</strong>
          </div>
          <PhotoMarquee />
        </div>
      </section>

      <section className="rv4-authority">
        <div className="rv-authority-photo">
          <Image
            src="/images/ruria-sobre.jpg"
            alt="Ruriá Virgínio"
            fill
            sizes="(max-width: 900px) 92vw, 400px"
            className="rv-authority-image"
          />
        </div>
        <div className="rv4-authority-copy">
          <p className="rv4-kicker">Quem conduz o processo</p>
          <h2>
            Sou Ruriá Virgínio.
            <br />
            O método é direto porque sua rotina já é complicada.
          </h2>
          <p>
            O TRINCA RV21 nasceu para mulheres que querem resultado, mas precisam de um plano
            possível, acompanhado e claro o suficiente para continuar.
          </p>
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

      <section className="rv4-final-offer" id="oferta">
        <div className="rv4-section-head">
          <p className="rv4-kicker">Entrada imediata</p>
          <h2>Entre hoje e receba o caminho dos próximos 21 dias.</h2>
        </div>

        <div className="rv4-final-card">
          <div className="rv4-final-price">
            <span className="rv4-card-eyebrow">TRINCA RV21</span>
            <span className="rv-old-price">De R$ 97,00</span>
            <strong>8x de R$ 5,51</strong>
            <p>R$ 37,89 à vista</p>
            <small>Parcelamento sujeito a acréscimos da Kiwify</small>
            <a className="rv-button rv-button-primary rv-offer-button cta-primary" href="#inscricao">
              Quero entrar no desafio agora
            </a>
            <footer>
              <span>🔒 Pagamento 100% seguro via Kiwify</span>
              <span>Vagas limitadas por turma</span>
            </footer>
          </div>

          <div className="rv4-final-urgency">
            <div>
              <p className="rv4-kicker">Janela de entrada</p>
              <h3>A turma fecha quando o contador zerar.</h3>
              <p>Você entra, informa seu objetivo e recebe o caminho para iniciar os próximos 21 dias com direção.</p>
            </div>
            <CountdownTimer />
          </div>

          <ul className="rv4-final-includes">
            {heroOfferItems.map((item) => (
              <li key={item}>
                <Check size={16} />
                {item}
              </li>
            ))}
          </ul>
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

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        padding: '12px 16px',
        background: 'rgba(8,8,8,0.9)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }} className="mobile-cta-bar">
        <a href="#inscricao" style={{
          display: 'block', width: '100%', textAlign: 'center',
          background: '#F5C842', color: '#000000', fontWeight: '700',
          fontSize: '15px', padding: '15px 0', borderRadius: '999px',
          textDecoration: 'none',
        }}>
          Quero entrar no TRINCA RV21
        </a>
      </div>

      <style>{`
        @media (min-width: 768px) { .mobile-cta-bar { display: none !important; } }
      `}</style>
    </main>
  );
}
