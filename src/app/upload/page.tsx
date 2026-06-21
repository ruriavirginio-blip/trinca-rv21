"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Item = {
  id: string;
  tipo: string;
  tema: string;
  status: string;
  data_post: string | null;
  video_bruto_url: string | null;
  asset_url: string | null;
};

const BUCKET = "cockpit-assets";

export default function UploadVideoBruto() {
  const [itens, setItens] = useState<Item[]>([]);
  const [sel, setSel] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);

  async function load() {
    const r = await fetch("/api/content/upload-video");
    const d = await r.json();
    if (d.ok) setItens(d.itens || []);
  }
  useEffect(() => {
    load();
  }, []);

  async function handleUpload() {
    if (!sel || !file) {
      setMsg("Escolha um roteiro e um vídeo.");
      return;
    }
    setBusy(true);
    setMsg("Gerando link seguro...");
    setPct(5);
    try {
      const signRes = await fetch("/api/content/upload-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sign", contentId: sel, filename: file.name }),
      });
      const sign = await signRes.json();
      if (!sign.ok) throw new Error(sign.error || "falha ao assinar");

      setMsg("Enviando vídeo...");
      setPct(35);
      const supa = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      );
      const up = await supa.storage.from(BUCKET).uploadToSignedUrl(sign.path, sign.token, file, {
        contentType: file.type || "video/mp4",
      });
      if (up.error) throw new Error(up.error.message);

      setMsg("Salvando...");
      setPct(80);
      const conf = await fetch("/api/content/upload-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", contentId: sel, publicUrl: sign.publicUrl }),
      });
      const c = await conf.json();
      if (!c.ok) throw new Error(c.error || "falha ao salvar");

      setPct(100);
      setMsg("✅ Vídeo enviado e vinculado ao roteiro! Pronto pra edição no Remotion.");
      setFile(null);
      setSel("");
      load();
    } catch (e) {
      setMsg("⚠️ Erro: " + String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={S.main}>
      <div style={S.wrap}>
        <h1 style={S.h1}>
          Upload de <span style={{ color: "#f0c969" }}>vídeo bruto</span>
        </h1>
        <p style={S.sub}>Grave no iPhone seguindo o roteiro, depois envie aqui. O vídeo é vinculado ao roteiro e segue pra edição.</p>

        <label style={S.label}>1 · Escolha o roteiro</label>
        <div style={S.list}>
          {itens.length === 0 && <p style={{ color: "#8b887f", fontSize: 14 }}>Nenhum roteiro aguardando vídeo.</p>}
          {itens.map((it) => (
            <button
              key={it.id}
              onClick={() => setSel(it.id)}
              style={{ ...S.item, ...(sel === it.id ? S.itemSel : {}) }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <b style={{ fontSize: 14 }}>{it.tema}</b>
                <span style={S.tag}>{it.tipo}</span>
              </div>
              <span style={{ fontSize: 12, color: "#8b887f" }}>
                {it.data_post || "sem data"} · {it.video_bruto_url ? "🎬 já tem vídeo" : "⬜ sem vídeo"}
              </span>
            </button>
          ))}
        </div>

        <label style={S.label}>2 · Selecione o vídeo (iPhone)</label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          style={S.file}
        />

        <button onClick={handleUpload} disabled={busy || !sel || !file} style={{ ...S.cta, opacity: busy || !sel || !file ? 0.5 : 1 }}>
          {busy ? `Enviando... ${pct}%` : "ENVIAR VÍDEO →"}
        </button>

        {msg && <p style={S.msg}>{msg}</p>}
      </div>
    </main>
  );
}

const S: Record<string, React.CSSProperties> = {
  main: { minHeight: "100vh", background: "#08080a", color: "#f6f4ef", fontFamily: "system-ui, sans-serif", padding: "32px 18px" },
  wrap: { maxWidth: 560, margin: "0 auto" },
  h1: { fontSize: 30, fontWeight: 800, marginBottom: 6 },
  sub: { color: "#a09c94", fontSize: 14, marginBottom: 24, lineHeight: 1.5 },
  label: { display: "block", fontSize: 12, fontWeight: 700, color: "#d4a23c", letterSpacing: ".08em", textTransform: "uppercase", margin: "20px 0 10px" },
  list: { display: "flex", flexDirection: "column", gap: 10 },
  item: { textAlign: "left", background: "#141418", border: "1px solid #26262e", borderRadius: 12, padding: "13px 15px", color: "#f6f4ef", cursor: "pointer", display: "flex", flexDirection: "column", gap: 5 },
  itemSel: { borderColor: "#d4a23c", background: "rgba(212,162,60,0.08)" },
  tag: { fontSize: 11, fontWeight: 700, color: "#f0c969", background: "rgba(212,162,60,0.12)", padding: "2px 9px", borderRadius: 100, height: "fit-content" },
  file: { width: "100%", background: "#141418", border: "1px solid #26262e", borderRadius: 12, padding: 13, color: "#f6f4ef", fontSize: 14 },
  cta: { width: "100%", marginTop: 22, background: "linear-gradient(135deg,#d4a23c,#f0c969)", color: "#1a1206", fontWeight: 800, fontSize: 16, padding: 17, borderRadius: 13, border: "none", cursor: "pointer" },
  msg: { marginTop: 16, fontSize: 14, color: "#f0c969", lineHeight: 1.5 },
};
