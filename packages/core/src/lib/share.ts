import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getAppOrigin } from "@typefolio/core/auth/config";
import { getDb } from "@typefolio/core/db";
import { shareLinks } from "@typefolio/core/db/schema";
import type { ShareLink, ShareVisibility } from "@typefolio/core/types";

function toShare(row: typeof shareLinks.$inferSelect): ShareLink {
  return {
    id: row.id,
    resourceType: row.resourceType,
    resourceId: row.resourceId,
    token: row.token,
    visibility: row.visibility as ShareVisibility,
    url: `${getAppOrigin()}/share/${row.token}`,
    createdAt: row.createdAt,
  };
}

export async function createShareLink(
  libraryId: string,
  input: {
    resourceType: string;
    resourceId: string;
    visibility?: ShareVisibility;
  },
): Promise<ShareLink> {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(shareLinks)
    .where(
      and(
        eq(shareLinks.libraryId, libraryId),
        eq(shareLinks.resourceType, input.resourceType),
        eq(shareLinks.resourceId, input.resourceId),
      ),
    )
    .limit(1);

  if (existing) {
    return toShare(existing);
  }

  const row = {
    id: nanoid(12),
    libraryId,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    token: nanoid(18),
    visibility: input.visibility ?? "link",
    createdAt: new Date().toISOString(),
  };
  await db.insert(shareLinks).values(row);
  return toShare(row);
}

export async function listShareLinks(libraryId: string): Promise<ShareLink[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.libraryId, libraryId));
  return rows.map(toShare);
}
