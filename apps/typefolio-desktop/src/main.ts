import { app, BrowserWindow, shell } from "electron";
import * as path from "path";
import * as url from "url";

import { SYNC_INTERVAL_MS, WEB_APP_URL } from "./config";
import { store } from "./store";
import { syncFonts } from "./sync";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    title: "Typefolio",
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.loadURL(WEB_APP_URL);

  // Open external links in the system browser
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    shell.openExternal(targetUrl);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Handle typefolio:// deep links for auth callbacks (OAuth flow)
app.setAsDefaultProtocolClient("typefolio");

function handleDeepLink(deepLink: string): void {
  const parsed = new url.URL(deepLink);
  if (parsed.hostname === "auth" && parsed.pathname.startsWith("/callback")) {
    const token = parsed.searchParams.get("token");
    const email = parsed.searchParams.get("email");
    if (token && email) {
      store.set("token", token);
      store.set("email", email);
      startSync();
    }
  }
  if (mainWindow) {
    mainWindow.focus();
    mainWindow.loadURL(WEB_APP_URL);
  }
}

// macOS: deep link arrives via open-url
app.on("open-url", (_event, deepLink) => {
  handleDeepLink(deepLink);
});

// Windows: deep link arrives as a process argument
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    const deepLink = argv.find((arg) => arg.startsWith("typefolio://"));
    if (deepLink) handleDeepLink(deepLink);
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

let syncTimer: ReturnType<typeof setInterval> | null = null;

function startSync(): void {
  if (syncTimer) return;
  void syncFonts((msg) => console.log("[sync]", msg));
  syncTimer = setInterval(() => {
    void syncFonts((msg) => console.log("[sync]", msg));
  }, SYNC_INTERVAL_MS);
}

app.whenReady().then(() => {
  createWindow();

  // Start syncing if we already have credentials
  if (store.get("token")) {
    startSync();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
});

