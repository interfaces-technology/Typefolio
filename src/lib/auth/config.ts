export function getAppOrigin(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.BETTER_AUTH_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:43123";

  return configured.replace(/\/$/, "");
}

export function getAuthBaseUrl(): string {
  return (
    process.env.BETTER_AUTH_URL?.trim().replace(/\/$/, "") || getAppOrigin()
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
