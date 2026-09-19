function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

function cookieHeaderForRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie");
  if (cookie) return cookie;

  const bearer = readBearerToken(request);
  return bearer ? `__Secure-neon-auth.session_token=${bearer}` : null;
}

export async function getUserId(request: Request): Promise<string | null> {
  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim().replace(/^['"]|['"]$/g, "");
  if (!baseUrl) return null;

  const url = new URL("get-session", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);
  const cookie = cookieHeaderForRequest(request);

  try {
    const response = await fetch(url, {
      headers: cookie ? { Cookie: cookie } : undefined,
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      user?: { id?: string };
      session?: { userId?: string };
    };

    return data.user?.id ?? data.session?.userId ?? null;
  } catch {
    return null;
  }
}

export async function requireUser(request: Request): Promise<string | null> {
  return getUserId(request);
}
