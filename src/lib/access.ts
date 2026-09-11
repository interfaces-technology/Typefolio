import { auth } from "@/lib/auth/server";
import { getLibraryById } from "@/lib/storage";
import { normalizeSyncCode } from "@/lib/sync-code";

export type AccessOk = {
  ok: true;
  userId?: string;
  via: "session" | "sync-code";
};

export type AccessErr = {
  ok: false;
  status: number;
  error: string;
};

export async function getSessionUserId(): Promise<string | null> {
  const { data: session } = await auth.getSession();
  return session?.user?.id ?? null;
}

export async function requireSession(): Promise<AccessOk | AccessErr> {
  const userId = await getSessionUserId();
  if (!userId) {
    return { ok: false, status: 401, error: "Sign in required." };
  }

  return { ok: true, userId, via: "session" };
}

export function readSyncCode(request: Request): string | null {
  const header = request.headers.get("x-sync-code");
  if (header?.trim()) {
    return header;
  }

  return new URL(request.url).searchParams.get("syncCode");
}

export async function requireLibraryOwner(
  libraryId: string,
): Promise<AccessOk | AccessErr> {
  const session = await requireSession();
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

export async function requireLibraryAccess(
  libraryId: string,
  request: Request,
): Promise<AccessOk | AccessErr> {
  const library = await getLibraryById(libraryId);
  if (!library) {
    return { ok: false, status: 404, error: "Library not found." };
  }

  const userId = await getSessionUserId();
  if (userId && library.ownerUserId === userId) {
    return { ok: true, userId, via: "session" };
  }

  const syncCode = readSyncCode(request);
  if (!syncCode?.trim()) {
    return {
      ok: false,
      status: 401,
      error: "Sign in or provide a valid sync code.",
    };
  }

  if (normalizeSyncCode(syncCode) !== library.syncCode) {
    return {
      ok: false,
      status: 403,
      error: "Invalid sync code for this library.",
    };
  }

  return { ok: true, via: "sync-code" };
}
