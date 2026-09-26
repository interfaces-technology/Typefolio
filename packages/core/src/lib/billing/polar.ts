import { Polar } from "@polar-sh/sdk";

import { getAppOrigin } from "@typefolio/core/auth/config";
import {
  effectiveProFromSubscriptionRow,
  getSubscriptionRow,
  isLaunchOfferActive,
  isLaunchPricingFromCheckoutPriceId,
  setPolarCustomerId,
} from "@typefolio/core/entitlements";
import { isCheckoutPriceId, resolvePolarProductId } from "@typefolio/core/billing/plans";
import type { CheckoutPriceId } from "@typefolio/core/types";

function getPolarAccessToken(): string | null {
  const value = process.env.POLAR_ACCESS_TOKEN?.trim().replace(/^['"]|['"]$/g, "");
  return value || null;
}

function getPolarServer(): "sandbox" | "production" {
  const value = process.env.POLAR_SERVER?.trim().toLowerCase();
  return value === "production" ? "production" : "sandbox";
}

export function getPolarClient(): Polar | null {
  const accessToken = getPolarAccessToken();
  if (!accessToken) {
    return null;
  }

  return new Polar({
    accessToken,
    server: getPolarServer(),
  });
}

export function validateCheckoutPriceId(priceId: unknown): {
  ok: true;
  priceId: CheckoutPriceId;
  polarProductId: string;
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

  const polarProductId = resolvePolarProductId(priceId);
  if (!polarProductId) {
    return { ok: false, reason: "not_configured" };
  }

  return { ok: true, priceId, polarProductId };
}

export async function createCheckoutSession(input: {
  userId: string;
  email?: string | null;
  priceId: CheckoutPriceId;
  customerIpAddress?: string | null;
}): Promise<{ checkoutUrl: string } | null> {
  const polar = getPolarClient();
  if (!polar) {
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

  const origin = getAppOrigin();
  const checkout = await polar.checkouts.create({
    products: [validated.polarProductId],
    externalCustomerId: input.userId,
    customerEmail: input.email ?? undefined,
    customerIpAddress: input.customerIpAddress ?? undefined,
    successUrl: `${origin}/library?checkout=success`,
    metadata: {
      userId: input.userId,
      checkoutPriceId: input.priceId,
    },
  });

  if (checkout.customerId) {
    await setPolarCustomerId(input.userId, checkout.customerId);
  }

  if (!checkout.url) {
    return null;
  }

  return { checkoutUrl: checkout.url };
}

export async function cancelPolarSubscriptionForUser(userId: string): Promise<void> {
  const polar = getPolarClient();
  if (!polar) {
    return;
  }

  const row = await getSubscriptionRow(userId);
  if (!row?.polarSubscriptionId) {
    return;
  }

  try {
    await polar.subscriptions.revoke({ id: row.polarSubscriptionId });
  } catch (error) {
    console.error("[polar] revoke subscription failed", {
      userId,
      subscriptionId: row.polarSubscriptionId,
      error,
    });
  }
}

export async function createPortalSession(
  userId: string,
): Promise<{ portalUrl: string } | null> {
  const polar = getPolarClient();
  if (!polar) {
    return null;
  }

  const origin = getAppOrigin();
  const session = await polar.customerSessions.create({
    externalCustomerId: userId,
    returnUrl: `${origin}/library`,
  });

  return { portalUrl: session.customerPortalUrl };
}

export { isLaunchPricingFromCheckoutPriceId };
