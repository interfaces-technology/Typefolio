import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { requireSession } from "@/lib/access";
import { auth } from "@/lib/auth/server";
import { getUserEntitlement } from "@/lib/entitlements";
import { getOrCreateUserLibrary } from "@/lib/storage";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const [library, entitlement] = await Promise.all([
    getOrCreateUserLibrary(session.userId),
    getUserEntitlement(session.userId),
  ]);

  return NextResponse.json({
    user: { id: session.userId, emailVerified: session.emailVerified },
    library: {
      id: library.id,
      name: library.name,
      description: library.description,
      fontCount: library.fonts.length,
      createdAt: library.createdAt,
      updatedAt: library.updatedAt,
    },
    entitlement,
  });
}

export async function DELETE(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  await auth.api.deleteUser({
    headers: await headers(),
    body: {},
  });

  return NextResponse.json({ deleted: true });
}
