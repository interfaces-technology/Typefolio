import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getFamilyById } from "@typefolio/core/families";
import { getDb } from "@typefolio/core/db";
import { favorites } from "@typefolio/core/db/schema";
import { listReferences } from "@typefolio/core/references";
import type {
  FavoriteItemType,
  FavoriteRecord,
  FontFamilyGroup,
  ReferenceRecord,
} from "@typefolio/core/types";

function toFavorite(row: typeof favorites.$inferSelect): FavoriteRecord {
  return {
    id: row.id,
    itemType: row.itemType as FavoriteItemType,
    itemId: row.itemId,
    createdAt: row.createdAt,
  };
}

export async function listFavorites(
  libraryId: string,
  type?: FavoriteItemType,
): Promise<{
  favorites: FavoriteRecord[];
  fonts: FontFamilyGroup[];
  references: ReferenceRecord[];
}> {
  const db = getDb();
  const rows = await db
    .select()
    .from(favorites)
    .where(
      type
        ? and(eq(favorites.libraryId, libraryId), eq(favorites.itemType, type))
        : eq(favorites.libraryId, libraryId),
    )
    .orderBy(desc(favorites.createdAt));

  const fonts: FontFamilyGroup[] = [];
  for (const row of rows.filter((item) => item.itemType === "family")) {
    const family = await getFamilyById(libraryId, row.itemId);
    if (family) {
      fonts.push(family);
    }
  }

  const allReferences = await listReferences(libraryId);
  const referenceIds = new Set(
    rows.filter((row) => row.itemType === "reference").map((row) => row.itemId),
  );

  return {
    favorites: rows.map(toFavorite),
    fonts,
    references: allReferences.filter((reference) => referenceIds.has(reference.id)),
  };
}

export async function toggleFavorite(
  libraryId: string,
  itemType: FavoriteItemType,
  itemId: string,
): Promise<{ favorited: boolean }> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(favorites)
    .where(
      and(
        eq(favorites.libraryId, libraryId),
        eq(favorites.itemType, itemType),
        eq(favorites.itemId, itemId),
      ),
    )
    .limit(1);

  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));
    return { favorited: false };
  }

  await db.insert(favorites).values({
    id: nanoid(12),
    libraryId,
    itemType,
    itemId,
    createdAt: new Date().toISOString(),
  });
  return { favorited: true };
}
