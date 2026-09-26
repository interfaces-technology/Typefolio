import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@typefolio/core/access";
import { addCollectionItem, removeCollectionItem } from "@typefolio/core/collections";
import type { CollectionItemType } from "@typefolio/core/types";

interface RouteContext {
  params: Promise<{ id: string; slug: string }>;
}

const ITEM_TYPES: CollectionItemType[] = ["family", "reference", "note"];

export async function POST(request: Request, context: RouteContext) {
  const { id, slug } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = (await request.json()) as {
    itemType?: CollectionItemType;
    itemId?: string;
    noteBody?: string;
  };

  if (!body.itemType || !ITEM_TYPES.includes(body.itemType)) {
    return NextResponse.json({ error: "Invalid item type." }, { status: 400 });
  }

  const collection = await addCollectionItem(id, slug, {
    itemType: body.itemType,
    itemId: body.itemId,
    noteBody: body.noteBody,
  });
  if (!collection) {
    return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  }
  return NextResponse.json({ collection });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id, slug } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const itemId = new URL(request.url).searchParams.get("itemId");
  if (!itemId) {
    return NextResponse.json({ error: "itemId is required." }, { status: 400 });
  }
  const collection = await removeCollectionItem(id, slug, itemId);
  if (!collection) {
    return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  }
  return NextResponse.json({ collection });
}
