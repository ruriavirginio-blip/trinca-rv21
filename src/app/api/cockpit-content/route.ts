import { NextResponse } from "next/server";

type ContentStatus = "RASCUNHO" | "APROVADO" | "PUBLICADO" | "REJEITADO";
type JsonObject = Record<string, unknown>;

const notionVersion = "2022-06-28";
const validStatuses: ContentStatus[] = ["RASCUNHO", "APROVADO", "PUBLICADO", "REJEITADO"];

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function notionConfig() {
  return {
    apiKey: cleanText(process.env.NOTION_API_KEY),
    databaseId: cleanText(process.env.NOTION_CONTENT_DATABASE_ID),
    statusProperty: cleanText(process.env.NOTION_CONTENT_STATUS_PROPERTY) || "Status",
    statusPropertyType: cleanText(process.env.NOTION_CONTENT_STATUS_PROPERTY_TYPE) || "status",
    idProperty: cleanText(process.env.NOTION_CONTENT_ID_PROPERTY) || "Codigo",
  };
}

function configured() {
  const config = notionConfig();

  return Boolean(config.apiKey && config.databaseId);
}

function normalizeStatus(status: unknown): ContentStatus {
  const value = cleanText(status).toUpperCase();

  if (value === "GRAVAR") return "RASCUNHO";
  if (value === "PRONTO") return "APROVADO";
  if (validStatuses.includes(value as ContentStatus)) return value as ContentStatus;

  return "RASCUNHO";
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function plainTextFromRichText(value: unknown) {
  const richText = Array.isArray(value) ? value : [];

  return richText
    .map((item) => cleanText(asObject(item).plain_text))
    .filter(Boolean)
    .join("");
}

function propertyText(property: unknown) {
  const object = asObject(property);
  const type = cleanText(object.type);

  if (type === "title") return plainTextFromRichText(object.title);
  if (type === "rich_text") return plainTextFromRichText(object.rich_text);
  if (type === "select") return cleanText(asObject(object.select).name);
  if (type === "status") return cleanText(asObject(object.status).name);

  return cleanText(object.name);
}

function pageIdFromProperties(properties: JsonObject, fallbackTitle: string, idProperty: string) {
  const explicit = propertyText(properties[idProperty]);

  if (explicit) return explicit.toLowerCase();

  const title = fallbackTitle.toLowerCase();
  const match = title.match(/\bd[1-7]\b/i);

  return match ? match[0].toLowerCase() : "";
}

function pageTitle(properties: JsonObject) {
  for (const property of Object.values(properties)) {
    const object = asObject(property);

    if (cleanText(object.type) === "title") {
      return propertyText(property);
    }
  }

  return "";
}

async function notionFetch(path: string, init: RequestInit = {}) {
  const config = notionConfig();
  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": notionVersion,
      ...(init.headers || {}),
    },
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(cleanText(data.message) || `Notion retornou HTTP ${response.status}.`);
  }

  return data;
}

export async function GET() {
  const config = notionConfig();

  if (!configured()) {
    return NextResponse.json({
      configured: false,
      items: [],
      message: "Configure NOTION_API_KEY e NOTION_CONTENT_DATABASE_ID para sincronizar.",
    });
  }

  const data = await notionFetch(`/databases/${config.databaseId}/query`, {
    method: "POST",
    body: JSON.stringify({ page_size: 50 }),
  });
  const results: unknown[] = Array.isArray(data.results) ? data.results : [];
  const items = results
    .map((page) => {
      const object = asObject(page);
      const properties = asObject(object.properties);
      const title = pageTitle(properties);
      const id = pageIdFromProperties(properties, title, config.idProperty);

      if (!id) return null;

      return {
        id,
        title,
        status: normalizeStatus(propertyText(properties[config.statusProperty])),
        notionUrl: cleanText(object.url),
        notionPageId: cleanText(object.id),
        updatedAt: cleanText(object.last_edited_time),
      };
    })
    .filter(Boolean);

  return NextResponse.json({ configured: true, items });
}

export async function POST(request: Request) {
  const config = notionConfig();
  const body = (await request.json()) as { postId?: unknown; status?: unknown; notionPageId?: unknown };
  const postId = cleanText(body.postId).toLowerCase();
  const status = normalizeStatus(body.status);

  if (!postId || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "postId e status validos sao obrigatorios." }, { status: 400 });
  }

  if (!configured()) {
    return NextResponse.json({
      configured: false,
      ok: true,
      message: "Status salvo localmente. Notion nao configurado.",
    });
  }

  let notionPageId = cleanText(body.notionPageId);

  if (!notionPageId) {
    const data = await notionFetch(`/databases/${config.databaseId}/query`, {
      method: "POST",
      body: JSON.stringify({ page_size: 50 }),
    });
    const results: unknown[] = Array.isArray(data.results) ? data.results : [];
    const match = results.find((page) => {
      const object = asObject(page);
      const properties = asObject(object.properties);
      const title = pageTitle(properties);

      return pageIdFromProperties(properties, title, config.idProperty) === postId;
    });

    notionPageId = cleanText(asObject(match).id);
  }

  if (!notionPageId) {
    return NextResponse.json(
      { error: `Nao encontrei pagina do Notion para o post ${postId}.` },
      { status: 404 },
    );
  }

  await notionFetch(`/pages/${notionPageId}`, {
    method: "PATCH",
    body: JSON.stringify({
      properties: {
        [config.statusProperty]:
          config.statusPropertyType === "select"
            ? {
                select: {
                  name: status,
                },
              }
            : {
                status: {
                  name: status,
                },
              },
      },
    }),
  });

  return NextResponse.json({ configured: true, ok: true, postId, status, notionPageId });
}
