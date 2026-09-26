import { eq } from "drizzle-orm";

import { getDb } from "@typefolio/core/db";
import { authUser } from "@typefolio/core/db/schema-auth";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: mark-email-verified.ts <email>");
  process.exit(1);
}

const db = getDb();
const now = new Date().toISOString();

await db
  .update(authUser)
  .set({ emailVerified: true, updatedAt: now })
  .where(eq(authUser.email, email));

console.log(`Marked verified: ${email}`);
