import { ZipArchive } from "archiver";
import { PassThrough } from "stream";

import { getUserId } from "./auth";
import {
  addFontsToLibrary,
  deleteFont,
  getAllFontBuffers,
  getFontBuffer,
  getLibraryById,
  getOrCreateUserLibrary,
  reindexLibraryFontMetadata,
} from "../src/lib/storage";
import { listDevices, registerDevice, updateDevice } from "../src/lib/devices";
import { getLibraryManifest } from "../src/lib/manifest";
import type { DevicePlatform } from "../src/lib/types";
import { checkRateLimit } from "../src/lib/rate-limit";

const PLATFORMS: DevicePlatform[] = ["macos", "windows", "linux", "ios"];

function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

function unauthorized(): Response {
  return json({ error: "Sign in required." }, { status: 401 });
}

async function owner(request: Request, libraryId: string): Promise<{ userId: string } | Response> {
  const userId = await getUserId(request);
  if (!userId) return unauthorized();

  const library = await getLibraryById(libraryId);
  if (!library) return json({ error: "Library not found." }, { status: 404 });
  if (library.ownerUserId !== userId) {
    return json({ error: "You do not own this library." }, { status: 403 });
  }

  return { userId };
}

function pathParts(request: Request): string[] {
  const pathname = new URL(request.url).pathname.replace(/^\/api\/?/, "/");
  return pathname.split("/").filter(Boolean);
}

