import { NextResponse } from "next/server";

import { validateSyncCodeForLibrary } from "@/lib/auth";
import { registerDevice } from "@/lib/devices";
import { getLibraryById } from "@/lib/storage";
import type { DevicePlatform } from "@/lib/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

const PLATFORMS: DevicePlatform[] = ["macos", "windows", "linux"];

function isDevicePlatform(value: unknown): value is DevicePlatform {
  return typeof value === "string" && PLATFORMS.includes(value as DevicePlatform);
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await validateSyncCodeForLibrary(
    id,
    request.headers.get("x-sync-code"),
  );

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const library = await getLibraryById(id);
  if (!library) {
    return NextResponse.json({ error: "Library not found" }, { status: 404 });
  }

  return NextResponse.json({ devices: library.devices ?? [] });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await validateSyncCodeForLibrary(
    id,
    request.headers.get("x-sync-code"),
  );

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json()) as {
    name?: string;
    platform?: string;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Device name is required." }, { status: 400 });
  }

  if (!isDevicePlatform(body.platform)) {
    return NextResponse.json(
      { error: "Platform must be macos, windows, or linux." },
      { status: 400 },
    );
  }

  const result = await registerDevice(id, {
    name: body.name.trim(),
    platform: body.platform,
  });

  if (!result) {
    return NextResponse.json({ error: "Library not found" }, { status: 404 });
  }

  return NextResponse.json(result, { status: 201 });
}
