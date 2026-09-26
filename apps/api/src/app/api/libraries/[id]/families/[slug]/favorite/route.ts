import { NextResponse } from "next/server";

import { requireLibraryOwner } from "@typefolio/core/access";
import { toggleFamilyFavorite } from "@typefolio/core/families";
import { getDb } from "@typefolio/core/db";
import { favorites } from "@typefolio/core/db/schema";
import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

interface RouteContext {
  params: Promise<{ id: string; slug: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const { id, slug } = await context.params;
  const access = await requireLibraryOwner(id, request);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const family = await toggleFamilyFavorite(id, slug);
  if (!family?.id) {
    return NextResponse.json({ error: "Font not found." }, { status: 404 });
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(favorites)
    .where(
      and(
        eq(favorites.libraryId, id),
        eq(favorites.itemType, "family"),
        eq(favorites.itemId, family.id),
      ),
    )
    .limit(1);

  if (family.favoritedAt && !existing) {
    await db.insert(favorites).values({
      id: nanoid(12),
      libraryId: id,
      itemType: "family",
      itemId: family.id,
      createdAt: family.favoritedAt,
    });
  }
  if (!family.favoritedAt && existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));
  }

  return NextResponse.json({ family });
}
