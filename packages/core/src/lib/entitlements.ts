import { eq, sql, sum } from "drizzle-orm";

import { getDb } from "@typefolio/core/db";
import type { SubscriptionRow } from "@typefolio/core/db/schema";
import { devices, fonts, libraries, subscriptions } from "@typefolio/core/db/schema";
import type { Entitlement, PlanId, SubscriptionStatus } from "@typefolio/core/types";

export const FREE_STORAGE_LIMIT_BYTES = 52_428_800;
export const PRO_STORAGE_LIMIT_BYTES = 524_288_000;
export const FREE_DEVICE_LIMIT = 1;
export const PRO_DEVICE_LIMIT = 2;

export function planLimits(plan: PlanId): {
  storageLimitBytes: number;
  deviceLimit: number;
  features: Entitlement["features"];
} {
  if (plan === "pro") {
    return {
      storageLimitBytes: PRO_STORAGE_LIMIT_BYTES,
      deviceLimit: PRO_DEVICE_LIMIT,
      features: { sync: true, zipDownload: false, compare: true },
    };
  }

  return {
    storageLimitBytes: FREE_STORAGE_LIMIT_BYTES,
    deviceLimit: FREE_DEVICE_LIMIT,
    features: { sync: false, zipDownload: false, compare: true },
  };
}

export function isLaunchOfferActive(): boolean {
  const value = process.env.LAUNCH_OFFER_ACTIVE?.trim().toLowerCase();
  return value !== "false" && value !== "0";
}

export function isLaunchPricingFromCheckoutPriceId(
  checkoutPriceId: string | null | undefined,
): boolean {
  if (!checkoutPriceId) {
    return false;
  }

  return checkoutPriceId === "pro_launch";
}

export function isLaunchPricingFromPolarProductId(
  polarProductId: string | null | undefined,
): boolean {
  if (!polarProductId) {
    return false;
  }

  const launchProductId = process.env.POLAR_PRODUCT_LAUNCH?.trim();
  return Boolean(launchProductId && polarProductId === launchProductId);
}

export function isProPolarStatus(
  status: string | null | undefined,
  periodEnd: string | null | undefined,
): boolean {
  if (!status) {
    return false;
  }

  const normalized = status.toLowerCase();
  if (
    normalized === "active" ||
    normalized === "trialing" ||
    normalized === "past_due"
  ) {
    return true;
  }

  if (
    (normalized === "canceled" || normalized === "cancelled") &&
    periodEnd
  ) {
    return new Date(periodEnd).getTime() > Date.now();
  }

  return false;
}

export function isProAppleStatus(
  status: string | null | undefined,
  expiresAt: string | null | undefined,
): boolean {
  if (!status || status === "expired" || status === "revoked") {
    return false;
  }

  if (!expiresAt) {
    return status === "active";
  }

  return new Date(expiresAt).getTime() > Date.now();
}

export function effectiveProFromSubscriptionRow(
  row: SubscriptionRow | null,
): {
  isPro: boolean;
  status: SubscriptionStatus;
  currentPeriodEnd?: string;
  isLaunchPricing: boolean;
} {
  if (!row) {
    return { isPro: false, status: "active", isLaunchPricing: false };
  }

  const polarActive = isProPolarStatus(
    row.polarStatus,
    row.polarCurrentPeriodEnd,
  );
  const appleActive = isProAppleStatus(row.appleStatus, row.appleExpiresAt);

  if (!polarActive && !appleActive) {
    return { isPro: false, status: "active", isLaunchPricing: false };
  }

  const ends: string[] = [];
  if (polarActive && row.polarCurrentPeriodEnd) {
    ends.push(row.polarCurrentPeriodEnd);
  }
  if (appleActive && row.appleExpiresAt) {
    ends.push(row.appleExpiresAt);
  }

  const currentPeriodEnd =
    ends.length > 0
      ? ends.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
      : undefined;

  const isLaunchPricing = polarActive ? row.polarIsLaunchPricing : false;

  return {
    isPro: true,
    status: "active",
    currentPeriodEnd,
    isLaunchPricing,
  };
}

export async function getStorageUsedBytes(userId: string): Promise<number> {
  const db = getDb();
  const [result] = await db
    .select({ total: sum(fonts.size) })
    .from(fonts)
    .innerJoin(libraries, eq(fonts.libraryId, libraries.id))
    .where(eq(libraries.ownerUserId, userId));

  return Number(result?.total ?? 0);
}

