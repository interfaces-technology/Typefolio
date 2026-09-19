import * as os from "os";
import * as path from "path";

export const WEB_APP_URL = process.env.TYPEFOLIO_URL ?? "https://typefolio-interfaces-main.vercel.app";

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
