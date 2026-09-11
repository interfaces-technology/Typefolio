import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@/lib/access";
import { getLibraryById } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const library = await getLibraryById(id);
  if (!library) {
    return NextResponse.json({ error: "Library not found." }, { status: 404 });
  }

  return NextResponse.json({
    library,
    isOwner: true,
  });
}
