import { NextResponse } from "next/server";
import * as fontkit from "fontkit";

import { requireLibraryOwner } from "@typefolio/core/access";
import { getFontBuffer } from "@typefolio/core/storage";

interface RouteContext {
  params: Promise<{ id: string; fontId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id, fontId } = await context.params;
  const access = await requireLibraryOwner(id, request);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const result = await getFontBuffer(id, fontId);
  if (!result) {
    return NextResponse.json({ error: "Font not found." }, { status: 404 });
  }

  let font: fontkit.Font;
  try {
    font = fontkit.create(result.buffer);
  } catch {
    return NextResponse.json(
      { error: "Could not read font data." },
      { status: 400 },
    );
  }

  const withGlyphData = font as unknown as {
    characterSet?: number[];
    numGlyphs?: number;
  };

  const codepoints = (withGlyphData.characterSet ?? [])
    .filter((codePoint) => codePoint > 31)
    .sort((a, b) => a - b);

  return NextResponse.json({
    font: {
      id: result.font.id,
      familyName: result.font.familyName,
      styleName: result.font.styleName,
    },
    glyphCount: withGlyphData.numGlyphs ?? null,
    codepoints,
  });
}