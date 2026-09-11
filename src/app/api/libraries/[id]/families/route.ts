import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@/lib/access";
import { parseFamilyQueryParams } from "@/lib/font-families";
import { getLibraryFontFamilies } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const { searchParams } = new URL(request.url);
  const { sort, order } = parseFamilyQueryParams(searchParams);
  const result = await getLibraryFontFamilies(id, { sortBy: sort, order });

  if (!result) {
    return NextResponse.json({ error: "Library not found." }, { status: 404 });
  }

  return NextResponse.json(result);
}
