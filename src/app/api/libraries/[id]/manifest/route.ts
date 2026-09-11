import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@/lib/access";
import { getLibraryManifest } from "@/lib/manifest";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const manifest = await getLibraryManifest(id);
  if (!manifest) {
    return NextResponse.json({ error: "Library not found." }, { status: 404 });
  }

  return NextResponse.json({ manifest });
}
