import { eq } from "drizzle-orm";
import { headers } from "next/headers";

import { auth } from "@typefolio/core/auth/server";
import { getSessionCookieName } from "@typefolio/core/auth/config";
import { getUserEntitlement } from "@typefolio/core/entitlements";
import { getDb } from "@typefolio/core/db";
import { authUser } from "@typefolio/core/db/schema-auth";
import { getLibraryById } from "@typefolio/core/storage";
import type { Entitlement } from "@typefolio/core/types";

export type AccessOk = {
  ok: true;
  userId: string;
  via: "session" | "bearer";
  emailVerified: boolean;
};

export type AccessErr = {
  ok: false;
  status: number;
  error: string;
  code?: string;
  details?: Record<string, unknown>;
};

function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

function sessionHeaders(request?: Request): Headers {
  if (request) {
    const bearer = readBearerToken(request);
    if (bearer) {
      const cookieName = getSessionCookieName();
      const headersInit = new Headers(request.headers);
      headersInit.set("cookie", `${cookieName}=${bearer}`);
      return headersInit;
    }
    return new Headers(request.headers);
  }

  return new Headers();
}

async function resolveSession(request?: Request) {
  const headerList = request ? sessionHeaders(request) : await headers();
  return auth.api.getSession({ headers: headerList });
}

export async function getSessionUserId(request?: Request): Promise<string | null> {
  const session = await resolveSession(request);
  return session?.user?.id ?? null;
}

export async function getSessionUser(
  request?: Request,
): Promise<{ id: string; emailVerified: boolean } | null> {
  const session = await resolveSession(request);
  if (!session?.user?.id) {
    return null;
  }

  return {
    id: session.user.id,
    emailVerified: Boolean(session.user.emailVerified),
  };
}

export async function requireSession(request?: Request): Promise<AccessOk | AccessErr> {
  const user = await getSessionUser(request);
  if (!user) {
    return { ok: false, status: 401, error: "Sign in required." };
  }

  const via = request && readBearerToken(request) ? "bearer" : "session";
  return {
    ok: true,
    userId: user.id,
    via,
    emailVerified: user.emailVerified,
  };
}

export async function requireVerifiedEmail(
  request?: Request,
): Promise<AccessOk | AccessErr> {
  const session = await requireSession(request);
  if (!session.ok) {
    return session;
  }

  if (!session.emailVerified) {
    return {
      ok: false,
      status: 403,
      error: "Verify your email before uploading fonts.",
      code: "EMAIL_NOT_VERIFIED",
    };
  }

  return session;
}

export async function isUserEmailVerified(userId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ emailVerified: authUser.emailVerified })
    .from(authUser)
    .where(eq(authUser.id, userId))
    .limit(1);

  return row?.emailVerified ?? false;
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

export async function requireSyncEntitlement(
  userId: string,
): Promise<{ ok: true; entitlement: Entitlement } | AccessErr> {
  const entitlement = await getUserEntitlement(userId);
  if (!entitlement.features.sync) {
    return {
      ok: false,
      status: 403,
      error:
        "Pro sync is required to use the native sync feature. Upgrade at typefolio.app/pricing.",
      code: "SYNC_NOT_AVAILABLE",
    };
  }

  return { ok: true, entitlement };
}

export async function checkStorageCapacity(
  userId: string,
  additionalBytes: number,
): Promise<{ ok: true; entitlement: Entitlement } | AccessErr> {
  const entitlement = await getUserEntitlement(userId);
  if (entitlement.storageUsedBytes + additionalBytes > entitlement.storageLimitBytes) {
    return {
      ok: false,
      status: 413,
      error: "Upload would exceed your storage limit. Remove fonts or upgrade to Pro.",
      code: "STORAGE_LIMIT_EXCEEDED",
    };
  }

  return { ok: true, entitlement };
}

export async function checkDeviceCapacity(
  userId: string,
): Promise<{ ok: true; entitlement: Entitlement } | AccessErr> {
  const entitlement = await getUserEntitlement(userId);
  if (entitlement.deviceCount >= entitlement.deviceLimit) {
    return {
      ok: false,
      status: 409,
      error: `Your plan allows ${entitlement.deviceLimit} device${entitlement.deviceLimit === 1 ? "" : "s"}. Remove a device or upgrade to Pro.`,
      code: "DEVICE_LIMIT_EXCEEDED",
      details: { deviceLimit: entitlement.deviceLimit },
    };
  }

  return { ok: true, entitlement };
}
