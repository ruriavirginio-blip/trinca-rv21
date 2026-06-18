"use client";

import { useEffect, useRef, useState } from "react";

/* =============================================================
   TRINCA RV21 — LANDING NOVA (maximalista, padrão agência)
   Rota isolada /nova · CSS próprio (styled-jsx) · form -> /api/leads
   Direção: "Editorial Maximalista" — preto profundo + ouro,
   Bricolage Grotesque, cascata Z-axis, o "21" como motivo gráfico.
   Assets reais preservados. Produção NÃO é tocada.
   ============================================================= */

const CHECKOUT =
  process.env.NEXT_PUBLIC_KIWIFY_CHECKOUT_URL || "https://protocolorv.com.br";

const OBJETIVOS = [
  { value: "emagrecimento-barriga", label: "Perder barriga", emoji: "🔥" },
  { value: "gluteos", label: "Definir glúteos e pernas", emoji: "🍑" },
  { value: "emagrecimento-geral", label: "Perder peso geral", emoji: "⚖️" },
  { value: "autoestima", label: "Disposição e autoestima", emoji: "✨" },
];

const ANTES_DEPOIS = [
  "/images/antesdepois.jpg",
  "/images/antesdepoiss.jpg",
  "/images/antesdepoisss.jpg",
  "/images/antesdepoissss.jpg",
  "/images/antesdepoissssss.jpg",
  "/images/antesdepo.jpg",
  "/images/antesdepoi.jpg",
  "/images/antesdepoii.jpg",
];

const INCLUI = [
  ["Treino direcionado de 21 dias", "Casa ou academia, adaptado ao seu nível"],
  ["Dieta por objetivo", "Montada conforme o que VOCÊ escolher"],
  ["Grupo no WhatsApp", "Acompanhamento diário — você não fica sozinha"],
  ["E-books de apoio", "Receitas, mindset e hábitos"],
  ["Análise comportamental RV", "Identificamos o que te fez desistir antes"],
  ["Cupom de 50%", "Pra continuar comigo depois do desafio"],
];

const FAQ = [
  ["Será que funciona pra mim?", "O TRINCA foi feito pra mulher real — iniciante, ocupada, que já tentou de tudo. O treino se adapta ao seu nível e você é acompanhada todo dia. Não é sobre força de vontade. É sobre direção."],
  ["Preciso de academia?", "Não. Tem versão pra fazer em casa ou na academia. Você escolhe o que cabe na sua rotina."],
  ["E se eu nunca treinei na vida?", "Melhor ainda — é exatamente pra quem está começando. Tudo explicado passo a passo, no seu ritmo."],
  ["R$37,89 é pagamento único?", "Sim. Pagamento único, sem mensalidade escondida. E você ainda ganha 50% de desconto pra continuar depois dos 21 dias."],
];