export async function getDeviceCount(userId: string): Promise<number> {
  const db = getDb();
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(devices)
    .innerJoin(libraries, eq(devices.libraryId, libraries.id))
    .where(eq(libraries.ownerUserId, userId));

  return result?.count ?? 0;
}

export async function getSubscriptionRow(
  userId: string,
): Promise<SubscriptionRow | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return row ?? null;
}

export async function ensureSubscriptionRow(
  userId: string,
): Promise<SubscriptionRow> {
  const existing = await getSubscriptionRow(userId);
  if (existing) {
    return existing;
  }

  const db = getDb();
  const now = new Date().toISOString();
  const limits = planLimits("free");

  await db
    .insert(subscriptions)
    .values({
      userId,
      plan: "free",
      status: "active",
      storageLimitBytes: limits.storageLimitBytes,
      deviceLimit: limits.deviceLimit,
      updatedAt: now,
    })
    .onConflictDoNothing();

  return (await getSubscriptionRow(userId))!;
}

export async function getUserEntitlement(userId: string): Promise<Entitlement> {
  await ensureSubscriptionRow(userId);
  const row = await getSubscriptionRow(userId);
  const [storageUsedBytes, deviceCount] = await Promise.all([
    getStorageUsedBytes(userId),
    getDeviceCount(userId),
  ]);

  const effective = effectiveProFromSubscriptionRow(row);
  const limits = planLimits(effective.isPro ? "pro" : "free");

  return {
    plan: effective.isPro ? "pro" : "free",
    status: effective.status,
    isLaunchPricing: effective.isLaunchPricing,
    storageLimitBytes: limits.storageLimitBytes,
    storageUsedBytes,
    deviceLimit: limits.deviceLimit,
    deviceCount,
    features: limits.features,
    currentPeriodEnd: effective.currentPeriodEnd,
  };
}

export type PolarProviderPatch = {
  polarCustomerId?: string | null;
  polarSubscriptionId?: string | null;
  polarStatus?: string | null;
  polarCurrentPeriodEnd?: string | null;
  polarProductId?: string | null;
  polarIsLaunchPricing?: boolean;
};

export type AppleProviderPatch = {
  appleOriginalTransactionId?: string | null;
  appleProductId?: string | null;
  appleExpiresAt?: string | null;
  appleStatus?: string | null;
};

export async function applyPolarProviderPatch(
  userId: string,
  patch: PolarProviderPatch,
): Promise<void> {
  await ensureSubscriptionRow(userId);
  const db = getDb();
  const now = new Date().toISOString();

  await db
    .update(subscriptions)
    .set({
      ...patch,
      updatedAt: now,
    })
    .where(eq(subscriptions.userId, userId));
}

export async function applyAppleProviderPatch(
  userId: string,
  patch: AppleProviderPatch,
): Promise<void> {
  await ensureSubscriptionRow(userId);
  const db = getDb();
  const now = new Date().toISOString();

  await db
    .update(subscriptions)
    .set({
      ...patch,
      updatedAt: now,
    })
    .where(eq(subscriptions.userId, userId));
}

export async function recomputeUserEntitlement(userId: string): Promise<void> {
  await ensureSubscriptionRow(userId);
  const row = await getSubscriptionRow(userId);
  const effective = effectiveProFromSubscriptionRow(row);
  const db = getDb();
  const now = new Date().toISOString();

  if (effective.isPro) {
    const limits = planLimits("pro");
    await db
      .update(subscriptions)
      .set({
        plan: "pro",
        status: effective.status,
        isLaunchPricing: effective.isLaunchPricing,
        currentPeriodEnd: effective.currentPeriodEnd ?? null,
        storageLimitBytes: limits.storageLimitBytes,
        deviceLimit: limits.deviceLimit,
        updatedAt: now,
      })
      .where(eq(subscriptions.userId, userId));
    return;
  }

  const limits = planLimits("free");
  await db
    .update(subscriptions)
    .set({
      plan: "free",
      status: "active",
      isLaunchPricing: false,
      currentPeriodEnd: null,
      storageLimitBytes: limits.storageLimitBytes,
      deviceLimit: limits.deviceLimit,
      updatedAt: now,
    })
    .where(eq(subscriptions.userId, userId));
}

export async function setPolarCustomerId(
  userId: string,
  polarCustomerId: string,
): Promise<void> {
  await ensureSubscriptionRow(userId);
  const db = getDb();
  const now = new Date().toISOString();

  await db
    .update(subscriptions)
    .set({
      polarCustomerId,
      updatedAt: now,
    })
    .where(eq(subscriptions.userId, userId));
}
