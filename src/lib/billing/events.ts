import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getDb } from "@/lib/db";
import { billingEvents } from "@/lib/db/schema";

export type BillingProvider = "stripe" | "apple";

export type BillingEventOutcome = "applied" | "ignored" | "failed";

export async function recordBillingEvent(input: {
  provider: BillingProvider;
  providerEventId: string;
  eventType: string;
  userId?: string | null;
  outcome: BillingEventOutcome;
}): Promise<{ duplicate: boolean }> {
  const db = getDb();
  const now = new Date().toISOString();

  const [existing] = await db
    .select({ id: billingEvents.id })
    .from(billingEvents)
    .where(
      and(
        eq(billingEvents.provider, input.provider),
        eq(billingEvents.providerEventId, input.providerEventId),
      ),
    )
    .limit(1);

  if (existing) {
    return { duplicate: true };
  }

  try {
    await db.insert(billingEvents).values({
      id: nanoid(12),
      provider: input.provider,
      providerEventId: input.providerEventId,
      userId: input.userId ?? null,
      eventType: input.eventType,
      outcome: input.outcome,
      receivedAt: now,
      processedAt: now,
    });
    return { duplicate: false };
  } catch {
    return { duplicate: true };
  }
}

export async function hasProcessedBillingEvent(
  provider: BillingProvider,
  providerEventId: string,
): Promise<boolean> {
  const db = getDb();
  const [existing] = await db
    .select({ id: billingEvents.id })
    .from(billingEvents)
    .where(
      and(
        eq(billingEvents.provider, provider),
        eq(billingEvents.providerEventId, providerEventId),
      ),
    )
    .limit(1);

  return Boolean(existing);
}
