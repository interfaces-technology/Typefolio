import { NextResponse } from "next/server";

import { requireSession } from "@/lib/access";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  createLibrary,
  listLibrariesForUser,
  toLibrarySummary,
} from "@/lib/storage";
import type { CreateLibraryInput } from "@/lib/types";

export async function GET() {
  const session = await requireSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const libraries = await listLibrariesForUser(session.userId!);
  return NextResponse.json({ libraries });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rateLimit = checkRateLimit(`create-library:${ip}`, 20, 60_000);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  let body: CreateLibraryInput;
  try {
    body = (await request.json()) as CreateLibraryInput;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name || name.length < 1 || name.length > 80) {
    return NextResponse.json(
      { error: "Library name is required (1–80 characters)." },
      { status: 400 },
    );
  }

  if (body.description && body.description.length > 300) {
    return NextResponse.json(
      { error: "Description must be 300 characters or fewer." },
      { status: 400 },
    );
  }

  const library = await createLibrary(session.userId!, {
    name,
    description: body.description?.trim(),
  });

  return NextResponse.json({ library: toLibrarySummary(library) }, { status: 201 });
}
