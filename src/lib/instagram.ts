/* Instagram Graph API — publicação automática (motor 24/7)
   Requer env: IG_BUSINESS_ACCOUNT_ID + IG_PAGE_ACCESS_TOKEN
   (ver docs/credenciais-pendentes.md). Sem isso, retorna não-configurado. */

const GRAPH = "https://graph.facebook.com/v21.0";

function clean(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export function hasInstagram() {
  return Boolean(process.env.IG_BUSINESS_ACCOUNT_ID && process.env.IG_PAGE_ACCESS_TOKEN);
}

function creds() {
  return {
    igId: clean(process.env.IG_BUSINESS_ACCOUNT_ID),
    token: clean(process.env.IG_PAGE_ACCESS_TOKEN),
  };
}

async function graph(path: string, params: Record<string, string>) {
  const { token } = creds();
  const body = new URLSearchParams({ ...params, access_token: token });
  const r = await fetch(`${GRAPH}/${path}`, { method: "POST", body });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `Graph erro em ${path}`);
  return data as { id?: string };
}

/** Publica imagem única (feed). caption opcional. Retorna media id. */
export async function publishImage(imageUrl: string, caption = "") {
  const { igId } = creds();
  const container = await graph(`${igId}/media`, { image_url: imageUrl, caption });
  if (!container.id) throw new Error("Falha ao criar container de imagem.");
  const published = await graph(`${igId}/media_publish`, { creation_id: container.id });
  return published.id;
}

/** Publica Reel (vídeo). caption opcional. */
export async function publishReel(videoUrl: string, caption = "") {
  const { igId } = creds();
  const container = await graph(`${igId}/media`, { media_type: "REELS", video_url: videoUrl, caption });
  if (!container.id) throw new Error("Falha ao criar container de reel.");
  // Reels precisam processar antes de publicar — espera curta + publica
  await new Promise((r) => setTimeout(r, 4000));
  const published = await graph(`${igId}/media_publish`, { creation_id: container.id });
  return published.id;
}

/** Publica carrossel (2-10 imagens). */
export async function publishCarousel(imageUrls: string[], caption = "") {
  const { igId } = creds();
  const children: string[] = [];
  for (const url of imageUrls.slice(0, 10)) {
    const c = await graph(`${igId}/media`, { image_url: url, is_carousel_item: "true" });
    if (c.id) children.push(c.id);
  }
  const container = await graph(`${igId}/media`, {
    media_type: "CAROUSEL",
    children: children.join(","),
    caption,
  });
  if (!container.id) throw new Error("Falha ao criar container de carrossel.");
  const published = await graph(`${igId}/media_publish`, { creation_id: container.id });
  return published.id;
}

/** Roteia por tipo. asset_url = imagem/vídeo; para carrossel use lista separada por vírgula. */
export async function publishByType(tipo: string, assetUrl: string, caption = "") {
  if (!hasInstagram()) return { ok: false, reason: "Instagram nao configurado (IG_BUSINESS_ACCOUNT_ID/IG_PAGE_ACCESS_TOKEN)." };
  try {
    let mediaId: string | undefined;
    if (tipo === "reel") mediaId = await publishReel(assetUrl, caption);
    else if (tipo === "carrossel") mediaId = await publishCarousel(assetUrl.split(",").map((s) => s.trim()).filter(Boolean), caption);
    else mediaId = await publishImage(assetUrl, caption); // feed/story-fallback
    return { ok: true, mediaId };
  } catch (error) {
    return { ok: false, reason: String(error instanceof Error ? error.message : error) };
  }
}
