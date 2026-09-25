import { Webhooks } from "@polar-sh/nextjs";

import { handlePolarSubscriptionEvent } from "@/lib/billing/polar-webhook";

type PolarSubscriptionPayload = {
  type: string;
  timestamp: Date;
  data: Parameters<typeof handlePolarSubscriptionEvent>[0]["subscription"];
};

async function processSubscriptionPayload(payload: PolarSubscriptionPayload): Promise<void> {
  const timestamp =
    payload.timestamp instanceof Date
      ? payload.timestamp.toISOString()
      : String(payload.timestamp);

  await handlePolarSubscriptionEvent({
    eventId: `${payload.type}:${payload.data.id}:${timestamp}`,
    eventType: payload.type,
    subscription: payload.data,
  });
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? "",
  onSubscriptionActive: (payload) =>
    processSubscriptionPayload(payload as PolarSubscriptionPayload),
  onSubscriptionUpdated: (payload) =>
    processSubscriptionPayload(payload as PolarSubscriptionPayload),
  onSubscriptionCanceled: (payload) =>
    processSubscriptionPayload(payload as PolarSubscriptionPayload),
  onSubscriptionRevoked: (payload) =>
    processSubscriptionPayload(payload as PolarSubscriptionPayload),
});
