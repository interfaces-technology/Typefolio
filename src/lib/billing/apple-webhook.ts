import {
  Environment,
  NotificationTypeV2,
  SignedDataVerifier,
  type ResponseBodyV2DecodedPayload,
} from "@apple/app-store-server-library";

import { hasProcessedBillingEvent, recordBillingEvent } from "@/lib/billing/events";
import {
  applyAppleProviderPatch,
  recomputeUserEntitlement,
} from "@/lib/entitlements";

export type DecodedAppleNotification = ResponseBodyV2DecodedPayload;

function getAppleBundleId(): string | null {
  const value = process.env.APPLE_BUNDLE_ID?.trim();
  return value || null;
}

function getAppleEnvironment(): Environment {
  const value = process.env.APPLE_ENVIRONMENT?.trim().toLowerCase();
  if (value === "production") {
    return Environment.PRODUCTION;
  }

  return Environment.SANDBOX;
}

let verifier: SignedDataVerifier | null = null;

function getVerifier(): SignedDataVerifier | null {
  const bundleId = getAppleBundleId();
  const appAppleIdRaw = process.env.APPLE_APP_ID?.trim();
  if (!bundleId || !appAppleIdRaw) {
    return null;
  }

  if (!verifier) {
    verifier = new SignedDataVerifier(
      [],
      true,
      getAppleEnvironment(),
      bundleId,
      Number(appAppleIdRaw),
    );
  }

  return verifier;
}

export async function decodeAppleSignedPayload(
  signedPayload: string,
): Promise<DecodedAppleNotification> {
  const instance = getVerifier();
  if (!instance) {
    throw new Error("apple_not_configured");
  }

  return instance.verifyAndDecodeNotification(signedPayload);
}

function expiresAtIso(expiresDateMs: number | undefined): string | null {
  if (!expiresDateMs) {
    return null;
  }

  return new Date(expiresDateMs).toISOString();
}

function mapAppleStatus(
  notificationType: string | undefined,
): string {
  switch (notificationType) {
    case NotificationTypeV2.EXPIRED:
    case NotificationTypeV2.GRACE_PERIOD_EXPIRED:
      return "expired";
    case NotificationTypeV2.REVOKE:
    case NotificationTypeV2.REFUND:
      return "revoked";
    default:
      return "active";
  }
}

export async function processAppleNotification(
  notification: DecodedAppleNotification,
  providerEventId: string,
): Promise<{ handled: boolean; action: string; userId?: string }> {
  if (await hasProcessedBillingEvent("apple", providerEventId)) {
    return { handled: false, action: "duplicate" };
  }

  const notificationType = notification.notificationType;
  const signedTransactionInfo = notification.data?.signedTransactionInfo;

  if (!signedTransactionInfo) {
    await recordBillingEvent({
      provider: "apple",
      providerEventId,
      eventType: notificationType ?? "unknown",
      outcome: "ignored",
    });
    return { handled: false, action: "missing_transaction" };
  }

  const verifier = getVerifier();
  if (!verifier) {
    throw new Error("apple_not_configured");
  }

  const transaction = await verifier.verifyAndDecodeTransaction(
    signedTransactionInfo,
  );

  const userId = transaction.appAccountToken?.trim();
  if (!userId) {
    await recordBillingEvent({
      provider: "apple",
      providerEventId,
      eventType: notificationType ?? "unknown",
      outcome: "failed",
    });
    return { handled: false, action: "missing_app_account_token" };
  }

  const appleStatus = mapAppleStatus(notificationType);
  const appleExpiresAt = expiresAtIso(transaction.expiresDate);

  await applyAppleProviderPatch(userId, {
    appleOriginalTransactionId: transaction.originalTransactionId ?? null,
    appleProductId: transaction.productId ?? null,
    appleExpiresAt,
    appleStatus,
  });

  await recomputeUserEntitlement(userId);

  await recordBillingEvent({
    provider: "apple",
    providerEventId,
    eventType: notificationType ?? "unknown",
    userId,
    outcome: "applied",
  });

  return { handled: true, action: notificationType ?? "processed", userId };
}

export async function handleAppleWebhookBody(body: {
  signedPayload?: string;
}): Promise<{ handled: boolean; action: string; userId?: string }> {
  const signedPayload = body.signedPayload?.trim();
  if (!signedPayload) {
    return { handled: false, action: "missing_signed_payload" };
  }

  const notification = await decodeAppleSignedPayload(signedPayload);
  const providerEventId =
    notification.notificationUUID?.trim() ||
    `${notification.notificationType}:${notification.signedDate ?? Date.now()}`;

  return processAppleNotification(notification, providerEventId);
}

/** Test helper: apply decoded notification without JWS verification. */
export async function processAppleNotificationForTest(
  notification: DecodedAppleNotification,
  providerEventId: string,
  transaction: {
    appAccountToken: string;
    originalTransactionId: string;
    productId: string;
    expiresDate?: number;
  },
): Promise<{ handled: boolean; action: string; userId?: string }> {
  if (await hasProcessedBillingEvent("apple", providerEventId)) {
    return { handled: false, action: "duplicate" };
  }

  const userId = transaction.appAccountToken.trim();
  const appleStatus = mapAppleStatus(notification.notificationType);
  const appleExpiresAt = expiresAtIso(transaction.expiresDate);

  await applyAppleProviderPatch(userId, {
    appleOriginalTransactionId: transaction.originalTransactionId,
    appleProductId: transaction.productId,
    appleExpiresAt,
    appleStatus,
  });

  await recomputeUserEntitlement(userId);

  await recordBillingEvent({
    provider: "apple",
    providerEventId,
    eventType: notification.notificationType ?? "test",
    userId,
    outcome: "applied",
  });

  return { handled: true, action: "test_applied", userId };
}
