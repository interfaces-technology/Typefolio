import * as https from "https";
import { WEB_APP_URL } from "./config";

export function apiRequest<T>(
  urlPath: string,
  token: string,
  options: { method?: string; body?: string } = {},
): Promise<{ status: number; body?: T }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, WEB_APP_URL);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const req = https.request(url, { method: options.method ?? "GET", headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode ?? 200, body: JSON.parse(Buffer.concat(chunks).toString("utf8")) as T });
        } catch {
          resolve({ status: res.statusCode ?? 200 });
        }
      });
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}
