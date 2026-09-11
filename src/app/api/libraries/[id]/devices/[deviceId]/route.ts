import { NextResponse } from "next/server";

import { validateSyncCodeForLibrary } from "@/lib/auth";
import { updateDevice } from "@/lib/devices";

interface RouteContext {
  params: Promise<{ id: string; deviceId: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id, deviceId } = await context.params;
  const auth = await validateSyncCodeForLibrary(
    id,
    request.headers.get("x-sync-code"),
  );

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as {
    lastSyncAt?: string;
    installedFontIds?: string[];
  };

  if (
    body.lastSyncAt !== undefined &&
    typeof body.lastSyncAt !== "string"
  ) {
    return NextResponse.json(
      { error: "lastSyncAt must be an ISO timestamp string." },
      { status: 400 },
    );
  }

  if (
    body.installedFontIds !== undefined &&
    (!Array.isArray(body.installedFontIds) ||
      body.installedFontIds.some((item) => typeof item !== "string"))
  ) {
    return NextResponse.json(
      { error: "installedFontIds must be an array of strings." },
      { status: 400 },
    );
  }

  const result = await updateDevice(id, deviceId, {
    lastSyncAt: body.lastSyncAt,
    installedFontIds: body.installedFontIds,
  });

  if (!result) {
    return NextResponse.json({ error: "Device not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}
