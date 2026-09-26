import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getDb } from "@typefolio/core/db";
import { activityEvents } from "@typefolio/core/db/schema";
import type { ActivityAction, ActivityEvent } from "@typefolio/core/types";

function toEvent(row: typeof activityEvents.$inferSelect): ActivityEvent {
  return {
    id: row.id,
    occurredAt: row.occurredAt,
    action: row.action as ActivityAction,
    itemName: row.itemName,
    deviceId: row.deviceId ?? undefined,
  };
}

export async function logActivity(input: {
  libraryId: string;
  action: ActivityAction;
  itemName: string;
  deviceId?: string;
}): Promise<ActivityEvent> {
  const db = getDb();
  const row = {
    id: nanoid(12),
    libraryId: input.libraryId,
    occurredAt: new Date().toISOString(),
    action: input.action,
    itemName: input.itemName,
    deviceId: input.deviceId ?? null,
  };
  await db.insert(activityEvents).values(row);
  return toEvent(row);
}

export async function listActivity(
  libraryId: string,
  limit = 50,
): Promise<ActivityEvent[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(activityEvents)
    .where(eq(activityEvents.libraryId, libraryId))
    .orderBy(desc(activityEvents.occurredAt))
    .limit(limit);
  return rows.map(toEvent);
}
