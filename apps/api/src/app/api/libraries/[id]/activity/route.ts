import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@typefolio/core/access";
import { listActivity } from "@typefolio/core/activity";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const activity = await listActivity(id);
  return NextResponse.json({ activity });
}
