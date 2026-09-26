import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@typefolio/core/access";
import { checkRateLimit } from "@typefolio/core/rate-limit";
import { reindexLibraryFontMetadata } from "@typefolio/core/storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rateLimit = checkRateLimit(`reindex-fonts:${ip}`, 10, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many reindex requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "1";
  const result = await reindexLibraryFontMetadata(id, { force });

  if (!result) {
    return NextResponse.json({ error: "Library not found." }, { status: 404 });
  }

  return NextResponse.json(result);
}
