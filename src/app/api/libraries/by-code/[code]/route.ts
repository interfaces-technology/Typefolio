import { NextResponse } from "next/server";

import { isValidSyncCodeFormat, normalizeSyncCode } from "@/lib/sync-code";
import { getLibraryBySyncCode } from "@/lib/storage";

interface RouteContext {
  params: Promise<{ code: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { code } = await context.params;
  const normalized = normalizeSyncCode(code);

  if (!isValidSyncCodeFormat(normalized)) {
    return NextResponse.json(
      { error: "Invalid sync code format. Example: FONT-ABCD-1234" },
      { status: 400 },
    );
  }

  const library = await getLibraryBySyncCode(normalized);
  if (!library) {
    return NextResponse.json(
      { error: "No library found for this sync code." },
      { status: 404 },
    );
  }

  return NextResponse.json({ library });
}
