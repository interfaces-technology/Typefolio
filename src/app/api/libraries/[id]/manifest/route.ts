import { NextResponse } from "next/server";

import { validateSyncCodeForLibrary } from "@/lib/auth";
import { getLibraryManifest } from "@/lib/manifest";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await validateSyncCodeForLibrary(
    id,
    request.headers.get("x-sync-code"),
  );

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const manifest = await getLibraryManifest(id);
  if (!manifest) {
    return NextResponse.json({ error: "Library not found" }, { status: 404 });
  }

  return NextResponse.json({ manifest });
}
