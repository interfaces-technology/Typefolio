import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@typefolio/core/db";
import { shareLinks } from "@typefolio/core/db/schema";
import { getFamilyById } from "@typefolio/core/families";

interface RouteContext {
  params: Promise<{ token: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const db = getDb();
  const [link] = await db
    .select()
    .from(shareLinks)
    .where(eq(shareLinks.token, token))
    .limit(1);

  if (!link) {
    return NextResponse.json({ error: "Link not found." }, { status: 404 });
  }

  const family =
    link.resourceType === "family"
      ? await getFamilyById(link.libraryId, link.resourceId)
      : null;

  return NextResponse.json({
    resourceType: link.resourceType,
    familyName: family?.familyName ?? null,
    foundry: family?.foundry ?? null,
  });
}
