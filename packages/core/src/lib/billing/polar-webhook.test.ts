import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isLaunchPricingFromCheckoutPriceId } from "@typefolio/core/entitlements";

describe("polar webhook helpers", () => {
  it("detects launch checkout price id", () => {
    assert.equal(isLaunchPricingFromCheckoutPriceId("pro_launch"), true);
  });
});
