"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  tipo: string;
  tema: string;
  status: string;
  data_post: string | null;
  video_bruto_url: string | null;
  asset_url: string | null;
};

// Upload direto pro Cloudinary (unsigned) — sem o teto de 50 MB do Supabase free.
// Fallback no cloud name evita "falha de rede" caso o env não esteja em produção.
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "drfs4s18a";
const UPLOAD_PRESET = "trinca_raw_unsigned"; // preset unsigned criado no Cloudinary
// Worker do Remotion no Railway — o navegador chama DIRETO (render ~80-90s > limite da Vercel).
const WORKER = process.env.NEXT_PUBLIC_REMOTION_WORKER_URL || "https://trinca-remotion-worker-production.up.railway.app";

// Upload em PEDAÇOS (chunked) pro Cloudinary — remove o teto de ~100 MB do upload
// unsigned em request único. Reel bruto de iPhone (centenas de MB) sobe sem "falha de rede".
async function uploadChunked(
  file: File,
  cloud: string,
  preset: string,
  onPct: (n: number) => void,
): Promise<string> {
  const CHUNK = 20 * 1024 * 1024; // 20 MB por pedaço (Cloudinary exige >= 5 MB, menos o último)
  const total = file.size;
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let start = 0;
  let secureUrl = "";

  while (start < total) {
    const end = Math.min(start + CHUNK, total);
    const blob = file.slice(start, end);
    const fd = new FormData();
    fd.append("upload_preset", preset);
    fd.append("file", blob);

    // eslint-disable-next-line no-await-in-loop
    const res = await new Promise<{ secure_url?: string; error?: { message?: string } }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloud}/auto/upload`);
      xhr.setRequestHeader("X-Unique-Upload-Id", uniqueId);
      xhr.setRequestHeader("Content-Range", `bytes ${start}-${end - 1}/${total}`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const done = start + e.loaded;
          onPct(Math.max(5, Math.min(90, Math.round((done / total) * 90))));
        }
      };
      xhr.onload = () => {
        try {
          const r = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) resolve(r);
          else reject(new Error(r?.error?.message || `Cloudinary HTTP ${xhr.status}`));
        } catch {
          reject(new Error("Resposta inválida do Cloudinary"));
        }
      };
      xhr.onerror = () => reject(new Error("Falha de rede no upload"));
      xhr.send(fd);
    });

    if (res.secure_url) secureUrl = res.secure_url;
    start = end;
  }

  if (!secureUrl) throw new Error("Upload incompleto (sem secure_url do Cloudinary)");
  return secureUrl;
}

export default function UploadVideoBruto() {
  const [itens, setItens] = useState<Item[]>([]);
  const [sel, setSel] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [gancho, setGancho] = useState("Você não falhou. O método é que falhou.");
  const [gatilho, setGatilho] = useState("Entra na lista VIP");

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
    setMsg("Enviando vídeo...");
    setPct(5);
    try {
      // 1) Upload em PEDAÇOS pro Cloudinary (unsigned) — sem teto de tamanho, com progresso real.
      const secureUrl = await uploadChunked(file, CLOUD, UPLOAD_PRESET, setPct);

      // 2) Grava a URL do Cloudinary no roteiro (alimenta o Remotion).
      setMsg("Salvando...");
      setPct(95);
      const conf = await fetch("/api/content/upload-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", contentId: sel, publicUrl: secureUrl }),
      });
      const c = await conf.json();
      if (!c.ok) throw new Error(c.error || "falha ao salvar");

      // 3) Edição no Remotion — navegador chama o worker DIRETO e espera (~1-2 min).
      setPct(98);
      setMsg("✂️ Editando no Remotion (premium)… leva ~1-2 min. NÃO feche a página.");
      let editedUrl = "";
      try {
        const rr = await fetch(`${WORKER}/render`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoUrl: secureUrl,
            gancho: gancho.trim() || "Você não falhou",
            gatilho: gatilho.trim() || "Entra na lista VIP",
          }),
        });
        const rj = await rr.json();
        if (rj?.success && rj.cloudinaryUrl) editedUrl = String(rj.cloudinaryUrl);
        else throw new Error(rj?.error || rj?.details || "render falhou");
      } catch (err) {
        setPct(100);
        setMsg("⚠️ Vídeo bruto salvo, mas a edição no Remotion falhou: " + String(err) + ". Tente enviar de novo.");
        setBusy(false);
        load();
        return;
      }

      // 4) Salva o reel EDITADO na fila pra aprovação (aparece em Conteúdo › Materiais do dia).
      await fetch("/api/content-factory", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sel, asset_url: editedUrl, status: "em_aprovacao" }),
      });

      setPct(100);
      setMsg("✅ Reel editado pelo Remotion e na fila pra aprovar! Veja em Conteúdo › Materiais do dia.");
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

        <label style={S.label}>3 · Textos do reel (aparecem na edição premium)</label>
        <input value={gancho} onChange={(e) => setGancho(e.target.value)} placeholder="Gancho — frase de abertura" style={S.file} />
        <input value={gatilho} onChange={(e) => setGatilho(e.target.value)} placeholder="Gatilho — CTA final (ex: Entra na lista VIP)" style={{ ...S.file, marginTop: 8 }} />

        <button onClick={handleUpload} disabled={busy || !sel || !file} style={{ ...S.cta, opacity: busy || !sel || !file ? 0.5 : 1 }}>
          {busy ? `Processando... ${pct}%` : "ENVIAR + EDITAR NO REMOTION →"}
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
