import { eq } from "drizzle-orm";

import { getDb } from "@typefolio/core/db";
import {
  desktopAuthCodes,
  libraries,
  subscriptions,
  userProfiles,
} from "@typefolio/core/db/schema";
import { deleteLibrary, listLibrariesForUser } from "@typefolio/core/storage";
import { cancelPolarSubscriptionForUser } from "@typefolio/core/billing/polar";

export async function deleteAllUserData(userId: string): Promise<void> {
  await cancelPolarSubscriptionForUser(userId);

  const db = getDb();
  const librarySummaries = await listLibrariesForUser(userId);

  for (const summary of librarySummaries) {
    await deleteLibrary(summary.id);
  }

  await db.delete(desktopAuthCodes).where(eq(desktopAuthCodes.userId, userId));
  await db.delete(userProfiles).where(eq(userProfiles.userId, userId));
  await db.delete(subscriptions).where(eq(subscriptions.userId, userId));

  const orphanLibraries = await db
    .select({ id: libraries.id })
    .from(libraries)
    .where(eq(libraries.ownerUserId, userId));

  for (const row of orphanLibraries) {
    await deleteLibrary(row.id);
  }
}
