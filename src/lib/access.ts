import { auth } from "@/lib/auth/server";
import { getLibraryById } from "@/lib/storage";

export type AccessOk = {
  ok: true;
  userId: string;
  via: "session" | "bearer";
};

export type AccessErr = {
  ok: false;
  status: number;
  error: string;
};

function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

async function getUserIdFromBearerToken(
  token: string,
  request: Request,
): Promise<string | null> {
  const sessionCookieName = "__Secure-neon-auth.session_token";
  const cookieValue = `${sessionCookieName}=${token}`;

  const origin = new URL(request.url).origin;
  const localSessionUrl = new URL("/api/auth/get-session", origin);

  try {
    const localResponse = await fetch(localSessionUrl, {
      headers: { Cookie: cookieValue },
    });
    if (localResponse.ok) {
      const data = (await localResponse.json()) as {
        user?: { id?: string };
        session?: { userId?: string };
      };
      const userId = data.user?.id ?? data.session?.userId ?? null;
      if (userId) {
        return userId;
      }
    }
  } catch {
    // Fall back to upstream Neon Auth.
  }

  const baseUrl = process.env.NEON_AUTH_BASE_URL?.trim().replace(/^['"]|['"]$/g, "");
  if (!baseUrl) {
    return null;
  }

  const url = new URL("get-session", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

  try {
    const response = await fetch(url, {
      headers: { Cookie: cookieValue },
    });
    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      user?: { id?: string };
      session?: { userId?: string };
    };

    return data.user?.id ?? data.session?.userId ?? null;
  } catch {
    return null;
  }
}

export async function getSessionUserId(request?: Request): Promise<string | null> {
  const { data: session } = await auth.getSession();
  if (session?.user?.id) {
    return session.user.id;
  }

  if (!request) {
    return null;
  }

  const bearer = readBearerToken(request);
  if (!bearer) {
    return null;
  }

  return getUserIdFromBearerToken(bearer, request);
}

export async function requireSession(request?: Request): Promise<AccessOk | AccessErr> {
  const userId = await getSessionUserId(request);
  if (!userId) {
    return { ok: false, status: 401, error: "Sign in required." };
  }

  const via = request && readBearerToken(request) ? "bearer" : "session";
  return { ok: true, userId, via };
}

export async function requireLibraryOwner(
  libraryId: string,
  request?: Request,
): Promise<AccessOk | AccessErr> {
  const session = await requireSession(request);
  if (!session.ok) {
    return session;
  }

  const library = await getLibraryById(libraryId);
  if (!library) {
    return { ok: false, status: 404, error: "Library not found." };
  }

  if (library.ownerUserId !== session.userId) {
    return { ok: false, status: 403, error: "You do not own this library." };
  }

  return session;
}
