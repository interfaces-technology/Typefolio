import { NextResponse } from "next/server";

import { requireLibraryOwner, requireSession } from "@typefolio/core/access";
import { getOrCreateUserLibrary } from "@typefolio/core/storage";
import { searchLibrary } from "@typefolio/core/search";

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const { searchParams } = new URL(request.url);
  const library = await getOrCreateUserLibrary(session.userId);
  const libraryId = searchParams.get("libraryId") ?? library.id;
  const access = await requireLibraryOwner(libraryId, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const results = await searchLibrary(libraryId, searchParams.get("q") ?? "");
  return NextResponse.json(results);
}
