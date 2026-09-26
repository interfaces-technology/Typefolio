import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@typefolio/core/access";
import { createCollection, listCollections } from "@typefolio/core/collections";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const collections = await listCollections(id);
  return NextResponse.json({ collections });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = (await request.json()) as { name?: string; description?: string };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required." }, { status: 400 });
  }

  const collection = await createCollection(id, {
    name: body.name,
    description: body.description,
  });
  return NextResponse.json({ collection }, { status: 201 });
}
