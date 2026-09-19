const IOS_CALLBACK_SCHEME = "typefolio:";
const IOS_CALLBACK_HOST = "auth";
const IOS_CALLBACK_PATH = "/callback";

function isAllowedLocalhostRedirect(url: URL): boolean {
  if (url.protocol !== "http:") {
    return false;
  }

  return url.hostname === "127.0.0.1" || url.hostname === "localhost";
}

function isAllowedIOSCallbackRedirect(url: URL): boolean {
  if (url.protocol !== IOS_CALLBACK_SCHEME) {
    return false;
  }

  if (url.hostname !== IOS_CALLBACK_HOST) {
    return false;
  }

  return url.pathname === IOS_CALLBACK_PATH || url.pathname === `${IOS_CALLBACK_PATH}/`;
}

export function isAllowedDesktopRedirectUri(value: string | null | undefined): boolean {
  if (!value?.trim()) {
    return false;
  }

  try {
    const url = new URL(value);
    return isAllowedLocalhostRedirect(url) || isAllowedIOSCallbackRedirect(url);
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
