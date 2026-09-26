import { del, put } from "@vercel/blob";
import { and, desc, eq, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getDb } from "@typefolio/core/db";
import {
  favorites,
  fontFamilies,
  referenceFonts,
  references,
} from "@typefolio/core/db/schema";
import { nextSlug, slugify } from "@typefolio/core/slug";
import type {
  ReferenceFontLink,
  ReferenceFontRole,
  ReferenceRecord,
} from "@typefolio/core/types";

function toReference(
  row: typeof references.$inferSelect,
  relatedFonts: ReferenceFontLink[],
  favoritedAt?: string,
): ReferenceRecord {
  return {
    id: row.id,
    libraryId: row.libraryId,
    slug: row.slug,
    title: row.title,
    category: row.category ?? undefined,
    year: row.year ?? undefined,
    description: row.description ?? undefined,
    imageUrl: row.imageUrl,
    tags: row.tags,
    relatedFonts,
    favoritedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function linksForReferences(
  referenceIds: string[],
): Promise<Map<string, ReferenceFontLink[]>> {
  const map = new Map<string, ReferenceFontLink[]>();
  if (referenceIds.length === 0) {
    return map;
  }

  const db = getDb();
  const rows = await db
    .select({
      referenceId: referenceFonts.referenceId,
      familyId: referenceFonts.familyId,
      role: referenceFonts.role,
      slug: fontFamilies.slug,
      name: fontFamilies.name,
    })
    .from(referenceFonts)
    .innerJoin(fontFamilies, eq(fontFamilies.id, referenceFonts.familyId))
    .where(inArray(referenceFonts.referenceId, referenceIds));

  for (const row of rows) {
    const list = map.get(row.referenceId) ?? [];
    list.push({
      familyId: row.familyId,
      slug: row.slug,
      name: row.name,
      role: row.role as ReferenceFontRole,
    });
    map.set(row.referenceId, list);
  }
  return map;
}

async function favoriteMap(libraryId: string, ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, string>();
  }
  const db = getDb();
  const rows = await db
    .select()
    .from(favorites)
    .where(eq(favorites.libraryId, libraryId));
  return new Map(
    rows
      .filter((row) => row.itemType === "reference" && ids.includes(row.itemId))
      .map((row) => [row.itemId, row.createdAt]),
  );
}

export async function listReferences(
  libraryId: string,
): Promise<ReferenceRecord[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(references)
    .where(eq(references.libraryId, libraryId))
    .orderBy(desc(references.createdAt));
  const links = await linksForReferences(rows.map((row) => row.id));
  const favs = await favoriteMap(
    libraryId,
    rows.map((row) => row.id),
  );
  return rows.map((row) =>
    toReference(row, links.get(row.id) ?? [], favs.get(row.id)),
  );
}

export async function getReferenceBySlug(
  libraryId: string,
  slug: string,
): Promise<ReferenceRecord | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(references)
    .where(and(eq(references.libraryId, libraryId), eq(references.slug, slug)))
    .limit(1);
  if (!row) {
    return null;
  }
  const links = await linksForReferences([row.id]);
  const favs = await favoriteMap(libraryId, [row.id]);
  return toReference(row, links.get(row.id) ?? [], favs.get(row.id));
}

export async function createReference(
  libraryId: string,
  input: {
    title: string;
    category?: string;
    year?: number;
    description?: string;
    tags?: string[];
    image: File;
    familyIds?: Array<{ familyId: string; role?: ReferenceFontRole }>;
  },
): Promise<ReferenceRecord> {
  const db = getDb();
  const taken = new Set(
    (
      await db
        .select({ slug: references.slug })
        .from(references)
        .where(eq(references.libraryId, libraryId))
    ).map((row) => row.slug),
  );
  const id = nanoid(12);
  const pathname = `libraries/${libraryId}/references/${id}-${input.image.name}`;
  const blob = await put(pathname, input.image, {
    access: "public",
    addRandomSuffix: false,
    contentType: input.image.type || "image/jpeg",
  });
  const now = new Date().toISOString();
  const row = {
    id,
    libraryId,
    slug: nextSlug(slugify(input.title), taken),
    title: input.title.trim(),
    category: input.category?.trim() || null,
    year: input.year ?? null,
    description: input.description?.trim() || null,
    imageUrl: blob.url,
    imagePathname: blob.pathname,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(references).values(row);

  if (input.familyIds?.length) {
    await db.insert(referenceFonts).values(
      input.familyIds.map((link) => ({
        id: nanoid(10),
        referenceId: id,
        familyId: link.familyId,
        role: link.role ?? "related",
      })),
    );
  }

  const created = await getReferenceBySlug(libraryId, row.slug);
  if (!created) {
    throw new Error("Reference not found after create");
  }
  return created;
}

export async function updateReference(
  libraryId: string,
  slug: string,
  input: {
    title?: string;
    category?: string | null;
    year?: number | null;
    description?: string | null;
    tags?: string[];
    familyIds?: Array<{ familyId: string; role?: ReferenceFontRole }>;
  },
): Promise<ReferenceRecord | null> {
  const existing = await getReferenceBySlug(libraryId, slug);
  if (!existing) {
    return null;
  }
  const db = getDb();
  await db
    .update(references)
    .set({
      title: input.title?.trim() ?? existing.title,
      category:
        input.category === undefined
          ? (existing.category ?? null)
          : input.category?.trim() || null,
      year: input.year === undefined ? (existing.year ?? null) : input.year,
      description:
        input.description === undefined
          ? (existing.description ?? null)
          : input.description?.trim() || null,
      tags: input.tags ?? existing.tags,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(references.id, existing.id));

  if (input.familyIds) {
    await db
      .delete(referenceFonts)
      .where(eq(referenceFonts.referenceId, existing.id));
    if (input.familyIds.length > 0) {
      await db.insert(referenceFonts).values(
        input.familyIds.map((link) => ({
          id: nanoid(10),
          referenceId: existing.id,
          familyId: link.familyId,
          role: link.role ?? "related",
        })),
      );
    }
  }

  return getReferenceBySlug(libraryId, existing.slug);
}

export async function deleteReference(
  libraryId: string,
  slug: string,
): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(references)
    .where(and(eq(references.libraryId, libraryId), eq(references.slug, slug)))
    .limit(1);
  if (!row) {
    return false;
  }
  await del([row.imageUrl, row.imagePathname]);
  await db.delete(references).where(eq(references.id, row.id));
  return true;
}

export async function listReferenceBlobs(libraryId: string) {
  const db = getDb();
  return db
    .select({
      imageUrl: references.imageUrl,
      imagePathname: references.imagePathname,
    })
    .from(references)
    .where(eq(references.libraryId, libraryId));
}
