import { NextResponse } from "next/server";

import { requireLibraryAccess } from "@/lib/access";
import { listDevices, registerDevice } from "@/lib/devices";
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
  const access = await requireLibraryAccess(id, request);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const devices = await listDevices(id);
  return NextResponse.json({ devices });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryAccess(id, request);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
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
