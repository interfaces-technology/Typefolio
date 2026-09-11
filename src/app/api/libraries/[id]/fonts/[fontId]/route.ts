import { NextResponse } from "next/server";

import { getFontBuffer } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ id: string; fontId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id, fontId } = await context.params;
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
