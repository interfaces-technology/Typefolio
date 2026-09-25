import Stripe from "stripe";

import {
  effectiveProFromSubscriptionRow,
  getSubscriptionRow,
  isLaunchOfferActive,
  isLaunchPricingFromCheckoutPriceId,
  setStripeCustomerId,
} from "@/lib/entitlements";
import { isCheckoutPriceId, resolveStripePriceId } from "@/lib/billing/plans";
import type { CheckoutPriceId } from "@/lib/types";

function getStripeSecretKey(): string | null {
  const value = process.env.STRIPE_SECRET_KEY?.trim().replace(/^['"]|['"]$/g, "");
  return value || null;
}

export function getStripeClient(): Stripe | null {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    return null;
  }

  return new Stripe(secretKey);
}

function getAppOrigin(): string {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    "http://localhost:43123";

  return configured.replace(/\/$/, "");
}

export function validateCheckoutPriceId(priceId: unknown): {
  ok: true;
  priceId: CheckoutPriceId;
  stripePriceId: string;
} | {
  ok: false;
  reason: "invalid" | "unavailable" | "not_configured";
} {
  if (!isCheckoutPriceId(priceId)) {
    return { ok: false, reason: "invalid" };
  }

  if (priceId === "pro_launch" && !isLaunchOfferActive()) {
    return { ok: false, reason: "unavailable" };
  }

  const stripePriceId = resolveStripePriceId(priceId);
  if (!stripePriceId) {
    return { ok: false, reason: "not_configured" };
  }

  return { ok: true, priceId, stripePriceId };
}

export async function createCheckoutSession(input: {
  userId: string;
  email?: string | null;
  priceId: CheckoutPriceId;
}): Promise<{ checkoutUrl: string } | null> {
  const stripe = getStripeClient();
  if (!stripe) {
    return null;
  }

  const validated = validateCheckoutPriceId(input.priceId);
  if (!validated.ok) {
    throw new Error(validated.reason);
  }

  const subscription = await getSubscriptionRow(input.userId);
  const effective = effectiveProFromSubscriptionRow(subscription);
  if (effective.isPro) {
    throw new Error("already_subscribed");
  }

  let stripeCustomerId = subscription?.stripeCustomerId ?? null;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: input.email ?? undefined,
      metadata: { userId: input.userId },
    });
    stripeCustomerId = customer.id;
    await setStripeCustomerId(input.userId, stripeCustomerId);
  } else {
    await stripe.customers.update(stripeCustomerId, {
      metadata: { userId: input.userId },
    });
  }

  const origin = getAppOrigin();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    line_items: [{ price: validated.stripePriceId, quantity: 1 }],
    success_url: `${origin}/library?checkout=success`,
    cancel_url: `${origin}/?checkout=canceled`,
    client_reference_id: input.userId,
    metadata: {
      userId: input.userId,
      checkoutPriceId: input.priceId,
    },
    subscription_data: {
      metadata: {
        userId: input.userId,
        checkoutPriceId: input.priceId,
      },
    },
  });

  if (!session.url) {
    return null;
  }

  return { checkoutUrl: session.url };
}

export async function createPortalSession(
  userId: string,
): Promise<{ portalUrl: string } | null> {
  const stripe = getStripeClient();
  if (!stripe) {
    return null;
  }

  const subscription = await getSubscriptionRow(userId);
  if (!subscription?.stripeCustomerId) {
    throw new Error("no_customer");
  }

  const origin = getAppOrigin();
  const session = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${origin}/library`,
  });

  return { portalUrl: session.url };
}

export { isLaunchPricingFromCheckoutPriceId };
