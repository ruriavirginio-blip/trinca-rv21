"use client";

/* /vip-quiz — VARIANTE A/B da captura da LISTA VIP (NÃO substitui /vip).
   Padrão validado na mineração (Lays / BetterMe / Voy): QUIZ curto (~40s) que
   personaliza um "protocolo" e captura no fim, em vez de formulário plano.
   Mesmo backend: POST /api/prelancamento/registrar-vip (status lista-vip) +
   /api/track + Pixel/CAPI. origem_captura="vip-quiz" → permite medir A/B no cockpit. */

import { useEffect, useMemo, useState } from "react";
import { trackLead, createMetaEventId } from "@/lib/meta-pixel";

type Opt = { v: string; label: string; emoji: string };
type Q = { id: string; pergunta: string; opcoes: Opt[] };

const QUIZ: Q[] = [
  {
    id: "faixa",
    pergunta: "Qual a sua fase agora?",
    opcoes: [
      { v: "25-34", label: "25 a 34 anos", emoji: "🌱" },
      { v: "35-44", label: "35 a 44 anos", emoji: "🌿" },
      { v: "45-54", label: "45 a 54 anos", emoji: "🌸" },
      { v: "55+", label: "55 anos ou mais", emoji: "🌺" },
    ],
  },
  {
    id: "dor",
    pergunta: "O que mais te trava hoje?",
    opcoes: [
      { v: "tempo", label: "Falta de tempo na correria", emoji: "⏰" },
      { v: "energia", label: "Acordo já cansada, sem energia", emoji: "🔋" },
      { v: "dores", label: "Dores no corpo / articulações", emoji: "💢" },
      { v: "comeco", label: "Não sei por onde começar", emoji: "🧭" },
    ],
  },
  {
    id: "tempo",
    pergunta: "Quanto tempo por dia cabe na sua rotina?",
    opcoes: [
      { v: "15", label: "Só uns 15 minutos", emoji: "⚡" },
      { v: "30", label: "Uns 30 minutos", emoji: "⏳" },
      { v: "45", label: "45 min ou mais", emoji: "💪" },
    ],
  },
  {
    id: "historico",
    pergunta: "Já tentou começar antes?",
    opcoes: [
      { v: "varias", label: "Sim, e parei várias vezes", emoji: "🔁" },
      { v: "uma", label: "Sim, uma vez", emoji: "1️⃣" },
      { v: "nunca", label: "Nunca tentei de verdade", emoji: "✨" },
    ],
  },
  {
    id: "objetivo",
    pergunta: "Se desse certo em 21 dias, o que você mais queria?",
    opcoes: [
      { v: "energia", label: "Ter energia e disposição", emoji: "☀️" },
      { v: "emagrecer", label: "Secar e me sentir bem no espelho", emoji: "🔥" },
      { v: "dores", label: "Aliviar as dores e me mexer melhor", emoji: "🧘‍♀️" },
      { v: "habito", label: "Criar o hábito e não desistir", emoji: "🌟" },
    ],
  },
];

const OBJ_LABEL: Record<string, string> = {
  energia: "Energia & disposição",
  emagrecer: "Secar com saúde",
  dores: "Alívio de dores & mobilidade",
  habito: "Criar o hábito (21 dias)",
};

function protocolo(ans: Record<string, string>) {
  const min = ans.tempo === "45" ? "45 min" : ans.tempo === "30" ? "30 min" : "15 min";
  const focoMap: Record<string, string> = {
    energia: "ativação leve + respiração pra destravar a energia logo cedo",
    emagrecer: "treino guiado em casa + dieta por objetivo, sem passar fome",
    dores: "movimentos seguros de baixo impacto pra aliviar as dores",
    habito: "passo a passo curto e diário pra você não desistir dessa vez",
  };
  const foco = focoMap[ans.objetivo] || focoMap.energia;
  const acolhe =
    ans.historico === "varias"
      ? "Você não falhou antes — o método é que falhou com você. Esse foi desenhado pra vida real."
      : ans.historico === "uma"
      ? "Dessa vez é diferente: feito pra caber na sua rotina, um passo por vez."
      : "Começar do zero é mais fácil quando alguém te guia todo dia.";
  return { min, foco, acolhe };
}

