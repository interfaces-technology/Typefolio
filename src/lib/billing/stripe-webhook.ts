import type Stripe from "stripe";

import { hasProcessedBillingEvent, recordBillingEvent } from "@/lib/billing/events";
import {
  applyStripeProviderPatch,
  isLaunchPricingFromCheckoutPriceId,
  isLaunchPricingFromStripePriceId,
  recomputeUserEntitlement,
} from "@/lib/entitlements";

function readUserIdFromMetadata(
  metadata: Stripe.Metadata | null | undefined,
): string | null {
  const userId = metadata?.userId?.trim();
  return userId || null;
}

function periodEndIso(
  subscription: Stripe.Subscription,
): string | null {
  const end = subscription.items.data[0]?.current_period_end;
  if (!end) {
    return null;
  }

  return new Date(end * 1000).toISOString();
}

function launchPricingFromSubscription(
  subscription: Stripe.Subscription,
): boolean {
  const checkoutPriceId = subscription.metadata?.checkoutPriceId;
  if (isLaunchPricingFromCheckoutPriceId(checkoutPriceId)) {
    return true;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  return isLaunchPricingFromStripePriceId(priceId);
}

export async function applyStripeSubscriptionUpdate(input: {
  userId: string;
  subscription: Stripe.Subscription;
  stripeCustomerId?: string | null;
}): Promise<void> {
  const { userId, subscription } = input;
  const status = subscription.status;
  const periodEnd = periodEndIso(subscription);

  await applyStripeProviderPatch(userId, {
    stripeCustomerId:
      input.stripeCustomerId ??
      (typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id) ??
      null,
    stripeSubscriptionId: subscription.id,
    stripeStatus: status,
    stripeCurrentPeriodEnd: periodEnd,
    stripeIsLaunchPricing: launchPricingFromSubscription(subscription),
  });

  await recomputeUserEntitlement(userId);
}

export async function handleStripeWebhookEvent(
  event: Stripe.Event,
): Promise<{ handled: boolean; action: string; userId?: string }> {
  if (await hasProcessedBillingEvent("stripe", event.id)) {
    return { handled: false, action: "duplicate" };
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") {
          await recordBillingEvent({
            provider: "stripe",
            providerEventId: event.id,
            eventType: event.type,
            outcome: "ignored",
          });
          return { handled: false, action: "ignored_non_subscription_checkout" };
        }

        const userId =
          session.client_reference_id?.trim() ||
          readUserIdFromMetadata(session.metadata);

        if (!userId) {
          await recordBillingEvent({
            provider: "stripe",
            providerEventId: event.id,
            eventType: event.type,
            outcome: "failed",
          });
          return { handled: false, action: "missing_user_id" };
        }

        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;

        if (subscriptionId) {
          await applyStripeProviderPatch(userId, {
            stripeCustomerId:
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id ?? null,
            stripeSubscriptionId: subscriptionId,
            stripeStatus: "active",
            stripeIsLaunchPricing: isLaunchPricingFromCheckoutPriceId(
              session.metadata?.checkoutPriceId,
            ),
          });
          await recomputeUserEntitlement(userId);
        }

        await recordBillingEvent({
          provider: "stripe",
          providerEventId: event.id,
          eventType: event.type,
          userId,
          outcome: "applied",
        });

        return { handled: true, action: "checkout_completed", userId };
      }

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = readUserIdFromMetadata(subscription.metadata);

        if (!userId) {
          await recordBillingEvent({
            provider: "stripe",
            providerEventId: event.id,
            eventType: event.type,
            outcome: "failed",
          });
          return { handled: false, action: "missing_user_id" };
        }

        if (event.type === "customer.subscription.deleted") {
          await applyStripeProviderPatch(userId, {
            stripeSubscriptionId: subscription.id,
            stripeStatus: "canceled",
            stripeCurrentPeriodEnd: periodEndIso(subscription),
          });
        } else {
          await applyStripeSubscriptionUpdate({
            userId,
            subscription,
          });
        }

        await recomputeUserEntitlement(userId);

        await recordBillingEvent({
          provider: "stripe",
          providerEventId: event.id,
          eventType: event.type,
          userId,
          outcome: "applied",
        });

        return { handled: true, action: event.type, userId };
      }

      default:
        await recordBillingEvent({
          provider: "stripe",
          providerEventId: event.id,
          eventType: event.type,
          outcome: "ignored",
        });
        return { handled: false, action: "ignored_event_type" };
    }
  } catch (error) {
    await recordBillingEvent({
      provider: "stripe",
      providerEventId: event.id,
      eventType: event.type,
      outcome: "failed",
    });
    throw error;
  }
}
