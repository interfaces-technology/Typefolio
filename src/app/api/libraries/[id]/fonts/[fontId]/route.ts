import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@/lib/access";
import { deleteFont, getFontBuffer } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ id: string; fontId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id, fontId } = await context.params;
  const access = await requireLibraryOwner(id);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const result = await getFontBuffer(id, fontId);

  if (!result) {
    return NextResponse.json({ error: "Font not found" }, { status: 404 });
  }

  const { buffer, font } = result;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${font.originalName}"`,
      "Content-Length": String(buffer.length),
    },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id, fontId } = await context.params;
  const access = await requireLibraryOwner(id);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const deleted = await deleteFont(id, fontId);
  if (!deleted) {
    return NextResponse.json({ error: "Font not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
