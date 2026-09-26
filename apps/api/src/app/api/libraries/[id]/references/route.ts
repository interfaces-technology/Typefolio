import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@typefolio/core/access";
import { createReference, listReferences } from "@typefolio/core/references";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const records = await listReferences(id);
  return NextResponse.json({ references: records });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const image = form.get("image");
  if (!title || !(image instanceof File) || image.size === 0) {
    return NextResponse.json(
      { error: "Title and image are required." },
      { status: 400 },
    );
  }

  const yearValue = String(form.get("year") ?? "");
  const familyIdsRaw = String(form.get("familyIds") ?? "");
  const tagsRaw = String(form.get("tags") ?? "");

  const reference = await createReference(id, {
    title,
    category: String(form.get("category") ?? "") || undefined,
    year: yearValue ? Number(yearValue) : undefined,
    description: String(form.get("description") ?? "") || undefined,
    tags: tagsRaw
      ? tagsRaw.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [],
    image,
    familyIds: familyIdsRaw
      ? familyIdsRaw.split(",").map((familyId) => ({ familyId: familyId.trim() }))
      : [],
  });

  return NextResponse.json({ reference }, { status: 201 });
}