export default function VipQuizPage() {
  const [step, setStep] = useState(0); // 0 = intro; 1..N = perguntas; N+1 = montando; N+2 = resultado/form
  const [ans, setAns] = useState<Record<string, string>>({});
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [origem, setOrigem] = useState("");

  const total = QUIZ.length;
  const introStep = 0;
  const firstQ = 1;
  const buildingStep = total + 1;
  const resultStep = total + 2;

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const ig = sp.get("ig") || sp.get("u") || "";
      if (ig) setInstagram(ig);
      setOrigem(sp.get("origem") || sp.get("o") || "vip-quiz");
      let ref = "";
      try { ref = document.referrer || ""; } catch { ref = ""; }
      fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          path: "/vip-quiz",
          utm_source: sp.get("utm_source") || "",
          utm_medium: sp.get("utm_medium") || "",
          utm_campaign: sp.get("utm_campaign") || "",
          origem: sp.get("origem") || sp.get("o") || "vip-quiz",
          referrer: ref,
        }),
      }).catch(() => {});
    } catch {}
  }, []);

  const prot = useMemo(() => protocolo(ans), [ans]);

  function escolher(qid: string, v: string) {
    const next = { ...ans, [qid]: v };
    setAns(next);
    if (step >= total) return;
    if (step === total) {
      setStep(buildingStep);
    } else {
      const ns = step + 1;
      setStep(ns);
      if (ns > total) setStep(buildingStep);
    }
  }

  // avança automaticamente da tela "montando" pro resultado
  useEffect(() => {
    if (step === buildingStep) {
      const t = setTimeout(() => setStep(resultStep), 1600);
      return () => clearTimeout(t);
    }
  }, [step, buildingStep, resultStep]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const digits = whatsapp.replace(/\D/g, "");
    if (digits.length < 10) {
      setErr("Coloca seu WhatsApp com DDD, tá? Ex: (84) 99999-9999");
      return;
    }
    if (!instagram.trim()) {
      setErr("Coloca seu @ do Instagram também 🙂");
      return;
    }
    setLoading(true);
    setErr("");
    const eventId = createMetaEventId("Lead");
    const objetivo = [
      OBJ_LABEL[ans.objetivo] || "Lista VIP",
      ans.faixa || "",
      ans.dor || "",
    ]
      .filter(Boolean)
      .join(" · ");
    try {
      const r = await fetch("/api/prelancamento/registrar-vip", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          whatsapp: digits,
          email: email.trim(),
          instagram_user: instagram.trim().replace(/^@+/, ""),
          event_id: eventId,
          objetivo,
          origem_captura: origem || "vip-quiz",
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.error) setErr(d.error || "Deu um erro aqui. Tenta de novo em instantes.");
      else {
        trackLead({ event_id: eventId, content_name: "Lista VIP TRINCA RV21 (quiz)" });
        setDone(true);
      }
    } catch {
      setErr("Sem conexão agora. Tenta de novo.");
    }
    setLoading(false);
  }

  const pct = Math.round((Math.min(step, total) / total) * 100);

  return (
    <main className="wrap">
      <div className="glow" />
      <div className="card">
        <span className="badge"><span className="dot" />TESTE RÁPIDO · TRINCA RV21</span>

        {/* barra de progresso (some na intro/sucesso) */}
        {step >= firstQ && step <= total && !done ? (
          <div className="bar"><span style={{ width: `${pct}%` }} /></div>
        ) : null}

        {done ? (
          <div className="success">
            <div className="check">✓</div>
            <h1>Seu protocolo está <span>reservado</span> 🎉</h1>
            <p>Prontinho, {nome ? nome.split(" ")[0] : "linda"}! Seu protocolo de 21 dias foi montado e você entrou na <b>lista VIP</b>. Vou te mandar tudo no WhatsApp <b>antes de todo mundo</b>. 💛</p>
            <p className="small">Pode fechar essa página. Te vejo lá dentro.</p>
          </div>
        ) : step === introStep ? (
          <>
            <h1>Descubra seu <span>protocolo de 21 dias</span> ideal</h1>
            <p className="lead">Responde 5 perguntinhas (leva <b>40 segundos</b>) e eu monto um plano que cabe na <b>sua</b> rotina. No fim, você garante sua vaga na <b>turma VIP</b> — sem custo agora.</p>
            <button className="cta" onClick={() => setStep(firstQ)}>COMEÇAR O TESTE →</button>
            <p className="note">É de graça. Você só está garantindo prioridade.</p>
          </>
        ) : step === buildingStep ? (
          <div className="building">
            <div className="spinner" />
            <h1>Montando seu protocolo…</h1>
            <p className="lead">Cruzando suas respostas pra desenhar o plano de 21 dias certo pra você.</p>
          </div>
        ) : step === resultStep ? (
          <>
            <h1>Seu protocolo <span>está pronto</span> ✨</h1>
            <div className="prot">
              <p><b>Foco:</b> {prot.foco}.</p>
              <p><b>Tempo/dia:</b> {prot.min}, guiado, todo dia.</p>
              <p className="acolhe">{prot.acolhe}</p>
            </div>
            <p className="lead">Deixa seu contato que eu te mando o protocolo completo e garanto sua vaga na <b>turma VIP</b> (acesso e preço de lançamento antes de todo mundo):</p>
            <form onSubmit={submit}>
              <label>Seu nome
                <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como você quer ser chamada" />
              </label>
              <label>Seu WhatsApp
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(84) 99999-9999" inputMode="tel" required />
              </label>
              <label>Seu @ no Instagram
                <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@seuusuario" required />
              </label>
              <label>Seu e-mail <i>(opcional)</i>
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" type="email" inputMode="email" />
              </label>
              {err ? <p className="err">{err}</p> : null}
              <button type="submit" disabled={loading}>
                {loading ? "Reservando..." : "RECEBER MEU PROTOCOLO + VAGA VIP →"}
              </button>
              <p className="note">Nada de cobrança agora. Você só garante prioridade.</p>
            </form>
          </>
        ) : (
          // perguntas
          <>
            <h1 className="q">{QUIZ[step - 1].pergunta}</h1>
            <div className="opts">
              {QUIZ[step - 1].opcoes.map((o) => (
                <button
                  key={o.v}
                  className={`opt ${ans[QUIZ[step - 1].id] === o.v ? "sel" : ""}`}
                  onClick={() => escolher(QUIZ[step - 1].id, o.v)}
                >
                  <span className="oe">{o.emoji}</span>{o.label}
                </button>
              ))}
            </div>
            {step > firstQ ? (
              <button className="back" onClick={() => setStep(step - 1)}>← voltar</button>
            ) : null}
          </>
        )}
      </div>

      <style jsx>{`
        .wrap{min-height:100vh;background:#0a0a0b;color:#f5f3ef;display:flex;align-items:center;justify-content:center;padding:24px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;position:relative;overflow:hidden}
        .glow{position:fixed;top:-10%;left:50%;transform:translateX(-50%);width:600px;height:600px;background:radial-gradient(circle,rgba(212,162,60,.14),transparent 60%);pointer-events:none}
        .card{position:relative;z-index:1;width:100%;max-width:460px;background:linear-gradient(165deg,#16161a,#111113);border:1px solid #26262c;border-radius:22px;padding:30px 24px}
        .badge{display:inline-flex;align-items:center;gap:7px;background:rgba(212,162,60,.1);border:1px solid rgba(212,162,60,.28);color:#f0c969;font-size:12px;font-weight:700;padding:7px 14px;border-radius:100px;letter-spacing:.04em;margin-bottom:18px}
        .dot{width:6px;height:6px;background:#f0c969;border-radius:50%;box-shadow:0 0 8px #f0c969}
        .bar{height:6px;background:#1d1d22;border-radius:100px;overflow:hidden;margin-bottom:20px}
        .bar span{display:block;height:100%;background:linear-gradient(90deg,#d4a23c,#e8b04a);border-radius:100px;transition:width .3s ease}
        h1{font-size:26px;font-weight:800;line-height:1.12;letter-spacing:-.02em;margin-bottom:12px}
        h1.q{font-size:22px;margin-bottom:18px}
        h1 span{color:#f0c969}
        .lead{color:#a3a09a;font-size:14.5px;line-height:1.5;margin-bottom:22px}
        .lead b{color:#f5f3ef}
        .cta{width:100%;background:linear-gradient(135deg,#d4a23c,#e8b04a);color:#1a1206;font-weight:800;font-size:16px;padding:16px;border:none;border-radius:12px;cursor:pointer}
        .opts{display:flex;flex-direction:column;gap:11px}
        .opt{display:flex;align-items:center;gap:11px;text-align:left;background:#0f0f12;border:1px solid #26262c;border-radius:14px;padding:15px 15px;color:#f5f3ef;font-size:15px;font-weight:600;cursor:pointer;transition:border-color .2s,transform .1s}
        .opt:hover{border-color:rgba(212,162,60,.5)}
        .opt:active{transform:scale(.99)}
        .opt.sel{border-color:#e8b04a;background:rgba(212,162,60,.08)}
        .oe{font-size:20px}
        .back{margin-top:16px;background:none;border:none;color:#6f6c66;font-size:13px;cursor:pointer;padding:4px}
        .building{text-align:center;padding:24px 0}
        .spinner{width:46px;height:46px;border:4px solid #26262c;border-top-color:#e8b04a;border-radius:50%;margin:0 auto 20px;animation:spin .8s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .prot{background:#0f0f12;border:1px solid #26262c;border-radius:14px;padding:16px;margin-bottom:18px;display:flex;flex-direction:column;gap:8px}
        .prot p{color:#cfccc6;font-size:14px;line-height:1.5}
        .prot b{color:#f0c969}
        .prot .acolhe{color:#a3a09a;font-style:italic;border-top:1px solid #26262c;padding-top:10px;margin-top:2px}
        form{display:flex;flex-direction:column;gap:14px}
        label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:#d8d5cf}
        label i{color:#6f6c66;font-weight:400}
        input{background:#0f0f12;border:1px solid #26262c;border-radius:12px;padding:13px 14px;color:#f5f3ef;font-size:15px;outline:none}
        input:focus{border-color:rgba(212,162,60,.5)}
        button[type=submit]{margin-top:6px;background:linear-gradient(135deg,#d4a23c,#e8b04a);color:#1a1206;font-weight:800;font-size:16px;padding:16px;border:none;border-radius:12px;cursor:pointer}
        button:disabled{opacity:.7}
        .note{text-align:center;font-size:12px;color:#6f6c66;margin-top:4px}
        .err{background:rgba(240,122,122,.1);border:1px solid rgba(240,122,122,.3);color:#f0a3a3;font-size:13px;padding:10px 12px;border-radius:10px}
        .success{text-align:center;padding:10px 0}
        .check{width:60px;height:60px;border-radius:50%;background:rgba(95,208,138,.15);color:#5fd08a;font-size:30px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 18px}
        .success h1{font-size:24px}
        .success p{color:#a3a09a;font-size:14.5px;line-height:1.55;margin-top:10px}
        .success p b{color:#f5f3ef}
        .success .small{font-size:12.5px;color:#6f6c66;margin-top:14px}
      `}</style>
    </main>
  );
}
