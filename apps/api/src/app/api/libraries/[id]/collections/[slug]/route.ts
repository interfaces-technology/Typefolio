import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@typefolio/core/access";
import {
  deleteCollection,
  getCollectionBySlug,
  updateCollection,
} from "@typefolio/core/collections";

interface RouteContext {
  params: Promise<{ id: string; slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id, slug } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const collection = await getCollectionBySlug(id, slug);
  if (!collection) {
    return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  }
  return NextResponse.json({ collection });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id, slug } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const body = (await request.json()) as {
    name?: string;
    description?: string | null;
  };
  const collection = await updateCollection(id, slug, body);
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
  const removed = await deleteCollection(id, slug);
  if (!removed) {
    return NextResponse.json({ error: "Collection not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
