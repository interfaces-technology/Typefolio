import { ZipArchive } from "archiver";
import { NextResponse } from "next/server";
import { PassThrough } from "stream";

import { requireLibraryOwner } from "@/lib/access";
import { getAllFontBuffers, getLibraryById } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const library = await getLibraryById(id);

  if (!library) {
    return NextResponse.json({ error: "Library not found" }, { status: 404 });
  }

  if (library.fonts.length === 0) {
    return NextResponse.json(
      { error: "This library has no fonts to download." },
      { status: 400 },
    );
  }

  const fontBuffers = await getAllFontBuffers(id);
  if (fontBuffers.length === 0) {
    return NextResponse.json(
      { error: "Font files are unavailable." },
      { status: 404 },
    );
  }

  const archive = new ZipArchive({ zlib: { level: 9 } });
  const passThrough = new PassThrough();
  archive.pipe(passThrough);

  for (const { buffer, font } of fontBuffers) {
    archive.append(buffer, { name: font.originalName });
  }

  const zipPromise = new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    passThrough.on("data", (chunk: Buffer) => chunks.push(chunk));
    passThrough.on("end", () => resolve(Buffer.concat(chunks)));
    passThrough.on("error", reject);
    archive.on("error", reject);
  });

  await archive.finalize();
  const zipBuffer = await zipPromise;

  const safeName = library.name.replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${safeName || "fonts"}.zip"`,
      "Content-Length": String(zipBuffer.length),
    },
  });
}
