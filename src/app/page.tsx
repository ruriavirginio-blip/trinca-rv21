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

      <section id="top" style={{ position: 'relative', minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>

        {/* Glow decorativo */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 700px 500px at 75% 50%, rgba(245,200,66,0.06) 0%, transparent 70%)'
        }} />

        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '120px 24px 80px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}
               className="hero-grid">

            {/* ESQUERDA */}
            <div className="fade-in-up delay-1">

              {/* Badge */}
              <div style={{ display: 'inline-flex', marginBottom: '32px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: '700', letterSpacing: '0.16em',
                  textTransform: 'uppercase', padding: '8px 18px', borderRadius: '999px',
                  color: '#F5C842', border: '1px solid rgba(245,200,66,0.25)',
                  background: 'rgba(245,200,66,0.05)',
                }}>
                  ✦ 14 ANOS · +5.000 MULHERES TRANSFORMADAS
                </span>
              </div>

              {/* Headline */}
              <h1 style={{
                fontWeight: '800', lineHeight: '1.05', marginBottom: '24px',
                fontSize: 'clamp(42px, 5.5vw, 80px)', letterSpacing: '-0.025em', color: '#FFFFFF',
              }}>
                Você não falhou.<br />
                O método falhou<br />
                <span style={{ color: '#F5C842' }}>por você.</span>
              </h1>

              {/* Subheadline */}
              <p style={{
                fontSize: '17px', color: '#9CA3AF', lineHeight: '1.75',
                maxWidth: '460px', marginBottom: '40px',
              }}>
                Em 21 dias, com o Protocolo RV, você finalmente tem treino
                com direção, alimentação real e resultado que aparece no
                espelho — sem dieta maluca, sem treino impossível.
              </p>

              {/* CTA */}
              <a href="#inscricao" style={{
                display: 'inline-block', background: '#F5C842', color: '#000000',
                fontWeight: '700', fontSize: '16px', padding: '18px 42px',
                borderRadius: '999px', textDecoration: 'none',
                transition: 'transform 0.2s ease, filter 0.2s ease',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'; (e.currentTarget as HTMLElement).style.filter = 'brightness(1.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.filter = 'brightness(1)' }}
              >
                Quero entrar no TRINCA RV21
              </a>

              <p style={{ marginTop: '16px', fontSize: '12px', color: '#374151' }}>
                🔒 Pagamento seguro via Kiwify · Acesso imediato
              </p>
            </div>

            {/* DIREITA — Foto */}
            <div className="fade-in-up delay-2" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', maxWidth: '420px', width: '100%' }}>

                <div style={{ borderRadius: '24px', overflow: 'hidden', aspectRatio: '3/4' }}>
                  <img
                    src="https://res.cloudinary.com/drfs4s18a/image/upload/v1781613465/trinca-rv21/ruria-hero.jpg"
                    alt="Ruriá Virgínio"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(8,8,8,0.55) 0%, transparent 45%)',
                  }} />
                </div>

                {/* Badge stats sobre a foto */}
                <div style={{
                  position: 'absolute', bottom: '20px', left: '16px', right: '16px',
                  background: 'rgba(8,8,8,0.82)', backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(245,200,66,0.12)', borderRadius: '16px',
                  padding: '14px 20px', display: 'flex', justifyContent: 'space-around',
                }}>
                  {[{ n: '+5k', label: 'alunas' }, { n: '14', label: 'anos' }, { n: '+10', label: 'países' }].map(({ n, label }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ color: '#F5C842', fontWeight: '700', fontSize: '17px' }}>{n}</div>
                      <div style={{ color: '#6B7280', fontSize: '11px', marginTop: '2px' }}>{label}</div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Mobile: empilhar verticalmente */}
        <style>{`
          @media (max-width: 768px) {
            .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          }
        `}</style>
      </section>

      <section style={{ padding: '80px 0', background: '#060606', overflow: 'hidden' }}>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 48px', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,200,66,0.55)', marginBottom: '16px' }}>
            ✦ VOCÊ SE IDENTIFICA COM ISSO?
          </p>
          <h2 style={{ fontWeight: '800', fontSize: 'clamp(28px, 4.5vw, 52px)', color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: '1.15' }}>
            Se marcou sim em qualquer um —{' '}
            <span style={{ color: '#F5C842' }}>o TRINCA RV21 foi feito pra você.</span>
          </h2>
        </div>

        <div style={{ overflow: 'hidden' }}>
          <div className="marquee-track">
            {[...DORES, ...DORES].map((d, i) => (
              <div
                key={i}
                style={{
                  flexShrink: 0,
                  background: '#111111',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  minWidth: '250px',
                  marginRight: '14px',
                  transition: 'border-color 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,200,66,0.28)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)')}
              >
                <div style={{ fontSize: '26px', marginBottom: '10px' }}>{d.emoji}</div>
                <p style={{ color: '#E5E7EB', fontSize: '14px', fontWeight: '500', lineHeight: '1.55', margin: 0 }}>
                  {d.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="metodo" style={{ padding: '96px 0', background: '#0A0A0A' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start' }}
               className="metodo-grid">

            {/* Esquerda */}
            <div>
              <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,200,66,0.55)', marginBottom: '16px' }}>
                ✦ O QUE É O TRINCA RV21
              </p>
              <h2 style={{ fontWeight: '800', fontSize: 'clamp(34px, 4.5vw, 56px)', color: '#FFFFFF', letterSpacing: '-0.025em', lineHeight: '1.1', marginBottom: '24px' }}>
                21 dias.<br />Protocolo real.<br /><span style={{ color: '#F5C842' }}>Resultado visível.</span>
              </h2>
              <p style={{ fontSize: '17px', color: '#6B7280', lineHeight: '1.75', maxWidth: '400px' }}>
                O plano foi desenhado para mulheres reais: rotina corrida, corpo cansado
                de tentativas soltas e vontade de voltar a se reconhecer no espelho.
              </p>
            </div>

            {/* Direita — cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {METODO_ITENS.map((item, i) => (
                <div key={i} style={{
                  background: '#111111', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px', padding: '18px 22px',
                  display: 'flex', gap: '16px', alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '10px',
                    background: 'rgba(245,200,66,0.09)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 style={{ color: '#FFFFFF', fontWeight: '600', fontSize: '15px', marginBottom: '6px', lineHeight: '1.4' }}>
                      {item.titulo}
                    </h3>
                    <p style={{ color: '#6B7280', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .metodo-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          }
        `}</style>
      </section>

      <section id="resultados" style={{ padding: '96px 0', background: '#060606', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px 64px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,200,66,0.55)', marginBottom: '16px' }}>
            ✦ RESULTADOS REAIS
          </p>
          <h2 style={{ fontWeight: '800', fontSize: 'clamp(34px, 4.5vw, 56px)', color: '#FFFFFF', letterSpacing: '-0.025em', lineHeight: '1.1' }}>
            Elas duvidavam.<br /><span style={{ color: '#F5C842' }}>Hoje agradecem.</span>
          </h2>
        </div>

        {/* MARQUEE DE FOTOS — sem nomes */}
        <div style={{ marginBottom: '80px' }}>
          <PhotoMarquee />
        </div>

        {/* Divisor */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', marginBottom: '64px' }} />
        </div>

        {/* VÍDEOS — usar os src originais que você copiou acima */}
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)', marginBottom: '32px' }}>
            ✦ DEPOIMENTOS EM VÍDEO
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="videos-grid">

            {/* Vídeo 1 — src = VIDEO_SRC_1 que você copiou */}
            <div style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden', transition: 'border-color 0.3s' }}
                 onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,200,66,0.18)')}
                 onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)')}>
              <div style={{ position: 'relative', aspectRatio: '9/16' }}>
                <video src="/media/depoimento-jessica.mp4" controls playsInline preload="metadata" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              <div style={{ padding: '16px 20px' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#F5C842', background: 'rgba(245,200,66,0.08)', padding: '5px 12px', borderRadius: '999px' }}>
                  DEPOIMENTO REAL
                </span>
              </div>
            </div>

            {/* Vídeo 2 — src = VIDEO_SRC_2 que você copiou */}
            <div style={{ background: '#0F0F0F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', overflow: 'hidden', transition: 'border-color 0.3s' }}
                 onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,200,66,0.18)')}
                 onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)')}>
              <div style={{ position: 'relative', aspectRatio: '9/16' }}>
                <video src="/media/depoimento-coletivo.mp4" controls playsInline preload="metadata" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              </div>
              <div style={{ padding: '16px 20px' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#F5C842', background: 'rgba(245,200,66,0.08)', padding: '5px 12px', borderRadius: '999px' }}>
                  ANTES & DEPOIS
                </span>
              </div>
            </div>

          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            .videos-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
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
          <strong>8x de R$ 5,51</strong>
          <p>R$ 37,89 à vista</p>
          <small>Parcelamento sujeito a acréscimos da Kiwify</small>
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
