import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@typefolio/core/access";
import { listFavorites, toggleFavorite } from "@typefolio/core/favorites";
import type { FavoriteItemType } from "@typefolio/core/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const typeParam = new URL(request.url).searchParams.get("type");
  const type =
    typeParam === "family" || typeParam === "reference" ? typeParam : undefined;
  return NextResponse.json(await listFavorites(id, type));
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const body = (await request.json()) as {
    itemType?: FavoriteItemType;
    itemId?: string;
  };
  if (!body.itemType || !body.itemId) {
    return NextResponse.json({ error: "itemType and itemId are required." }, { status: 400 });
  }
  const result = await toggleFavorite(id, body.itemType, body.itemId);
  return NextResponse.json(result);
}
