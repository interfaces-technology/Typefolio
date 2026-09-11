export function isAllowedDesktopRedirectUri(value: string | null | undefined): boolean {
  if (!value?.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    if (url.protocol !== "http:") {
      return false;
    }

    return url.hostname === "127.0.0.1" || url.hostname === "localhost";
  } catch {
    return false;
  }
}

export function buildDesktopCallbackUrl(
  redirectUri: string,
  token: string,
  email: string,
): string {
  const url = new URL(redirectUri);
  url.searchParams.set("token", token);
  url.searchParams.set("email", email);
  return url.toString();
}
