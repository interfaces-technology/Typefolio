import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@typefolio/core/access";
import {
  isClassification,
  listFamilies,
  backfillFamilies,
} from "@typefolio/core/families";
import { parseFamilyQueryParams } from "@typefolio/core/font-families";
import { getLibraryById } from "@typefolio/core/storage";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await requireLibraryOwner(id, request);

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  await backfillFamilies(id);

  const { searchParams } = new URL(request.url);
  const classificationParam = searchParams.get("classification");
  const classification =
    classificationParam && isClassification(classificationParam)
      ? classificationParam
      : undefined;
  const modernSort = searchParams.get("sort");
  const { sort, order } = parseFamilyQueryParams(searchParams);

  const families = await listFamilies(id, {
    q: searchParams.get("q") ?? undefined,
    classification,
    mood: searchParams.get("mood") ?? undefined,
    sort:
      modernSort === "newest" ||
      modernSort === "updated" ||
      modernSort === "name-asc" ||
      modernSort === "name-desc"
        ? modernSort
        : sort === "uploadedAt"
          ? "newest"
          : order === "desc"
            ? "name-desc"
            : "name-asc",
  });

  const library = await getLibraryById(id);

  return NextResponse.json({
    libraryId: id,
    sort,
    order,
    familyCount: families.length,
    fontCount: library?.fonts.length ?? families.reduce((sum, family) => sum + family.styleCount, 0),
    families,
  });
}
