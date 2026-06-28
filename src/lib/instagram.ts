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

/** GET do Graph API (para checar status de containers). */
async function graphGet(path: string, fields: string) {
  const { token } = creds();
  const url = `${GRAPH}/${path}?fields=${fields}&access_token=${token}`;
  const r = await fetch(url);
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || `Graph GET erro em ${path}`);
  return data as { id?: string; status_code?: string };
}

/** Espera container ficar FINISHED (poll de status). Timeout: maxMs ms. */
async function waitContainerReady(containerId: string, maxMs = 55000): Promise<void> {
  const start = Date.now();
  let delay = 3000; // começa com 3s
  while (Date.now() - start < maxMs) {
    await new Promise((r) => setTimeout(r, delay));
    const s = await graphGet(containerId, "status_code");
    if (s.status_code === "FINISHED") return;
    if (s.status_code === "ERROR") throw new Error(`Container ${containerId} falhou no processamento (ERROR).`);
    if (s.status_code === "EXPIRED") throw new Error(`Container ${containerId} expirou antes de publicar.`);
    delay = Math.min(delay * 1.5, 8000); // backoff: 3s → 4.5s → 6.75s → 8s
  }
  throw new Error(`Container ${containerId} não ficou pronto em ${maxMs / 1000}s (timeout).`);
}

/** Publica imagem única (feed). caption opcional. Retorna media id. */
export async function publishImage(imageUrl: string, caption = "") {
  const { igId } = creds();
  const container = await graph(`${igId}/media`, { image_url: imageUrl, caption });
  if (!container.id) throw new Error("Falha ao criar container de imagem.");
  // Espera container processar antes de publicar
  await waitContainerReady(container.id);
  const published = await graph(`${igId}/media_publish`, { creation_id: container.id });
  return published.id;
}

/** Publica Reel (vídeo). caption opcional. */
export async function publishReel(videoUrl: string, caption = "") {
  const { igId } = creds();
  const container = await graph(`${igId}/media`, { media_type: "REELS", video_url: videoUrl, caption });
  if (!container.id) throw new Error("Falha ao criar container de reel.");
  // Reels processam mais — polling até 55s
  await waitContainerReady(container.id);
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
  if (children.length < 2) throw new Error(`Carrossel precisa de ≥2 imagens válidas. Obteve: ${children.length}.`);
  const container = await graph(`${igId}/media`, {
    media_type: "CAROUSEL",
    children: children.join(","),
    caption,
  });
  if (!container.id) throw new Error("Falha ao criar container de carrossel.");
  // Carrossel com múltiplas imagens pode demorar — polling até 55s
  await waitContainerReady(container.id);
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
