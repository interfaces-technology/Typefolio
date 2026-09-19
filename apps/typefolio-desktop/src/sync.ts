import * as fs from "fs";
import * as https from "https";
import * as path from "path";

import { FONT_INSTALL_DIR, WEB_APP_URL } from "./config";
import { store } from "./store";

function apiRequest<T>(
  urlPath: string,
  options: { method?: string; etag?: string } = {},
): Promise<{ status: number; etag?: string; body?: T }> {
  return new Promise((resolve, reject) => {
    const token = store.get("token");
    const url = new URL(urlPath, WEB_APP_URL);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    if (options.etag) {
      headers["If-None-Match"] = options.etag;
    }

    const req = https.request(url, { method: options.method ?? "GET", headers }, (res) => {
      if (res.statusCode === 304) {
        return resolve({ status: 304, etag: options.etag });
      }

      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        try {
          const body = JSON.parse(raw) as T;
          resolve({ status: res.statusCode ?? 200, etag: res.headers.etag, body });
        } catch {
          resolve({ status: res.statusCode ?? 200, body: undefined });
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

function downloadFont(urlPath: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const token = store.get("token");
    const url = new URL(urlPath, WEB_APP_URL);
    const headers = { Authorization: `Bearer ${token}` };

    const req = https.request(url, { headers }, (res) => {
      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
      file.on("error", reject);
    });

    req.on("error", reject);
    req.end();
  });
}

interface ManifestEntry {
  id: string;
  originalName: string;
  extension: string;
}

interface ManifestResponse {
  libraryId: string;
  fonts: ManifestEntry[];
}

interface MeResponse {
  library: { id: string };
}

async function resolveLibraryId(): Promise<string | null> {
  const cached = store.get("libraryId");
  if (cached) return cached;

  const result = await apiRequest<MeResponse>("/api/me");
  if (result.status === 200 && result.body?.library?.id) {
    store.set("libraryId", result.body.library.id);
    return result.body.library.id;
  }
  return null;
}

export async function syncFonts(log: (msg: string) => void): Promise<void> {
  const token = store.get("token");
  if (!token) return;

  const libraryId = await resolveLibraryId();
  if (!libraryId) {
    log("Could not resolve library ID");
    return;
  }

  const etag = store.get("manifestEtag");
  const result = await apiRequest<ManifestResponse>(
    `/api/libraries/${libraryId}/manifest`,
    { etag },
  );

  if (result.status === 304) {
    return;
  }

  if (result.status !== 200 || !result.body) {
    log(`Manifest fetch failed with status ${result.status}`);
    return;
  }

  if (result.etag) {
    store.set("manifestEtag", result.etag);
  }

  const installed = new Set(store.get("installedFontIds"));
  const toInstall = result.body.fonts.filter((f) => !installed.has(f.id));

  if (!fs.existsSync(FONT_INSTALL_DIR)) {
    fs.mkdirSync(FONT_INSTALL_DIR, { recursive: true });
  }

  for (const font of toInstall) {
    const dest = path.join(FONT_INSTALL_DIR, font.originalName);
    try {
      await downloadFont(`/api/libraries/${libraryId}/fonts/${font.id}`, dest);
      installed.add(font.id);
      log(`Installed: ${font.originalName}`);
    } catch (err) {
      log(`Failed to install ${font.originalName}: ${String(err)}`);
    }
  }

  store.set("installedFontIds", Array.from(installed));
}
