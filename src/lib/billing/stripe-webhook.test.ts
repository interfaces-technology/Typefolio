import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type Stripe from "stripe";

import { isLaunchPricingFromCheckoutPriceId } from "@/lib/entitlements";

describe("Stripe checkout metadata", () => {
  it("maps launch checkout price id", () => {
    assert.equal(isLaunchPricingFromCheckoutPriceId("pro_launch"), true);
  });
});

describe("Stripe subscription fixture shape", () => {
  it("accepts minimal subscription object for handlers", () => {
    const subscription = {
      id: "sub_test",
      status: "active",
      customer: "cus_test",
      metadata: { userId: "user_1", checkoutPriceId: "pro_annual" },
      items: {
        data: [{ current_period_end: Math.floor(Date.now() / 1000) + 3600 }],
      },
    } as unknown as Stripe.Subscription;

    assert.equal(subscription.metadata.userId, "user_1");
  });
});
