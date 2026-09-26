import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getDb } from "@typefolio/core/db";
import { collectionItems, collections } from "@typefolio/core/db/schema";
import { nextSlug, slugify } from "@typefolio/core/slug";
import type {
  CollectionDetail,
  CollectionItem,
  CollectionItemType,
  CollectionSummary,
} from "@typefolio/core/types";

function countItems(items: Array<typeof collectionItems.$inferSelect>) {
  return {
    fontCount: items.filter((item) => item.itemType === "family").length,
    referenceCount: items.filter((item) => item.itemType === "reference").length,
    noteCount: items.filter((item) => item.itemType === "note").length,
  };
}

function toItem(row: typeof collectionItems.$inferSelect): CollectionItem {
  return {
    id: row.id,
    collectionId: row.collectionId,
    itemType: row.itemType as CollectionItemType,
    itemId: row.itemId ?? undefined,
    noteBody: row.noteBody ?? undefined,
    position: row.position,
  };
}

function toSummary(
  row: typeof collections.$inferSelect,
  items: Array<typeof collectionItems.$inferSelect>,
): CollectionSummary {
  const counts = countItems(items);
  return {
    id: row.id,
    libraryId: row.libraryId,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    ...counts,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function itemsForCollections(collectionIds: string[]) {
  if (collectionIds.length === 0) {
    return [];
  }
  const db = getDb();
  return db.select().from(collectionItems);
}

export async function listCollections(
  libraryId: string,
): Promise<CollectionSummary[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(collections)
    .where(eq(collections.libraryId, libraryId))
    .orderBy(desc(collections.updatedAt));

  const items = await itemsForCollections(rows.map((row) => row.id));
  return rows.map((row) =>
    toSummary(
      row,
      items.filter((item) => item.collectionId === row.id),
    ),
  );
}

export async function getCollectionBySlug(
  libraryId: string,
  slug: string,
): Promise<CollectionDetail | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(collections)
    .where(and(eq(collections.libraryId, libraryId), eq(collections.slug, slug)))
    .limit(1);
  if (!row) {
    return null;
  }

  const items = await db
    .select()
    .from(collectionItems)
    .where(eq(collectionItems.collectionId, row.id));

  return {
    ...toSummary(row, items),
    items: items
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(toItem),
  };
}

export async function createCollection(
  libraryId: string,
  input: { name: string; description?: string },
): Promise<CollectionDetail> {
  const db = getDb();
  const taken = new Set(
    (
      await db
        .select({ slug: collections.slug })
        .from(collections)
        .where(eq(collections.libraryId, libraryId))
    ).map((row) => row.slug),
  );
  const now = new Date().toISOString();
  const row = {
    id: nanoid(12),
    libraryId,
    slug: nextSlug(slugify(input.name), taken),
    name: input.name.trim(),
    description: input.description?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(collections).values(row);
  return { ...toSummary(row, []), items: [] };
}

export async function updateCollection(
  libraryId: string,
  slug: string,
  input: { name?: string; description?: string | null },
): Promise<CollectionDetail | null> {
  const existing = await getCollectionBySlug(libraryId, slug);
  if (!existing) {
    return null;
  }
  const db = getDb();
  await db
    .update(collections)
    .set({
      name: input.name?.trim() ?? existing.name,
      description:
        input.description === undefined
          ? (existing.description ?? null)
          : input.description?.trim() || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(collections.id, existing.id));
  return getCollectionBySlug(libraryId, slug);
}

export async function deleteCollection(
  libraryId: string,
  slug: string,
): Promise<boolean> {
  const existing = await getCollectionBySlug(libraryId, slug);
  if (!existing) {
    return false;
  }
  const db = getDb();
  await db.delete(collections).where(eq(collections.id, existing.id));
  return true;
}

export async function addCollectionItem(
  libraryId: string,
  slug: string,
  input: {
    itemType: CollectionItemType;
    itemId?: string;
    noteBody?: string;
  },
): Promise<CollectionDetail | null> {
  const existing = await getCollectionBySlug(libraryId, slug);
  if (!existing) {
    return null;
  }

  if (input.itemType !== "note" && input.itemId) {
    const duplicate = existing.items.find(
      (item) => item.itemType === input.itemType && item.itemId === input.itemId,
    );
    if (duplicate) {
      return existing;
    }
  }

  const db = getDb();
  await db.insert(collectionItems).values({
    id: nanoid(12),
    collectionId: existing.id,
    itemType: input.itemType,
    itemId: input.itemId ?? null,
    noteBody: input.noteBody?.trim() || null,
    position: existing.items.length,
  });
  await db
    .update(collections)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(collections.id, existing.id));
  return getCollectionBySlug(libraryId, slug);
}

export async function removeCollectionItem(
  libraryId: string,
  slug: string,
  itemId: string,
): Promise<CollectionDetail | null> {
  const existing = await getCollectionBySlug(libraryId, slug);
  if (!existing) {
    return null;
  }
  const db = getDb();
  await db
    .delete(collectionItems)
    .where(
      and(
        eq(collectionItems.collectionId, existing.id),
        eq(collectionItems.id, itemId),
      ),
    );
  return getCollectionBySlug(libraryId, slug);
}
