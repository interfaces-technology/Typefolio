import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import * as fs from "fs";
import * as https from "https";
import * as path from "path";
import * as url from "url";

import { apiRequest } from "./api";
import { AUTH_WEB_URL, SYNC_INTERVAL_MS } from "./config";
import { store } from "./store";
import { syncFonts } from "./sync";

let mainWindow: BrowserWindow | null = null;
let lastSyncStatus = "idle";

// ─── Window ────────────────────────────────────────────────────────────────

function rendererPath(file: string): string {
  return path.join(__dirname, "..", "renderer", file);
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 920,
    height: 640,
    minWidth: 700,
    minHeight: 500,
    title: "Typefolio",
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0a0a0a",
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  const token = store.get("token");
  if (token) {
    mainWindow.loadFile(rendererPath("app.html"));
  } else {
    mainWindow.loadFile(rendererPath("landing.html"));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    shell.openExternal(targetUrl);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => { mainWindow = null; });
}

function navigateTo(file: string): void {
  mainWindow?.loadFile(rendererPath(file));
}

// ─── Deep link / auth ──────────────────────────────────────────────────────

app.setAsDefaultProtocolClient("typefolio");

function handleDeepLink(deepLink: string): void {
  try {
    const parsed = new url.URL(deepLink);
    if (parsed.hostname === "auth" && parsed.pathname.startsWith("/callback")) {
      const token = parsed.searchParams.get("token");
      const email = parsed.searchParams.get("email");
      if (token && email) {
        store.set("token", token);
        store.set("email", email);
        store.set("libraryId", "");
        store.set("manifestEtag", "");
        startSync();
        if (mainWindow) {
          mainWindow.focus();
          mainWindow.loadFile(rendererPath("app.html"));
        }
      }
    }
  } catch { /* ignore malformed links */ }
}

app.on("open-url", (_event, deepLink) => { handleDeepLink(deepLink); });

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const deepLink = argv.find((a) => a.startsWith("typefolio://"));
    if (deepLink) handleDeepLink(deepLink);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ─── Sync ──────────────────────────────────────────────────────────────────

let syncTimer: ReturnType<typeof setInterval> | null = null;

function startSync(): void {
  if (syncTimer) return;
  runSync();
  syncTimer = setInterval(runSync, SYNC_INTERVAL_MS);
}

function runSync(): void {
  void syncFonts((msg) => {
    lastSyncStatus = msg;
    mainWindow?.webContents.send("sync-update", msg);
  });
}

// ─── IPC handlers ──────────────────────────────────────────────────────────

ipcMain.handle("sign-in", async () => {
  const redirectUri = encodeURIComponent("typefolio://auth/callback");
  await shell.openExternal(`${AUTH_WEB_URL}/auth/desktop?redirect_uri=${redirectUri}`);
});

ipcMain.handle("sign-out", () => {
  store.set("token", "");
  store.set("email", "");
  store.set("libraryId", "");
  store.set("manifestEtag", "");
  store.set("installedFontIds", []);
  if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }
  navigateTo("landing.html");
});

ipcMain.handle("get-user", () => ({
  email: store.get("email"),
  token: store.get("token"),
}));

ipcMain.handle("get-library", async () => {
  const token = store.get("token");
  if (!token) return { error: "not authenticated" };

  const me = await apiRequest<{ library: { id: string } }>("/api/me", token);
  if (me.status !== 200 || !me.body) return { error: "failed to load" };

  const libId = me.body.library.id;
  store.set("libraryId", libId);

  const families = await apiRequest<{ families: unknown[] }>(
    `/api/libraries/${libId}/families`,
    token,
  );

  return {
    libraryId: libId,
    families: families.body?.families ?? [],
  };
});

ipcMain.handle("upload-fonts", async () => {
  if (!mainWindow) return { error: "no window" };
  const token = store.get("token");
  const libId = store.get("libraryId");
  if (!token || !libId) return { error: "not authenticated" };

  const result = await dialog.showOpenDialog(mainWindow, {
    title: "Choose font files",
    buttonLabel: "Upload",
    filters: [{ name: "Fonts", extensions: ["ttf", "otf", "woff", "woff2"] }],
    properties: ["openFile", "multiSelections"],
  });

  if (result.canceled || result.filePaths.length === 0) return { canceled: true };

  // Build multipart form manually using the fetch API via a renderer call
  // Instead, do it in main via https module
  const boundary = `----TypefolioUpload${Date.now()}`;
  const parts: Buffer[] = [];

  for (const filePath of result.filePaths) {
    const filename = path.basename(filePath);
    const data = fs.readFileSync(filePath);
    const header = Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`,
    );
    parts.push(header, data, Buffer.from("\r\n"));
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`));
  const body = Buffer.concat(parts);

  return new Promise((resolve) => {
    const reqUrl = new URL(`/api/fonts`, WEB_APP_URL);
    const req = https.request(
      reqUrl,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          "Content-Length": body.length,
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          try {
            resolve({ ok: true, result: JSON.parse(Buffer.concat(chunks).toString()) });
          } catch {
            resolve({ ok: res.statusCode === 200 });
          }
        });
      },
    );
    req.on("error", (e) => resolve({ error: String(e) }));
    req.write(body);
    req.end();
  });
});

ipcMain.handle("delete-font", async (_event, fontId: string) => {
  const token = store.get("token");
  const libId = store.get("libraryId");
  if (!token || !libId) return { error: "not authenticated" };
  const res = await apiRequest(`/api/libraries/${libId}/fonts/${fontId}`, token, { method: "DELETE" });
  return { ok: res.status === 200 || res.status === 204 };
});

ipcMain.handle("download-all", async () => {
  if (!mainWindow) return;
  const token = store.get("token");
  const libId = store.get("libraryId");
  if (!token || !libId) return;
  const savePath = await dialog.showSaveDialog(mainWindow, {
    defaultPath: "typefolio-fonts.zip",
    filters: [{ name: "ZIP archive", extensions: ["zip"] }],
  });
  if (savePath.canceled || !savePath.filePath) return;

  await new Promise<void>((resolve) => {
    const file = fs.createWriteStream(savePath.filePath!);
    const reqUrl = new URL(`/api/libraries/${libId}/download`, WEB_APP_URL);
    https.get(reqUrl, { headers: { Authorization: `Bearer ${token}` } }, (res) => {
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(); });
    }).on("error", () => resolve());
  });
});

ipcMain.handle("get-sync-status", () => lastSyncStatus);

// ─── Lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();
  if (store.get("token")) startSync();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (syncTimer) { clearInterval(syncTimer); syncTimer = null; }
});
