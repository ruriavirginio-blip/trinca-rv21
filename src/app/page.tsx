"use client";

import { useState } from "react";
import Image from "next/image";
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

const benefits = [
  "Treinos direcionados para 21 dias",
  "Dieta específica por objetivo",
  "Grupo exclusivo com direcionamento",
  "Check-ins para manter constância",
  "Ebook RV e Ebook Nutricional",
  "Cupom TRINCA PREMIUM50% pós-desafio",
];

const painPoints = [
  "Você começa animada, mas perde ritmo quando a rotina aperta.",
  "Sente que precisa emagrecer, desinchar e voltar a gostar das fotos.",
  "Já tentou sozinha, mas faltou direção, cobrança e suporte real.",
  "Quer resultado, mas não quer um plano impossível de seguir.",
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
    title: "Boas-vindas",
    text: "Você recebe um vídeo de boas-vindas do idealizador do TRINCA RV21, Ruriá Virgínio, e acesso ao grupo oficial.",
  },
  {
    step: "04",
    title: "Execução",
    text: "Durante 21 dias, você segue treino, dieta, check-ins e suporte para sair da promessa.",
  },
];

const bonuses = [
  "Dieta específica para seu objetivo, elaborada por nutricionista",
  "Ebook RV para mentalidade e constância",
  "Ebook Nutricional para melhorar escolhas",
  "Cupom TRINCA PREMIUM50% liberado no pós-desafio",
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
      "Sim. O valor à vista é R$ 37,89 e a entrada pode ser parcelada em até 8x no cartão. O parcelamento tem juros da Kiwify e o valor final aparece antes da confirmação.",
  },
  {
    question: "Quando recebo os materiais?",
    answer:
      "Após a aprovação do pagamento, você entra no fluxo de boas-vindas e recebe os materiais do desafio.",
  },
  {
    question: "O grupo é liberado antes do pagamento?",
    answer:
      "Não. O grupo oficial é enviado apenas após a aprovação para manter a organização e proteger a experiência das alunas.",
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

  async function handleLeadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setSubmitError("");

    const formData = new FormData(event.currentTarget);

    const lead = {
      nome: String(formData.get("nome") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      whatsapp: String(formData.get("whatsapp") || "").trim(),
      objetivo: String(formData.get("objetivo") || ""),
      origem: "landing-trinca-rv21",
      status: "checkout-iniciado",
      etapaFunil: "checkout",
      utm: typeof window !== "undefined" ? window.location.search : "",
      data: new Date().toISOString(),
    };

    try {
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

      window.location.href = CHECKOUT_URL;
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
          Entrar agora
          <ArrowRight size={16} strokeWidth={2.2} />
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-inner">
          <p className="eyebrow">Desafio feminino oficial RV</p>

          <h1>
            TRINCA <span>RV21</span>
          </h1>

          <p className="hero-lead">
            21 dias para sair do ciclo de começar e desistir, recuperar
            disciplina e voltar a se sentir bonita, confiante e confortável no
            próprio corpo.
          </p>

          <div className="hero-actions">
            <a className="button button-primary" href="#inscricao">
              Quero entrar no desafio
              <ArrowRight size={18} />
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
        </div>

        <aside className="hero-offer" aria-label="Resumo da oferta">
          <p>Sua decisão pelos próximos 21 dias</p>
          <strong>8x de R$ 4,74 + juros</strong>
          <span>R$ 37,89 à vista</span>
          <small>O parcelamento tem juros e o valor final aparece antes da confirmação.</small>

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
            Garantir minha vaga
            <ArrowRight size={18} />
          </a>
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
              <strong>8x de R$ 4,74 + juros</strong>
              <small>R$ 37,89 à vista. Valor final parcelado exibido pela Kiwify antes da confirmação.</small>
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
        </div>

        <form className="lead-form" id="inscricao" onSubmit={handleLeadSubmit}>
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

          <label>
            Principal objetivo
            <select name="objetivo" required defaultValue="">
              <option value="" disabled>
                Escolha seu foco principal
              </option>
              <option value="emagrecimento">Emagrecer e reduzir medidas</option>
              <option value="gluteos">Melhorar glúteos e firmeza corporal</option>
              <option value="autoestima">Recuperar autoestima</option>
              <option value="roupas">Voltar a usar roupas antigas</option>
            </select>
          </label>

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
            {loading ? "Enviando..." : "Garantir minha vaga agora"}
            <ArrowRight size={18} />
          </button>

          <small>
            Depois da aprovação, você recebe boas-vindas, materiais e acesso ao
            grupo oficial.
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
          Quero fazer parte
          <ArrowRight size={18} />
        </a>
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
