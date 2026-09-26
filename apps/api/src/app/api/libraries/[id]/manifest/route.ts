import { NextResponse } from "next/server";

import { requireLibraryOwner, requireSyncEntitlement } from "@typefolio/core/access";
import { getLibraryManifest } from "@typefolio/core/manifest";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const syncAccess = await requireSyncEntitlement(access.userId);
  if (!syncAccess.ok) {
    return NextResponse.json(
      { error: syncAccess.error, code: syncAccess.code },
      { status: syncAccess.status },
    );
  }

  const manifest = await getLibraryManifest(id);
  if (!manifest) {
    return NextResponse.json({ error: "Library not found." }, { status: 404 });
  }

  return NextResponse.json({ manifest });
}
