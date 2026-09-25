import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  effectiveProFromSubscriptionRow,
  isLaunchPricingFromCheckoutPriceId,
  isProAppleStatus,
  isProPolarStatus,
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
    polarCustomerId: null,
    polarSubscriptionId: null,
    polarStatus: null,
    polarCurrentPeriodEnd: null,
    polarProductId: null,
    polarIsLaunchPricing: false,
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

  it("returns pro when Polar is active", () => {
    const result = effectiveProFromSubscriptionRow(
      baseRow({
        polarStatus: "active",
        polarCurrentPeriodEnd: new Date(Date.now() + 86_400_000).toISOString(),
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

  it("uses polar launch pricing when Polar is the active provider", () => {
    const result = effectiveProFromSubscriptionRow(
      baseRow({
        polarStatus: "active",
        polarIsLaunchPricing: true,
        polarCurrentPeriodEnd: new Date(Date.now() + 86_400_000).toISOString(),
      }),
    );
    assert.equal(result.isPro, true);
    assert.equal(result.isLaunchPricing, true);
  });
});

describe("isProPolarStatus", () => {
  it("treats active as pro", () => {
    assert.equal(isProPolarStatus("active", null), true);
  });

  it("treats canceled with future period end as pro", () => {
    assert.equal(
      isProPolarStatus(
        "canceled",
        new Date(Date.now() + 86_400_000).toISOString(),
      ),
      true,
    );
  });
});

describe("isProAppleStatus", () => {
  it("rejects expired", () => {
    assert.equal(isProAppleStatus("expired", null), false);
  });
});

describe("planLimits", () => {
  it("disables zip download on all plans", () => {
    assert.equal(planLimits("free").features.zipDownload, false);
    assert.equal(planLimits("pro").features.zipDownload, false);
  });
});

describe("isLaunchPricingFromCheckoutPriceId", () => {
  it("matches pro_launch", () => {
    assert.equal(isLaunchPricingFromCheckoutPriceId("pro_launch"), true);
    assert.equal(isLaunchPricingFromCheckoutPriceId("pro_annual"), false);
  });
});
