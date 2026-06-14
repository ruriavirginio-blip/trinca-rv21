import { createReadStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface RenderRequest {
  videoUrl: string;
  gancho: string;
  gatilho: string;
  legenda: string;
  audioUrl?: string;
  durationSeconds?: number;
  postId?: string;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readGoogleCredentials() {
  const rawCredentials = cleanText(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

  if (!rawCredentials) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON nao configurado.");
  }

  return JSON.parse(rawCredentials);
}

export async function POST(request: NextRequest) {
  try {
    const body: RenderRequest = await request.json();
    const videoUrl = cleanText(body.videoUrl);
    const gancho = cleanText(body.gancho);
    const gatilho = cleanText(body.gatilho);
    const legenda = cleanText(body.legenda);
    const audioUrl = cleanText(body.audioUrl);
    const durationSeconds = body.durationSeconds || 30;

    if (!videoUrl || !gancho || !gatilho) {
      return NextResponse.json(
        { error: "videoUrl, gancho e gatilho sao obrigatorios" },
        { status: 400 },
      );
    }

    if (durationSeconds < 5 || durationSeconds > 180) {
      return NextResponse.json(
        { error: "durationSeconds deve ficar entre 5 e 180 segundos" },
        { status: 400 },
      );
    }

    const durationInFrames = Math.round(durationSeconds * 30);
    const outputFileName = `reel-trinca-${Date.now()}.mp4`;
    const outputDir = "/tmp/remotion-output";
    const outputPath = join(outputDir, outputFileName);

    await mkdir(outputDir, { recursive: true });

    const [{ bundle }, { renderMedia, selectComposition }] = await Promise.all([
      import("@remotion/bundler"),
      import("@remotion/renderer"),
    ]);

    const bundleLocation = await bundle({
      entryPoint: join(process.cwd(), "src/remotion/index.ts"),
      webpackOverride: (config) => config,
    });

    const inputProps = {
      videoSrc: videoUrl,
      gancho,
      gatilho,
      legenda,
      audioSrc: audioUrl || undefined,
    };

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: "ReelTrinca",
      inputProps,
    });

    await renderMedia({
      composition: {
        ...composition,
        durationInFrames,
      },
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: outputPath,
      inputProps,
      timeoutInMilliseconds: Number(process.env.REMOTION_TIMEOUT_IN_MILLISECONDS || 300000),
    });

    const driveUrl = await uploadToDrive(outputPath, outputFileName);

    return NextResponse.json({
      success: true,
      driveUrl,
      fileName: outputFileName,
      message: "Reel renderizado e salvo no Drive com sucesso",
    });
  } catch (error) {
    console.error("Erro na renderizacao Remotion:", error);
    return NextResponse.json(
      { error: "Falha na renderizacao", details: String(error) },
      { status: 500 },
    );
  }
}

async function uploadToDrive(filePath: string, fileName: string): Promise<string> {
  const { google } = await import("googleapis");
  const auth = new google.auth.GoogleAuth({
    credentials: readGoogleCredentials(),
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const drive = google.drive({ version: "v3", auth });
  const folderId = cleanText(process.env.GOOGLE_DRIVE_REELS_FOLDER_ID);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: folderId ? [folderId] : undefined,
    },
    media: {
      mimeType: "video/mp4",
      body: createReadStream(filePath),
    },
    fields: "id, webViewLink",
  });

  if (!response.data.id) {
    throw new Error("Google Drive nao retornou o ID do arquivo.");
  }

  await drive.permissions.create({
    fileId: response.data.id,
    requestBody: { role: "reader", type: "anyone" },
  });

  return response.data.webViewLink || "";
}
