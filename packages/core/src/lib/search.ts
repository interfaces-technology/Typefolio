import { and, eq, ilike } from "drizzle-orm";

import { listCollections } from "@typefolio/core/collections";
import { getDb } from "@typefolio/core/db";
import { fontFamilies, references } from "@typefolio/core/db/schema";
import { listFamilies } from "@typefolio/core/families";
import { listReferences } from "@typefolio/core/references";
import type { SearchResults } from "@typefolio/core/types";

export async function searchLibrary(
  libraryId: string,
  query: string,
): Promise<SearchResults> {
  const q = query.trim();
  if (!q) {
    return {
      query: q,
      fonts: [],
      collections: [],
      inspiration: [],
      foundries: [],
      tags: [],
    };
  }

  const [fonts, collections, inspiration] = await Promise.all([
    listFamilies(libraryId, { q }),
    listCollections(libraryId),
    listReferences(libraryId),
  ]);

  const term = q.toLowerCase();
  const matchedCollections = collections.filter((collection) =>
    [collection.name, collection.description ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(term),
  );
  const matchedInspiration = inspiration.filter((reference) =>
    [reference.title, reference.category ?? "", reference.tags.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(term),
  );

  const db = getDb();
  const foundryRows = await db
    .select({ foundry: fontFamilies.foundry })
    .from(fontFamilies)
    .where(
      and(
        eq(fontFamilies.libraryId, libraryId),
        ilike(fontFamilies.foundry, `%${q}%`),
      ),
    );

  const tagRows = await db
    .select({ tags: references.tags })
    .from(references)
    .where(eq(references.libraryId, libraryId));

  const tags = Array.from(
    new Set(
      tagRows
        .flatMap((row) => row.tags)
        .filter((tag) => tag.toLowerCase().includes(term)),
    ),
  );

  return {
    query: q,
    fonts,
    collections: matchedCollections,
    inspiration: matchedInspiration,
    foundries: Array.from(
      new Set(
        foundryRows
          .map((row) => row.foundry)
          .filter((value): value is string => Boolean(value)),
      ),
    ),
    tags,
  };
}
