import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@typefolio/core/access";
import { createShareLink, listShareLinks } from "@typefolio/core/share";
import type { ShareVisibility } from "@typefolio/core/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  return NextResponse.json({ shares: await listShareLinks(id) });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const body = (await request.json()) as {
    resourceType?: string;
    resourceId?: string;
    visibility?: ShareVisibility;
  };
  if (!body.resourceType || !body.resourceId) {
    return NextResponse.json(
      { error: "resourceType and resourceId are required." },
      { status: 400 },
    );
  }
  const share = await createShareLink(id, {
    resourceType: body.resourceType,
    resourceId: body.resourceId,
    visibility: body.visibility,
  });
  return NextResponse.json({ share }, { status: 201 });
}
