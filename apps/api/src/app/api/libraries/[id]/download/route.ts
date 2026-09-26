import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@typefolio/core/access";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  return NextResponse.json(
    {
      error: "Zip download is not available. Sync fonts with the Typefolio app.",
      code: "ZIP_DISABLED",
    },
    { status: 410 },
  );
}
