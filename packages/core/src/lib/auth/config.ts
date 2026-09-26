/** Public marketing site (landing, pricing). Product web UI is rebuilt separately. */
export function getMarketingOrigin(): string {
  const configured =
    process.env.NEXT_PUBLIC_MARKETING_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://127.0.0.1:43125";

  return configured.replace(/\/$/, "");
}

/** @deprecated Use getMarketingOrigin() for user-facing redirects. */
export function getAppOrigin(): string {
  return getMarketingOrigin();
}

export function getAuthBaseUrl(): string {
  const api =
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim();
  if (api) {
    return api.replace(/\/$/, "");
  }
  return "http://127.0.0.1:43123";
}

export function getPublicApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "") ||
    getAuthBaseUrl()
  );
}

export function isProductionAuth(): boolean {
  return getAuthBaseUrl().startsWith("https://");
}

export function getSessionCookieName(): string {
  const prefix = isProductionAuth()
    ? "__Secure-better-auth"
    : "better-auth";
  return `${prefix}.session_token`;
}

export function getPasskeyRpId(): string {
  try {
    return new URL(getAuthBaseUrl()).hostname;
  } catch {
    return "localhost";
  }
}
