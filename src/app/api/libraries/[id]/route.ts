import { NextResponse } from "next/server";

import { requireLibraryAccess, requireLibraryOwner } from "@/lib/access";
import { deleteLibrary, getLibraryById, updateLibrary } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryAccess(id, request);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const library = await getLibraryById(id);
  if (!library) {
    return NextResponse.json({ error: "Library not found." }, { status: 404 });
  }

  return NextResponse.json({
    library,
    isOwner: access.via === "session",
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: { name?: string; description?: string | null };
  try {
    body = (await request.json()) as { name?: string; description?: string | null };
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "Library name is required (1–80 characters)." },
        { status: 400 },
      );
    }
  }

  if (body.description && body.description.length > 300) {
    return NextResponse.json(
      { error: "Description must be 300 characters or fewer." },
      { status: 400 },
    );
  }

  const library = await updateLibrary(id, {
    name: body.name,
    description: body.description,
  });

  if (!library) {
    return NextResponse.json({ error: "Library not found." }, { status: 404 });
  }

  return NextResponse.json({ library, isOwner: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const deleted = await deleteLibrary(id);
  if (!deleted) {
    return NextResponse.json({ error: "Library not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