export default function NovaLanding() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Revelação flutuante ao rolar + sticky bar
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".mx-reveal"));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("mx-in"), io.unobserve(e.target))),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    els.forEach((el) => io.observe(el));

    // Contadores animados (premium "alive") — respeita reduced-motion
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const counters = Array.from(document.querySelectorAll<HTMLElement>("b[data-count]"));
    const fmt = (n: number) => new Intl.NumberFormat("pt-BR").format(Math.round(n));
    const cio = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target as HTMLElement;
        const target = Number(el.dataset.count || 0);
        const prefix = el.dataset.prefix || "";
        if (reduce) { el.textContent = prefix + fmt(target); cio.unobserve(el); return; }
        const dur = 1400; const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + fmt(target * eased);
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        cio.unobserve(el);
      }),
      { threshold: 0.5 },
    );
    counters.forEach((el) => cio.observe(el));

    const onScroll = () => setShowSticky(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { io.disconnect(); cio.disconnect(); window.removeEventListener("scroll", onScroll); };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    const fd = new FormData(e.currentTarget);
    const lead = {
      nome: String(fd.get("nome") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      whatsapp: String(fd.get("whatsapp") || "").trim(),
      objetivo: String(fd.get("objetivo") || ""),
      origem: "landing-trinca-rv21-nova",
      status: "checkout-iniciado",
      etapaFunil: "checkout",
      data: new Date().toISOString(),
    };
    try {
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead),
      });
      window.location.href = CHECKOUT;
    } catch {
      setErr("Não consegui registrar agora. Tenta de novo em instantes.");
      setLoading(false);
    }
  }

  const goForm = () => formRef.current?.scrollIntoView({ behavior: "smooth" });

  return (
    <main className="mx">
      <div className="mx-glow a" />
      <div className="mx-glow b" />

      {/* NAV */}
      <nav className="mx-nav">
        <span className="mx-logo">TRINCA <b>RV21</b></span>
        <button className="mx-nav-cta" onClick={goForm}>Entrar agora</button>
      </nav>

      {/* HERO */}
      <header className="mx-hero">
        <span className="mx-badge"><i /> PROTOCOLO RV · DESAFIO DE 21 DIAS</span>
        <div className="mx-hero-grid">
          <div className="mx-hero-copy">
            <h1>
              Você não <span className="strike">falhou</span>.
              <br />O <em>método</em> é que<br />falhou com você.
            </h1>
            <p className="mx-sub">
              Em <b>21 dias</b>, com treino direcionado, dieta por objetivo e acompanhamento
              diário, você troca a culpa pela imagem que sente orgulho de ver no espelho.
            </p>
            <div className="mx-cta-row">
              <button className="mx-cta" onClick={goForm}>QUERO ENTRAR NO TRINCA RV21 →</button>
              <button className="mx-cta ghost" onClick={goForm}>Ver resultados reais</button>
            </div>
            <p className="mx-cta-note">Acesso imediato no WhatsApp · inscrição via Kiwify</p>
          </div>
          <div className="mx-hero-photo">
            <span className="mx-21">21</span>
            <img src="/images/ruria-rosto-premium.png" alt="Ruriá Virgínio" />
            <span className="mx-photo-tag">Ruriá Virgínio · Personal há 14 anos</span>
          </div>
        </div>
      </header>

      {/* STATS */}
      <section className="mx-stats mx-reveal">
        <div className="mx-stat"><b data-count="5000" data-prefix="+">+5.000</b><span>mulheres transformadas</span></div>
        <div className="mx-stat"><b data-count="14">14</b><span>anos de experiência</span></div>
        <div className="mx-stat"><b data-count="21">21</b><span>dias pra virar a chave</span></div>
      </section>

      {/* IDENTIFICAÇÃO */}
      <section className="mx-section">
        <p className="mx-eyebrow mx-reveal">A real que ninguém te conta</p>
        <h2 className="mx-big mx-reveal">
          A maioria começa na <span className="hl">segunda</span>.<br />
          E some na <span className="hl">quarta</span>.
        </h2>
        <p className="mx-lead mx-reveal">
          Não é fraqueza. É falta de direção. Quando o plano depende de motivação, ele desaba no
          primeiro dia difícil. O Protocolo RV foi feito pra encaixar na mulher real — a que tem
          filho, trabalho, casa e 30 minutos no dia.
        </p>
      </section>

      {/* MARQUEE de transformações */}
      <section className="mx-marquee-wrap mx-reveal">
        <p className="mx-eyebrow center">Elas viraram a chave</p>
        <div className="mx-marquee">
          <div className="mx-marquee-track">
            {[...ANTES_DEPOIS, ...ANTES_DEPOIS].map((src, i) => (
              <div className="mx-mq-card" key={i}>
                <img src={src} alt="Transformação real" loading="lazy" />
                <span className="mx-mq-tag">Antes · Depois</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VÍDEOS */}
      <section className="mx-section">
        <p className="mx-eyebrow mx-reveal">Elas falam por nós</p>
        <h2 className="mx-h2 mx-reveal">Depoimentos <span className="hl">reais</span></h2>
        <div className="mx-videos mx-reveal">
          <figure className="mx-video">
            <video controls preload="metadata" playsInline poster="/images/depoimento-jessica-poster.jpg">
              <source src="/media/depoimento-jessica.mp4" type="video/mp4" />
            </video>
            <figcaption><b>Jessica Macedo</b><span>Aluna Protocolo RV</span></figcaption>
          </figure>
          <figure className="mx-video">
            <video controls preload="metadata" playsInline poster="/images/depoimento-coletivo-poster.jpg">
              <source src="/media/depoimento-coletivo.mp4" type="video/mp4" />
            </video>
            <figcaption><b>Mulheres RV</b><span>Transformações reais</span></figcaption>
          </figure>
        </div>
      </section>

      {/* OFERTA */}
      <section className="mx-section">
        <p className="mx-eyebrow mx-reveal">A oferta</p>
        <h2 className="mx-h2 mx-reveal">Tudo que você recebe</h2>
        <div className="mx-offer mx-reveal">
          <svg className="mx-seal" viewBox="0 0 120 120" aria-label="Selo 21 dias Protocolo RV" role="img">
            <defs>
              <path id="mxcirc" d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0" />
              <linearGradient id="mxg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#f0c969" /><stop offset="1" stopColor="#d4a23c" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="56" fill="none" stroke="url(#mxg)" strokeWidth="1.5" opacity="0.6" />
            <circle cx="60" cy="60" r="48" fill="rgba(212,162,60,0.08)" stroke="url(#mxg)" strokeWidth="1" />
            <text fontSize="9" fontWeight="700" letterSpacing="2" fill="#f0c969">
              <textPath href="#mxcirc" startOffset="2%">PROTOCOLO RV · ACOMPANHAMENTO REAL · </textPath>
            </text>
            <text x="60" y="54" textAnchor="middle" fontFamily="Bricolage Grotesque, sans-serif" fontSize="34" fontWeight="800" fill="url(#mxg)">21</text>
            <text x="60" y="72" textAnchor="middle" fontSize="10" fontWeight="700" letterSpacing="2" fill="#f0c969">DIAS</text>
          </svg>
          <div className="mx-price">
            <span className="old">R$97</span>
            <span className="now"><i>R$</i>37<i>,89</i></span>
            <span className="split">ou 8x de R$5,51 · acesso imediato</span>
          </div>
          <ul className="mx-incl">
            {INCLUI.map(([t, d]) => (
              <li key={t}><span className="ck">✓</span><div><b>{t}</b><span>{d}</span></div></li>
            ))}
          </ul>
          <button className="mx-cta full" onClick={goForm}>GARANTIR MINHA VAGA AGORA →</button>
          <div className="mx-scarcity"><span className="pulse" />Turmas <b>limitadas</b> pra garantir acompanhamento de verdade.</div>
        </div>
      </section>

      {/* AUTORIDADE */}
      <section className="mx-section">
        <p className="mx-eyebrow mx-reveal">Quem te guia</p>
        <h2 className="mx-h2 mx-reveal">Prazer, <span className="hl">Ruriá Virgínio</span></h2>
        <div className="mx-about mx-reveal">
          <img src="/images/ruria-sobre.jpg" alt="Ruriá Virgínio" />
          <div className="mx-about-body">
            <p><b>14 anos transformando corpos e autoestima</b> — mais de 5.000 mulheres que descobriram que dava, sim, pra virar a chave.</p>
            <p>Criei o <b>Protocolo RV</b> porque cansei de ver mulher se culpando por “não ter força de vontade”. O problema nunca foi você. Foi o método sem direção.</p>
            <p>O TRINCA RV21 é a porta de entrada. <b>21 dias</b> pra você sentir o que é ser acompanhada de verdade.</p>
          </div>
        </div>
      </section>

      {/* FORM */}
      <section className="mx-section" ref={formRef} id="entrar">
        <p className="mx-eyebrow mx-reveal">Sua vez</p>
        <h2 className="mx-big mx-reveal">Escolha seu objetivo<br />e <span className="hl">entre agora</span>.</h2>
        <form className="mx-form mx-reveal" onSubmit={handleSubmit}>
          <input type="text" name="nome" placeholder="Seu nome completo" required />
          <input type="email" name="email" placeholder="voce@email.com" required />
          <input type="tel" name="whatsapp" placeholder="(84) 99999-9999" required />
          <fieldset className="mx-objetivos">
            <legend>Principal objetivo</legend>
            <div className="mx-obj-grid">
              {OBJETIVOS.map((o) => (
                <label className="mx-obj" key={o.value}>
                  <input type="radio" name="objetivo" value={o.value} required />
                  <span className="mx-obj-card"><i>{o.emoji}</i>{o.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {err ? <p className="mx-err">{err}</p> : null}
          <button className="mx-cta full" type="submit" disabled={loading}>
            {loading ? "Enviando..." : "ENTRAR NO TRINCA RV21 →"}
          </button>
          <p className="mx-cta-note">Pagamento único · sem mensalidade · acesso imediato no WhatsApp</p>
        </form>
      </section>

      {/* FAQ */}
      <section className="mx-section">
        <p className="mx-eyebrow mx-reveal">Ainda na dúvida?</p>
        <h2 className="mx-h2 mx-reveal">Perguntas frequentes</h2>
        <div className="mx-faq mx-reveal">
          {FAQ.map(([q, a], i) => (
            <div className={`mx-faq-item ${faqOpen === i ? "open" : ""}`} key={q}>
              <button type="button" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                {q}<i>+</i>
              </button>
              <div className="mx-faq-a"><p>{a}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL */}
      <section className="mx-section">
        <div className="mx-final mx-reveal">
          <span className="mx-21 big">21</span>
          <h2>Se não <span className="hl">agora</span>, quando?</h2>
          <p>Daqui a 21 dias você vai querer ter começado hoje.</p>
          <button className="mx-cta full" onClick={goForm}>COMEÇAR MEUS 21 DIAS →</button>
          <span className="mx-final-price">R$37,89 · ou 8x de R$5,51</span>
        </div>
      </section>

      <footer className="mx-foot">
        <div className="mx-logo">TRINCA <b>RV21</b></div>
        <p>© 2026 Ruriá Virgínio · Protocolo RV · protocolorv.com.br</p>
      </footer>

      {/* STICKY */}
      <div className={`mx-sticky ${showSticky ? "show" : ""}`}>
        <div className="sp"><b>R$37,89</b><span>8x R$5,51</span></div>
        <button className="mx-cta" onClick={goForm}>QUERO ENTRAR →</button>
      </div>

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");
        .mx { --bg:#08080a; --bg2:#0f0f12; --card:#141418; --line:#26262e; --gold:#d4a23c; --gold2:#f0c969; --txt:#f6f4ef; --muted:#a09c94; --muted2:#6c6962;
          background:var(--bg); color:var(--txt); font-family:"Plus Jakarta Sans",sans-serif; line-height:1.5; -webkit-font-smoothing:antialiased; overflow-x:hidden; position:relative; min-height:100vh; }
        .mx *{margin:0;padding:0;box-sizing:border-box}
        .mx h1,.mx h2,.mx .mx-logo{font-family:"Bricolage Grotesque",sans-serif;letter-spacing:-0.03em;line-height:1.02}
        .mx .hl{color:var(--gold2)}
        .mx .mx-glow{position:fixed;border-radius:50%;pointer-events:none;z-index:0;filter:blur(10px)}
        .mx .mx-glow.a{top:-8%;left:60%;width:520px;height:520px;background:radial-gradient(circle,rgba(212,162,60,0.16),transparent 62%)}
        .mx .mx-glow.b{bottom:5%;left:-10%;width:420px;height:420px;background:radial-gradient(circle,rgba(212,162,60,0.09),transparent 60%)}
        .mx > *{position:relative;z-index:1}
        .mx section,.mx header,.mx nav,.mx footer{max-width:1100px;margin:0 auto;padding-left:22px;padding-right:22px}

        .mx-nav{display:flex;align-items:center;justify-content:space-between;padding-top:22px;padding-bottom:14px}
        .mx-logo{font-size:19px;font-weight:800} .mx-logo b{color:var(--gold2)}
        .mx-nav-cta{background:none;border:1px solid var(--line);color:var(--txt);padding:9px 18px;border-radius:100px;font-weight:700;font-size:13px;cursor:pointer;font-family:inherit;transition:.2s}
        .mx-nav-cta:hover{border-color:var(--gold)}

        .mx-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(212,162,60,0.1);border:1px solid rgba(212,162,60,0.28);color:var(--gold2);font-size:12px;font-weight:700;padding:8px 15px;border-radius:100px;letter-spacing:.05em}
        .mx-badge i{width:6px;height:6px;border-radius:50%;background:var(--gold2);box-shadow:0 0 8px var(--gold2)}
        .mx-hero{padding-top:30px;padding-bottom:40px}
        .mx-hero-grid{display:grid;grid-template-columns:1.1fr 0.9fr;gap:34px;align-items:center;margin-top:26px}
        .mx-hero h1{font-size:clamp(40px,7vw,76px);font-weight:800}
        .mx-hero h1 em{font-style:normal;color:var(--gold2)}
        .mx-hero h1 .strike{position:relative;color:var(--muted)}
        .mx-hero h1 .strike::after{content:"";position:absolute;left:-2%;top:52%;width:104%;height:5px;background:var(--gold2);transform:rotate(-3deg);border-radius:3px}
        .mx-sub{color:var(--muted);font-size:clamp(15px,2vw,18px);max-width:480px;margin:22px 0 26px}
        .mx-sub b{color:var(--txt)}
        .mx-cta-row{display:flex;gap:12px;flex-wrap:wrap}
        .mx-cta{background:linear-gradient(135deg,var(--gold),var(--gold2));color:#1a1206;font-weight:800;font-size:15px;padding:16px 24px;border-radius:13px;border:none;cursor:pointer;font-family:inherit;box-shadow:0 10px 34px rgba(212,162,60,0.3);transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
        .mx-cta:hover{transform:translateY(-2px)} .mx-cta:active{transform:scale(.97)}
        .mx-cta.ghost{background:none;color:var(--txt);border:1px solid var(--line);box-shadow:none}
        .mx-cta.full{width:100%;justify-content:center;padding:19px;font-size:16px;margin-top:8px}
        .mx-cta-note{color:var(--muted2);font-size:12.5px;margin-top:12px}

        .mx-hero-photo{position:relative}
        .mx-hero-photo img{width:100%;border-radius:22px;display:block;border:1px solid var(--line);object-fit:cover;aspect-ratio:4/5;object-position:center 20%}
        .mx-21{position:absolute;font-family:"Bricolage Grotesque";font-weight:800;font-size:clamp(120px,20vw,230px);color:transparent;-webkit-text-stroke:2px rgba(212,162,60,0.35);top:-12%;right:-6%;line-height:.7;z-index:-1;pointer-events:none}
        .mx-21.big{position:static;display:block;-webkit-text-stroke:2px rgba(212,162,60,0.4);margin-bottom:-30px}
        .mx-photo-tag{position:absolute;bottom:14px;left:14px;right:14px;background:rgba(8,8,10,0.7);backdrop-filter:blur(8px);border:1px solid rgba(212,162,60,0.25);color:var(--gold2);font-size:12px;font-weight:700;padding:8px 13px;border-radius:100px;text-align:center}

        .mx-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:10px;margin-bottom:30px}
        .mx-stat{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:22px 14px;text-align:center}
        .mx-stat b{font-family:"Bricolage Grotesque";font-size:clamp(28px,5vw,42px);font-weight:800;color:var(--gold2);display:block;line-height:1}
        .mx-stat span{color:var(--muted);font-size:12px;font-weight:600;margin-top:8px;display:block}

        .mx-section{padding-top:46px;padding-bottom:10px}
        .mx-eyebrow{font-size:12px;font-weight:800;color:var(--gold);letter-spacing:.16em;text-transform:uppercase;margin-bottom:14px}
        .mx-eyebrow.center{text-align:center}
        .mx-big{font-size:clamp(32px,5.5vw,58px);font-weight:800;margin-bottom:18px}
        .mx-h2{font-size:clamp(26px,4vw,40px);font-weight:800;margin-bottom:8px}
        .mx-lead{color:var(--muted);font-size:clamp(15px,2vw,18px);max-width:620px}

        .mx-marquee-wrap{padding-top:34px}
        .mx-marquee{overflow:hidden;margin-top:16px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)}
        .mx-marquee-track{display:flex;gap:14px;width:max-content;animation:mxscroll 42s linear infinite}
        .mx-marquee:hover .mx-marquee-track{animation-play-state:paused}
        @keyframes mxscroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .mx-mq-card{position:relative;width:230px;height:310px;border-radius:16px;overflow:hidden;flex-shrink:0;border:1px solid var(--line);background:#111}
        .mx-mq-card img{width:100%;height:100%;object-fit:cover}
        .mx-mq-tag{position:absolute;bottom:10px;left:10px;background:rgba(8,8,10,0.78);backdrop-filter:blur(8px);border:1px solid rgba(212,162,60,0.3);color:var(--gold2);font-size:10.5px;font-weight:700;padding:5px 11px;border-radius:100px;letter-spacing:.03em}

        .mx-videos{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:22px}
        .mx-video{background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden}
        .mx-video video{width:100%;display:block;background:#000;max-height:520px;object-fit:cover}
        .mx-video figcaption{padding:13px 16px;display:flex;flex-direction:column}
        .mx-video figcaption b{font-size:14px} .mx-video figcaption span{font-size:12px;color:var(--muted2)}

        .mx-offer{background:linear-gradient(165deg,var(--card),var(--bg2));border:1px solid var(--line);border-radius:24px;padding:30px 24px;margin-top:22px;position:relative;overflow:hidden}
        .mx-offer::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--gold2),transparent)}
        .mx-price{text-align:center;margin-bottom:22px}
        .mx-price .old{color:var(--muted2);text-decoration:line-through;font-size:18px;font-weight:600;margin-right:10px}
        .mx-price .now{font-family:"Bricolage Grotesque";font-size:clamp(48px,9vw,68px);font-weight:800}
        .mx-price .now i{font-style:normal;font-size:24px;color:var(--gold2);vertical-align:super}
        .mx-price .split{display:block;color:var(--gold2);font-size:14px;font-weight:600;margin-top:6px}
        .mx-incl{list-style:none;margin-bottom:22px}
        .mx-incl li{display:flex;gap:12px;padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
        .mx-incl li:last-child{border-bottom:none}
        .mx-incl .ck{flex-shrink:0;width:22px;height:22px;background:rgba(212,162,60,0.14);border-radius:7px;display:grid;place-items:center;color:var(--gold2);font-weight:800;font-size:12px;margin-top:1px}
        .mx-incl b{font-size:14.5px;display:block} .mx-incl span{font-size:13px;color:var(--muted)}
        .mx-scarcity{display:flex;align-items:center;gap:11px;background:rgba(212,162,60,0.07);border:1px solid rgba(212,162,60,0.22);border-radius:13px;padding:14px 16px;margin-top:14px;font-size:13px;font-weight:600}
        .mx-scarcity b{color:var(--gold2)}

        /* === COMANDO 2: aprimoramentos premium (ui-ux-pro-max + banner + animação) === */
        /* tabular numbers — preço/stats não saltam (number-tabular) */
        .mx-stat b,.mx-price .now,.mx-sticky .sp b{font-variant-numeric:tabular-nums}
        /* selo de garantia */
        .mx-offer{position:relative}
        .mx-seal{position:absolute;top:-26px;right:14px;width:92px;height:92px;filter:drop-shadow(0 6px 16px rgba(0,0,0,.5));animation:mxspin 26s linear infinite;z-index:2}
        @keyframes mxspin{to{transform:rotate(360deg)}}
        .mx-seal text[font-family]{animation:none}
        /* shimmer no "21" do hero */
        .mx-21{background:linear-gradient(110deg,rgba(212,162,60,0.35) 30%,rgba(255,240,200,0.9) 50%,rgba(212,162,60,0.35) 70%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;-webkit-text-stroke:1px rgba(212,162,60,0.4);background-size:220% 100%;animation:mxshine 5s ease-in-out infinite}
        @keyframes mxshine{0%,100%{background-position:130% 0}50%{background-position:-30% 0}}
        /* borda animada no CTA primário */
        .mx-cta:not(.ghost){position:relative;isolation:isolate}
        .mx-cta:not(.ghost)::after{content:"";position:absolute;inset:-2px;border-radius:15px;padding:2px;background:linear-gradient(120deg,transparent,rgba(255,240,200,0.9),transparent);background-size:200% 100%;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:mxborder 3.5s linear infinite;z-index:-1;opacity:.7}
        @keyframes mxborder{to{background-position:200% 0}}
        /* acessibilidade: foco visível (focus-states) + touch (tap-delay) */
        .mx button,.mx a,.mx input{touch-action:manipulation}
        .mx button:focus-visible,.mx input:focus-visible,.mx .mx-obj input:focus-visible + .mx-obj-card{outline:3px solid var(--gold2);outline-offset:2px}
        @media(prefers-reduced-motion:reduce){
          .mx-seal,.mx-21,.mx-cta:not(.ghost)::after{animation:none}
          .mx-21{-webkit-text-fill-color:transparent}
        }
        .pulse{flex-shrink:0;width:9px;height:9px;border-radius:50%;background:var(--gold2);animation:mxpulse 2s infinite}
        @keyframes mxpulse{0%{box-shadow:0 0 0 0 rgba(240,201,105,.5)}70%{box-shadow:0 0 0 11px rgba(240,201,105,0)}100%{box-shadow:0 0 0 0 rgba(240,201,105,0)}}

        .mx-about{display:grid;grid-template-columns:0.8fr 1.2fr;gap:22px;margin-top:22px;align-items:center}
        .mx-about img{width:100%;border-radius:20px;border:1px solid var(--line);object-fit:cover;aspect-ratio:1;object-position:center 22%}
        .mx-about-body p{color:var(--muted);font-size:15px;margin-bottom:13px} .mx-about-body b{color:var(--txt)}

        .mx-form{background:var(--card);border:1px solid var(--line);border-radius:22px;padding:26px 22px;margin-top:22px;display:flex;flex-direction:column;gap:13px}
        .mx-form input[type=text],.mx-form input[type=email],.mx-form input[type=tel]{background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:15px 16px;color:var(--txt);font-size:15px;font-family:inherit}
        .mx-form input::placeholder{color:var(--muted2)}
        .mx-form input:focus{outline:none;border-color:var(--gold)}
        .mx-objetivos{border:none} .mx-objetivos legend{font-size:13px;font-weight:700;color:var(--muted);margin-bottom:10px}
        .mx-obj-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
        .mx-obj input{position:absolute;opacity:0}
        .mx-obj-card{display:flex;align-items:center;gap:9px;background:var(--bg);border:1px solid var(--line);border-radius:12px;padding:14px 13px;font-size:13.5px;font-weight:600;cursor:pointer;transition:.18s;height:100%}
        .mx-obj-card i{font-style:normal;font-size:18px}
        .mx-obj input:checked + .mx-obj-card{border-color:var(--gold);background:rgba(212,162,60,0.08);color:var(--gold2)}
        .mx-err{color:#ff8a80;font-size:13px}

        .mx-faq{margin-top:20px}
        .mx-faq-item{background:var(--card);border:1px solid var(--line);border-radius:13px;margin-bottom:11px;overflow:hidden}
        .mx-faq-item button{width:100%;text-align:left;background:none;border:none;color:var(--txt);font-family:inherit;font-size:14.5px;font-weight:700;padding:17px 18px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:12px}
        .mx-faq-item button i{color:var(--gold2);font-size:22px;font-style:normal;transition:transform .3s}
        .mx-faq-item.open button i{transform:rotate(45deg)}
        .mx-faq-a{max-height:0;overflow:hidden;transition:max-height .35s ease,padding .35s ease;padding:0 18px}
        .mx-faq-item.open .mx-faq-a{max-height:260px;padding:0 18px 17px}
        .mx-faq-a p{color:var(--muted);font-size:13.5px;line-height:1.6}

        .mx-final{text-align:center;background:linear-gradient(165deg,rgba(212,162,60,0.09),rgba(212,162,60,0.02));border:1px solid rgba(212,162,60,0.22);border-radius:26px;padding:40px 24px 32px;margin-top:24px}
        .mx-final h2{font-size:clamp(28px,5vw,46px);font-weight:800;margin-bottom:10px}
        .mx-final p{color:var(--muted);margin-bottom:22px}
        .mx-final-price{display:block;color:var(--gold2);font-size:13px;font-weight:600;margin-top:12px}

        .mx-foot{text-align:center;padding-top:40px;padding-bottom:120px}
        .mx-foot .mx-logo{font-size:18px;display:inline-block}
        .mx-foot p{color:var(--muted2);font-size:11.5px;margin-top:8px}

        .mx-sticky{position:fixed;bottom:0;left:0;right:0;z-index:60;background:rgba(8,8,10,0.92);backdrop-filter:blur(16px);border-top:1px solid var(--line);padding:12px 20px;display:flex;align-items:center;gap:14px;max-width:1100px;margin:0 auto;transform:translateY(130%);transition:transform .4s cubic-bezier(.34,1.2,.64,1)}
        .mx-sticky.show{transform:translateY(0)}
        .mx-sticky .sp b{display:block;font-family:"Bricolage Grotesque";font-size:20px;font-weight:800;color:var(--gold2);line-height:1}
        .mx-sticky .sp span{font-size:10.5px;color:var(--muted)}
        .mx-sticky .mx-cta{flex:1;box-shadow:none;padding:14px}

        .mx-reveal{opacity:0;transform:translateY(40px) scale(.97);filter:blur(6px);transition:opacity .8s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1),filter .8s}
        .mx-reveal.mx-in{opacity:1;transform:none;filter:blur(0)}
        @media(prefers-reduced-motion:reduce){.mx-reveal{opacity:1!important;transform:none!important;filter:none!important}.mx-marquee-track{animation:none}}

        @media(max-width:860px){
          .mx-hero-grid{grid-template-columns:1fr;gap:24px}
          .mx-hero-photo{order:-1;max-width:380px;margin:0 auto}
          .mx-videos{grid-template-columns:1fr}
          .mx-about{grid-template-columns:1fr}
          .mx-about img{max-width:320px}
        }
        @media(max-width:560px){
          .mx-obj-grid{grid-template-columns:1fr}
          .mx-stats{gap:9px} .mx-stat{padding:16px 8px}
          .mx-nav-cta{display:none}
        }
      `}</style>
    </main>
  );
}
