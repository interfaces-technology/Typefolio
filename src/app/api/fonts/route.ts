import { NextResponse } from "next/server";

import { checkStorageCapacity, requireSession } from "@/lib/access";
import { checkRateLimit } from "@/lib/rate-limit";
import { addFontsToLibrary, getOrCreateUserLibrary } from "@/lib/storage";

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rateLimit = checkRateLimit(`upload-fonts:${ip}`, 30, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const formData = await request.formData();
  const files = formData
    .getAll("fonts")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (files.length === 0) {
    return NextResponse.json(
      { error: "Select at least one font file to upload." },
      { status: 400 },
    );
  }

  if (files.length > 20) {
    return NextResponse.json(
      { error: "You can upload up to 20 font files at once." },
      { status: 400 },
    );
  }

  const maxFileSize = 15 * 1024 * 1024;
  const oversized = files.find((file) => file.size > maxFileSize);
  if (oversized) {
    return NextResponse.json(
      { error: `${oversized.name} exceeds the 15 MB per-file limit.` },
      { status: 400 },
    );
  }

  const library = await getOrCreateUserLibrary(session.userId!);

  const totalUploadBytes = files.reduce((sum, file) => sum + file.size, 0);
  const storageAccess = await checkStorageCapacity(session.userId, totalUploadBytes);
  if (!storageAccess.ok) {
    return NextResponse.json(
      { error: storageAccess.error, code: storageAccess.code },
      { status: storageAccess.status },
    );
  }

  try {
    const result = await addFontsToLibrary(library.id, files);
    return NextResponse.json({
      library: result.library,
      added: result.added.length,
      rejected: result.rejected,
    });
  } catch {
    return NextResponse.json({ error: "Could not upload fonts." }, { status: 500 });
  }
}