function safeFilename(name: string): string {
  return name.replace(/["\\\r\n]/g, "_");
}

async function upload(request: Request, libraryId: string): Promise<Response> {
  const formData = await request.formData();
  const files = formData
    .getAll("fonts")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return json({ error: "Select at least one font file to upload." }, { status: 400 });
  }

  if (files.length > 20) {
    return json({ error: "You can upload up to 20 font files at once." }, { status: 400 });
  }

  const maxFileSize = 15 * 1024 * 1024;
  const oversized = files.find((file) => file.size > maxFileSize);
  if (oversized) {
    return json(
      { error: `${oversized.name} exceeds the 15 MB per-file limit.` },
      { status: 400 },
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rateLimit = checkRateLimit(`upload-fonts:${ip}`, 30, 60_000);
  if (!rateLimit.allowed) {
    return json(
      { error: "Too many uploads. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  try {
    const result = await addFontsToLibrary(libraryId, files);
    return json({
      library: result.library,
      added: result.added.length,
      rejected: result.rejected,
    });
  } catch {
    return json({ error: "Could not upload fonts." }, { status: 500 });
  }
}

async function downloadFont(request: Request, libraryId: string, fontId: string): Promise<Response> {
  const result = await getFontBuffer(libraryId, fontId);
  if (!result) return json({ error: "Font not found" }, { status: 404 });

  const { buffer, font } = result;
  return new Response(buffer, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeFilename(font.originalName)}"`,
      "Content-Length": String(buffer.length),
    },
  });
}

async function downloadLibrary(libraryId: string): Promise<Response> {
  const library = await getLibraryById(libraryId);
  if (!library) return json({ error: "Library not found" }, { status: 404 });
  if (library.fonts.length === 0) {
    return json({ error: "This library has no fonts to download." }, { status: 400 });
  }

  const fontBuffers = await getAllFontBuffers(libraryId);
  if (fontBuffers.length === 0) {
    return json({ error: "Font files are unavailable." }, { status: 404 });
  }

  const archive = new ZipArchive({ zlib: { level: 9 } });
  const passThrough = new PassThrough();
  archive.pipe(passThrough);

  for (const { buffer, font } of fontBuffers) {
    archive.append(buffer, { name: font.originalName });
  }

  const zipPromise = new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    passThrough.on("data", (chunk: Buffer) => chunks.push(chunk));
    passThrough.on("end", () => resolve(Buffer.concat(chunks)));
    passThrough.on("error", reject);
    archive.on("error", reject);
  });

  await archive.finalize();
  const zipBuffer = await zipPromise;
  const safeName = library.name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();

  return new Response(zipBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeName || "fonts"}.zip"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}

async function handle(request: Request): Promise<Response> {
  const parts = pathParts(request);
  const method = request.method.toUpperCase();

  if (parts.length === 1 && parts[0] === "me" && method === "GET") {
    const userId = await getUserId(request);
    if (!userId) return unauthorized();

    const library = await getOrCreateUserLibrary(userId);
    return json({
      user: { id: userId },
      library: {
        id: library.id,
        name: library.name,
        description: library.description,
        fontCount: library.fonts.length,
        createdAt: library.createdAt,
        updatedAt: library.updatedAt,
      },
    });
  }

  if (parts[0] !== "libraries" || !parts[1]) {
    return json({ error: "Not found." }, { status: 404 });
  }

  const libraryId = parts[1];
  const access = await owner(request, libraryId);
  if (access instanceof Response) return access;

  if (parts.length === 2 && method === "GET") {
    const library = await getLibraryById(libraryId);
    return library
      ? json({ library, isOwner: true })
      : json({ error: "Library not found." }, { status: 404 });
  }

  if (parts[2] === "manifest" && parts.length === 3 && method === "GET") {
    const manifest = await getLibraryManifest(libraryId);
    return manifest
      ? json({ manifest })
      : json({ error: "Library not found." }, { status: 404 });
  }

  if (parts[2] === "download" && parts.length === 3 && method === "GET") {
    return downloadLibrary(libraryId);
  }

  if (parts[2] === "devices") {
    if (parts.length === 3 && method === "GET") {
      return json({ devices: await listDevices(libraryId) });
    }

    if (parts.length === 3 && method === "POST") {
      const body = (await request.json()) as { name?: string; platform?: string };
      if (!body.name?.trim()) return json({ error: "Device name is required." }, { status: 400 });
      if (typeof body.platform !== "string" || !PLATFORMS.includes(body.platform as DevicePlatform)) {
        return json({ error: "Platform must be macos, windows, linux, or ios." }, { status: 400 });
      }

      const result = await registerDevice(libraryId, {
        name: body.name.trim(),
        platform: body.platform as DevicePlatform,
      });
      return result
        ? json(result, { status: 201 })
        : json({ error: "Library not found" }, { status: 404 });
    }

    if (parts.length === 4 && method === "PATCH") {
      const body = (await request.json()) as {
        lastSyncAt?: string;
        installedFontIds?: string[];
      };

      if (body.lastSyncAt !== undefined && typeof body.lastSyncAt !== "string") {
        return json({ error: "lastSyncAt must be an ISO timestamp string." }, { status: 400 });
      }

      if (
        body.installedFontIds !== undefined &&
        (!Array.isArray(body.installedFontIds) ||
          body.installedFontIds.some((item) => typeof item !== "string"))
      ) {
        return json({ error: "installedFontIds must be an array of strings." }, { status: 400 });
      }

      const result = await updateDevice(libraryId, parts[3], {
        lastSyncAt: body.lastSyncAt,
        installedFontIds: body.installedFontIds,
      });
      return result
        ? json(result)
        : json({ error: "Device not found" }, { status: 404 });
    }
  }

  if (parts[2] === "fonts") {
    if (parts.length === 3 && method === "POST") {
      return upload(request, libraryId);
    }

    if (parts.length === 4 && parts[3] === "reindex" && method === "POST") {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
      const rateLimit = checkRateLimit(`reindex-fonts:${ip}`, 10, 60_000);
      if (!rateLimit.allowed) {
        return json(
          { error: "Too many reindex requests. Please wait a moment and try again." },
          {
            status: 429,
            headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
          },
        );
      }

      const force = new URL(request.url).searchParams.get("force") === "1";
      const result = await reindexLibraryFontMetadata(libraryId, { force });
      return result
        ? json(result)
        : json({ error: "Library not found." }, { status: 404 });
    }

    if (parts.length === 4 && method === "GET") {
      return downloadFont(request, libraryId, parts[3]);
    }

    if (parts.length === 4 && method === "DELETE") {
      const deleted = await deleteFont(libraryId, parts[3]);
      return deleted
        ? json({ ok: true })
        : json({ error: "Font not found" }, { status: 404 });
    }
  }

  return json({ error: "Not found." }, { status: 404 });
}

export default {
  async fetch(request: Request): Promise<Response> {
    try {
      return await handle(request);
    } catch (error) {
      console.error(error);
      return json({ error: "Internal server error." }, { status: 500 });
    }
  },
};
