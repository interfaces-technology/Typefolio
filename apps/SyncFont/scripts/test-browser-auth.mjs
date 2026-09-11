#!/usr/bin/env node
/** Simulates macOS browser sign-in callback flow. */
import http from "node:http";
import { URL } from "node:url";

const API = process.env.SYNCFONT_API_URL ?? "http://127.0.0.1:43123";
const EMAIL = process.env.SYNCFONT_TEST_EMAIL ?? "syncfont-demo@example.com";
const PASS = process.env.SYNCFONT_TEST_PASSWORD ?? "SyncFontDemo123!";

async function main() {
  const { port, callbackResult } = await new Promise((resolve, reject) => {
    let port = 0;
    const callbackResult = new Promise((resolveCallback, rejectCallback) => {
      const server = http.createServer((req, res) => {
        const url = new URL(req.url ?? "/", "http://127.0.0.1");
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("OK");
        server.close();
        resolveCallback({
          token: url.searchParams.get("token"),
          email: url.searchParams.get("email"),
        });
      });

      server.on("error", rejectCallback);
      server.listen(0, "127.0.0.1", () => {
        port = /** @type {import("node:net").AddressInfo} */ (server.address()).port;
        resolve({ port, callbackResult: callbackResult });
      });
    });
  });

  const redirectUri = `http://127.0.0.1:${port}/callback`;
  const desktopURL = `${API}/auth/desktop?redirect_uri=${encodeURIComponent(redirectUri)}`;

  const signInRes = await fetch(`${API}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });

  if (!signInRes.ok) {
    throw new Error(`Sign-in failed: ${signInRes.status} ${await signInRes.text()}`);
  }

  const setCookie = signInRes.headers.getSetCookie?.() ?? [];
  const cookieHeader = setCookie.map((c) => c.split(";")[0]).join("; ");

  if (!setCookie.some((c) => c.startsWith("__Secure-neon-auth.session_token="))) {
    throw new Error("No session cookie from sign-in");
  }

  const desktopRes = await fetch(desktopURL, {
    redirect: "manual",
    headers: { Cookie: cookieHeader },
  });

  const location = desktopRes.headers.get("location");
  if (!location?.startsWith(redirectUri)) {
    throw new Error(
      `Expected redirect to callback, got ${desktopRes.status} location=${location ?? "none"}`,
    );
  }

  await fetch(location);
  const result = await callbackResult;

  if (!result.token) {
    throw new Error("Callback missing token");
  }

  const meRes = await fetch(`${API}/api/me`, {
    headers: { Authorization: `Bearer ${result.token}` },
  });

  if (!meRes.ok) {
    throw new Error(`/api/me rejected token: ${meRes.status} ${await meRes.text()}`);
  }

  const me = await meRes.json();
  console.log("PASS: browser auth flow");
  console.log(`  email: ${result.email}`);
  console.log(`  library: ${me.library?.name ?? me.library?.id}`);
}

main().catch((err) => {
  console.error("FAIL:", err.message);
  process.exit(1);
});
