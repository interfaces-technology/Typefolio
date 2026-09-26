import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@typefolio/core/access";
import { checkRateLimit } from "@typefolio/core/rate-limit";
import { addFontsToLibrary } from "@typefolio/core/storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  if (!access.emailVerified) {
    return NextResponse.json(
      {
        error: "Verify your email before uploading fonts.",
        code: "EMAIL_NOT_VERIFIED",
      },
      { status: 403 },
    );
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

  const maxFileSize = 15 * 1024 * 1024;
  const oversized = files.find((file) => file.size > maxFileSize);
  if (oversized) {
    return NextResponse.json(
      { error: `${oversized.name} exceeds the 15 MB per-file limit.` },
      { status: 400 },
    );
  }

  try {
    const result = await addFontsToLibrary(id, files);
    return NextResponse.json({
      library: result.library,
      added: result.added.length,
      updated: result.updated.length,
      skipped: result.skipped.length,
      rejected: result.rejected,
    });
  } catch {
    return NextResponse.json({ error: "Library not found" }, { status: 404 });
  }
}
