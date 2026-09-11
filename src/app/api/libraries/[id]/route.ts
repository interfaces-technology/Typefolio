import { NextResponse } from "next/server";

import { getLibraryById } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const library = await getLibraryById(id);

  if (!library) {
    return NextResponse.json({ error: "Library not found" }, { status: 404 });
  }

  return NextResponse.json({ library });
}
