import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@typefolio/core/access";
import { listDevices } from "@typefolio/core/devices";
import {
  familyInstallStateFromDevices,
  getFamilyBySlug,
  isClassification,
  updateFamily,
} from "@typefolio/core/families";

interface RouteContext {
  params: Promise<{ id: string; slug: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id, slug } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const family = await getFamilyBySlug(id, slug);
  if (!family) {
    return NextResponse.json({ error: "Font not found." }, { status: 404 });
  }

  const devices = await listDevices(id);
  const installState = familyInstallStateFromDevices(family, devices);
  return NextResponse.json({ family, installState });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id, slug } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const body = (await request.json()) as {
    foundry?: string | null;
    version?: string | null;
    classification?: string | null;
    mood?: string[];
    license?: string | null;
    source?: string | null;
    languages?: string[];
  };

  if (
    body.classification &&
    body.classification !== null &&
    !isClassification(body.classification)
  ) {
    return NextResponse.json({ error: "Invalid classification." }, { status: 400 });
  }

  const classification =
    body.classification === undefined
      ? undefined
      : body.classification === null
        ? null
        : isClassification(body.classification)
          ? body.classification
          : null;

  const family = await updateFamily(id, slug, {
    foundry: body.foundry,
    version: body.version,
    classification,
    mood: body.mood,
    license: body.license,
    source: body.source,
    languages: body.languages,
  });

  if (!family) {
    return NextResponse.json({ error: "Font not found." }, { status: 404 });
  }

  return NextResponse.json({ family });
}
