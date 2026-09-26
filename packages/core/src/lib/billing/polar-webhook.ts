import type { Subscription } from "@polar-sh/sdk/models/components/subscription";

import { hasProcessedBillingEvent, recordBillingEvent } from "@typefolio/core/billing/events";
import {
  applyPolarProviderPatch,
  isLaunchPricingFromCheckoutPriceId,
  isLaunchPricingFromPolarProductId,
  recomputeUserEntitlement,
} from "@typefolio/core/entitlements";

function readUserIdFromSubscription(subscription: Subscription): string | null {
  const metadataUserId = subscription.metadata?.userId;
  if (metadataUserId != null && String(metadataUserId).trim()) {
    return String(metadataUserId).trim();
  }

  const externalId = subscription.customer?.externalId;
  if (typeof externalId === "string" && externalId.trim()) {
    return externalId.trim();
  }

  return null;
}

function periodEndIso(subscription: Subscription): string | null {
  const end = subscription.currentPeriodEnd ?? subscription.endsAt;
  if (!end) {
    return null;
  }

  return end instanceof Date ? end.toISOString() : new Date(end).toISOString();
}

function productIdFromSubscription(subscription: Subscription): string | null {
  return subscription.productId ?? subscription.product?.id ?? null;
}

function launchPricingFromSubscription(subscription: Subscription): boolean {
  const checkoutPriceId = subscription.metadata?.checkoutPriceId;
  if (isLaunchPricingFromCheckoutPriceId(String(checkoutPriceId ?? ""))) {
    return true;
  }

  return isLaunchPricingFromPolarProductId(productIdFromSubscription(subscription));
}

export async function applyPolarSubscriptionUpdate(input: {
  userId: string;
  subscription: Subscription;
  polarCustomerId?: string | null;
}): Promise<void> {
  const { userId, subscription } = input;

  await applyPolarProviderPatch(userId, {
    polarCustomerId:
      input.polarCustomerId ?? subscription.customerId ?? subscription.customer?.id ?? null,
    polarSubscriptionId: subscription.id,
    polarStatus: subscription.status,
    polarCurrentPeriodEnd: periodEndIso(subscription),
    polarProductId: productIdFromSubscription(subscription),
    polarIsLaunchPricing: launchPricingFromSubscription(subscription),
  });

  await recomputeUserEntitlement(userId);
}

export async function handlePolarSubscriptionEvent(input: {
  eventId: string;
  eventType: string;
  subscription: Subscription;
}): Promise<{ handled: boolean; action: string; userId?: string }> {
  if (await hasProcessedBillingEvent("polar", input.eventId)) {
    return { handled: false, action: "duplicate" };
  }

  const userId = readUserIdFromSubscription(input.subscription);
  if (!userId) {
    await recordBillingEvent({
      provider: "polar",
      providerEventId: input.eventId,
      eventType: input.eventType,
      outcome: "ignored",
    });
    return { handled: false, action: "missing_user_id" };
  }

  try {
    await applyPolarSubscriptionUpdate({
      userId,
      subscription: input.subscription,
    });

    await recordBillingEvent({
      provider: "polar",
      providerEventId: input.eventId,
      eventType: input.eventType,
      userId,
      outcome: "applied",
    });

    return { handled: true, action: "subscription_updated", userId };
  } catch {
    await recordBillingEvent({
      provider: "polar",
      providerEventId: input.eventId,
      eventType: input.eventType,
      userId,
      outcome: "failed",
    });
    return { handled: false, action: "failed", userId };
  }
}
