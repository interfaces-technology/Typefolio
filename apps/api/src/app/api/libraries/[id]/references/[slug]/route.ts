import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@typefolio/core/access";
import {
  deleteReference,
  getReferenceBySlug,
  updateReference,
} from "@typefolio/core/references";

interface RouteContext {
  params: Promise<{ id: string; slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id, slug } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const reference = await getReferenceBySlug(id, slug);
  if (!reference) {
    return NextResponse.json({ error: "Reference not found." }, { status: 404 });
  }
  return NextResponse.json({ reference });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id, slug } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const body = (await request.json()) as {
    title?: string;
    category?: string | null;
    year?: number | null;
    description?: string | null;
    tags?: string[];
    familyIds?: Array<{ familyId: string; role?: "used" | "related" }>;
  };
  const reference = await updateReference(id, slug, body);
  if (!reference) {
    return NextResponse.json({ error: "Reference not found." }, { status: 404 });
  }
  return NextResponse.json({ reference });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id, slug } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const removed = await deleteReference(id, slug);
  if (!removed) {
    return NextResponse.json({ error: "Reference not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
