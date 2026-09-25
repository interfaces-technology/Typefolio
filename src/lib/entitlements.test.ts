import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  effectiveProFromSubscriptionRow,
  isProAppleStatus,
  isProStripeStatus,
  isLaunchPricingFromCheckoutPriceId,
  planLimits,
} from "@/lib/entitlements";
import type { SubscriptionRow } from "@/lib/db/schema";

function baseRow(overrides: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    userId: "user_1",
    plan: "free",
    status: "active",
    revenuecatCustomerId: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripeStatus: null,
    stripeCurrentPeriodEnd: null,
    stripeIsLaunchPricing: false,
    appleOriginalTransactionId: null,
    appleProductId: null,
    appleExpiresAt: null,
    appleStatus: null,
    isLaunchPricing: false,
    currentPeriodEnd: null,
    storageLimitBytes: 52_428_800,
    deviceLimit: 1,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("effectiveProFromSubscriptionRow", () => {
  it("returns free when no providers are active", () => {
    const result = effectiveProFromSubscriptionRow(baseRow());
    assert.equal(result.isPro, false);
  });

  it("returns pro when Stripe is active", () => {
    const result = effectiveProFromSubscriptionRow(
      baseRow({
        stripeStatus: "active",
        stripeCurrentPeriodEnd: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    );
    assert.equal(result.isPro, true);
  });

  it("returns pro when Apple is active", () => {
    const result = effectiveProFromSubscriptionRow(
      baseRow({
        appleStatus: "active",
        appleExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    );
    assert.equal(result.isPro, true);
  });

  it("stays pro when only Apple remains after Stripe ends", () => {
    const result = effectiveProFromSubscriptionRow(
      baseRow({
        stripeStatus: "canceled",
        stripeCurrentPeriodEnd: new Date(Date.now() - 86_400_000).toISOString(),
        appleStatus: "active",
        appleExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    );
    assert.equal(result.isPro, true);
  });

  it("uses stripe launch pricing when Stripe is the active provider", () => {
    const result = effectiveProFromSubscriptionRow(
      baseRow({
        stripeStatus: "active",
        stripeIsLaunchPricing: true,
        stripeCurrentPeriodEnd: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    );
    assert.equal(result.isLaunchPricing, true);
  });
});

describe("provider status helpers", () => {
  it("detects canceled Stripe with future period end", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    assert.equal(isProStripeStatus("canceled", future), true);
  });

  it("detects expired Apple subscriptions", () => {
    assert.equal(isProAppleStatus("expired", new Date().toISOString()), false);
  });

  it("detects active Apple subscriptions by expiry", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    assert.equal(isProAppleStatus("active", future), true);
  });
});

describe("planLimits", () => {
  it("disables sync on free", () => {
    assert.equal(planLimits("free").features.sync, false);
  });

  it("enables sync on pro", () => {
    assert.equal(planLimits("pro").features.sync, true);
  });
});

describe("isLaunchPricingFromCheckoutPriceId", () => {
  it("detects launch checkout id", () => {
    assert.equal(isLaunchPricingFromCheckoutPriceId("pro_launch"), true);
    assert.equal(isLaunchPricingFromCheckoutPriceId("pro_annual"), false);
  });
});
