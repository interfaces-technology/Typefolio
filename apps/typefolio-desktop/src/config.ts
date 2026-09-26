import * as os from "os";
import * as path from "path";

export const AUTH_WEB_URL =
  process.env.TYPEFOLIO_API_URL?.replace(/\/$/, "") ??
  process.env.TYPEFOLIO_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:43123";

/** @deprecated Use AUTH_WEB_URL */
export const WEB_APP_URL = AUTH_WEB_URL;

export const SYNC_INTERVAL_MS = 60_000;

export const FONT_INSTALL_DIR: string = (() => {
  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library", "Fonts");
  }
  if (process.platform === "win32") {
    return path.join(os.homedir(), "AppData", "Local", "Microsoft", "Windows", "Fonts");
  }
  return path.join(os.homedir(), ".local", "share", "fonts");
})();
