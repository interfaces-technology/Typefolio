import {
  FREE_DEVICE_LIMIT,
  FREE_STORAGE_LIMIT_BYTES,
  isLaunchOfferActive,
  PRO_DEVICE_LIMIT,
  PRO_STORAGE_LIMIT_BYTES,
} from "@/lib/entitlements";
import type { CheckoutPriceId } from "@/lib/types";

export function resolveStripePriceId(priceId: CheckoutPriceId): string | null {
  const envMap: Record<CheckoutPriceId, string | undefined> = {
    pro_annual: process.env.STRIPE_PRICE_ANNUAL,
    pro_launch: process.env.STRIPE_PRICE_LAUNCH,
    pro_monthly: process.env.STRIPE_PRICE_MONTHLY,
  };

  const value = envMap[priceId]?.trim().replace(/^['"]|['"]$/g, "");
  return value || null;
}

export function isCheckoutPriceId(value: unknown): value is CheckoutPriceId {
  return (
    value === "pro_annual" || value === "pro_launch" || value === "pro_monthly"
  );
}

export function getPublicBillingPlans(): {
  plans: Array<{
    id: CheckoutPriceId | "free";
    name: string;
    priceGbp: number;
    interval: "year" | "month" | null;
    storageLimitBytes: number;
    deviceLimit: number;
    features: string[];
    highlight: boolean;
    checkoutPriceId?: CheckoutPriceId;
    badge?: string;
    available?: boolean;
  }>;
  launchOffer: { active: boolean; message: string };
} {
  const launchActive = isLaunchOfferActive();

  return {
    plans: [
      {
        id: "free",
        name: "Free",
        priceGbp: 0,
        interval: null,
        storageLimitBytes: FREE_STORAGE_LIMIT_BYTES,
        deviceLimit: FREE_DEVICE_LIMIT,
        features: ["Upload fonts", "Manual download", "1 device"],
        highlight: false,
      },
      {
        id: "pro_annual",
        name: "Pro",
        priceGbp: 40,
        interval: "year",
        storageLimitBytes: PRO_STORAGE_LIMIT_BYTES,
        deviceLimit: PRO_DEVICE_LIMIT,
        features: ["500 MB storage", "2 devices", "Auto-sync"],
        highlight: true,
        checkoutPriceId: "pro_annual",
      },
      {
        id: "pro_launch",
        name: "Pro Launch",
        priceGbp: 20,
        interval: "year",
        storageLimitBytes: PRO_STORAGE_LIMIT_BYTES,
        deviceLimit: PRO_DEVICE_LIMIT,
        features: ["Same as Pro", "Launch pricing locked in"],
        highlight: true,
        badge: "50% off",
        checkoutPriceId: "pro_launch",
        available: launchActive,
      },
      {
        id: "pro_monthly",
        name: "Pro Monthly",
        priceGbp: 4.99,
        interval: "month",
        storageLimitBytes: PRO_STORAGE_LIMIT_BYTES,
        deviceLimit: PRO_DEVICE_LIMIT,
        features: ["Same as Pro", "Pay monthly"],
        highlight: false,
        checkoutPriceId: "pro_monthly",
      },
    ],
    launchOffer: {
      active: launchActive,
      message: "Launch pricing: £20/year — locked in for early users.",
    },
  };
}
