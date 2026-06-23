"use client";

/* Página de captura da LISTA VIP do pré-lançamento (sem venda).
   Comentário no Instagram → DM automático → este link → coleta WhatsApp → entra na VIP.
   POST /api/prelancamento/registrar-vip (status lista-vip). Registra acesso em /api/track. */

import { useEffect, useState } from "react";
import { trackLead, createMetaEventId } from "@/lib/meta-pixel";

export default function VipPage() {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [origem, setOrigem] = useState(""); // link de origem (o=story-d1, trafego-d1, ig-dm...)

  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const ig = sp.get("ig") || sp.get("u") || "";
      if (ig) setInstagram(ig);
      setOrigem(sp.get("origem") || sp.get("o") || "");
      let ref = "";
      try { ref = document.referrer || ""; } catch { ref = ""; }
      fetch("/api/track", {
        method: "POST",
        headers: { "content-type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          path: "/vip",
          utm_source: sp.get("utm_source") || "",
          utm_medium: sp.get("utm_medium") || "",
          utm_campaign: sp.get("utm_campaign") || "",
          origem: sp.get("origem") || sp.get("o") || "lista-vip",
          referrer: ref,
        }),
      }).catch(() => {});
    } catch {}
  }, []);

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
    // event_id compartilhado entre Pixel (browser) e CAPI (server) p/ deduplicar o Lead.
    const eventId = createMetaEventId("Lead");
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
          origem_captura: origem || undefined,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || d.error) setErr(d.error || "Deu um erro aqui. Tenta de novo em instantes.");
      else {
        // Conversão de Lead (otimização de tráfego pago p/ a Lista VIP).
        trackLead({ event_id: eventId, content_name: "Lista VIP TRINCA RV21" });
        setDone(true);
      }
    } catch {
      setErr("Sem conexão agora. Tenta de novo.");
    }
    setLoading(false);
  }

  return (
    <main className="wrap">
      <div className="glow" />
      <div className="card">
        <span className="badge"><span className="dot" />LISTA VIP · TRINCA RV21</span>

        {done ? (
          <div className="success">
            <div className="check">✓</div>
            <h1>Você está na <span>lista VIP</span> 🎉</h1>
            <p>Prontinho! Você vai receber o acesso ao TRINCA RV21 <b>antes de todo mundo</b>, direto no seu WhatsApp. Fica de olho — eu te aviso quando abrir. 💛</p>
            <p className="small">Pode fechar essa página. Te vejo lá dentro.</p>
          </div>
        ) : (
          <>
            <h1>Entra na <span>lista VIP</span> e garante seu acesso antecipado</h1>
            <p className="lead">A primeira turma do <b>TRINCA RV21</b> é limitada. Quem está na lista VIP recebe o acesso e o preço de lançamento <b>antes de todo mundo</b> — sem correria.</p>

            <form onSubmit={submit}>
              <label>Seu nome
                <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Como você quer ser chamada" />
              </label>
              <label>Seu WhatsApp
                <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(84) 99999-9999" inputMode="tel" required />
              </label>
              <label>Seu e-mail
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" type="email" inputMode="email" />
              </label>
              <label>Seu @ no Instagram
                <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@seuusuario" required />
              </label>
              {err ? <p className="err">{err}</p> : null}
              <button type="submit" disabled={loading}>
                {loading ? "Entrando..." : "QUERO ENTRAR NA LISTA VIP →"}
              </button>
              <p className="note">É de graça. Você só está garantindo prioridade — nada de cobrança agora.</p>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        .wrap{min-height:100vh;background:#0a0a0b;color:#f5f3ef;display:flex;align-items:center;justify-content:center;padding:24px;font-family:'Plus Jakarta Sans',system-ui,sans-serif;position:relative;overflow:hidden}
        .glow{position:fixed;top:-10%;left:50%;transform:translateX(-50%);width:600px;height:600px;background:radial-gradient(circle,rgba(212,162,60,.14),transparent 60%);pointer-events:none}
        .card{position:relative;z-index:1;width:100%;max-width:460px;background:linear-gradient(165deg,#16161a,#111113);border:1px solid #26262c;border-radius:22px;padding:30px 24px}
        .badge{display:inline-flex;align-items:center;gap:7px;background:rgba(212,162,60,.1);border:1px solid rgba(212,162,60,.28);color:#f0c969;font-size:12px;font-weight:700;padding:7px 14px;border-radius:100px;letter-spacing:.04em;margin-bottom:18px}
        .dot{width:6px;height:6px;background:#f0c969;border-radius:50%;box-shadow:0 0 8px #f0c969}
        h1{font-size:26px;font-weight:800;line-height:1.1;letter-spacing:-.02em;margin-bottom:12px}
        h1 span{color:#f0c969}
        .lead{color:#a3a09a;font-size:14.5px;line-height:1.5;margin-bottom:22px}
        .lead b{color:#f5f3ef}
        form{display:flex;flex-direction:column;gap:14px}
        label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:#d8d5cf}
        label i{color:#6f6c66;font-weight:400}
        input{background:#0f0f12;border:1px solid #26262c;border-radius:12px;padding:13px 14px;color:#f5f3ef;font-size:15px;outline:none}
        input:focus{border-color:rgba(212,162,60,.5)}
        button{margin-top:6px;background:linear-gradient(135deg,#d4a23c,#e8b04a);color:#1a1206;font-weight:800;font-size:16px;padding:16px;border:none;border-radius:12px;cursor:pointer}
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
