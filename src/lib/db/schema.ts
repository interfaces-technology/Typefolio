import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import type { VariableAxis } from "@/lib/types";

const timestamptz = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "string" });

export const libraries = pgTable(
  "libraries",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    syncCode: text("sync_code").notNull(),
    createdAt: timestamptz("created_at").notNull(),
    updatedAt: timestamptz("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("libraries_sync_code_idx").on(table.syncCode),
    index("libraries_owner_user_id_idx").on(table.ownerUserId),
  ],
);

export const fonts = pgTable(
  "fonts",
  {
    id: text("id").primaryKey(),
    libraryId: text("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    originalName: text("original_name").notNull(),
    storedName: text("stored_name").notNull(),
    blobUrl: text("blob_url").notNull(),
    blobPathname: text("blob_pathname").notNull(),
    sha256: text("sha256").notNull(),
    size: integer("size").notNull(),
    extension: text("extension").notNull(),
    familyName: text("family_name"),
    styleName: text("style_name"),
    weight: integer("weight"),
    italic: boolean("italic"),
    postscriptName: text("postscript_name"),
    variableAxes: jsonb("variable_axes").$type<VariableAxis[]>(),
    uploadedAt: timestamptz("uploaded_at").notNull(),
  },
  (table) => [
    index("fonts_library_id_idx").on(table.libraryId),
    index("fonts_library_family_name_idx").on(table.libraryId, table.familyName),
  ],
);

export const devices = pgTable(
  "devices",
  {
    id: text("id").primaryKey(),
    libraryId: text("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    platform: text("platform").notNull(),
    registeredAt: timestamptz("registered_at").notNull(),
    lastSeenAt: timestamptz("last_seen_at").notNull(),
    lastSyncAt: timestamptz("last_sync_at"),
    installedFontIds: jsonb("installed_font_ids")
      .$type<string[]>()
      .notNull()
      .default([]),
  },
  (table) => [
    index("devices_library_id_idx").on(table.libraryId),
    uniqueIndex("devices_library_name_platform_idx").on(
      table.libraryId,
      table.name,
      table.platform,
    ),
  ],
);

export type LibraryRow = typeof libraries.$inferSelect;
export type FontRow = typeof fonts.$inferSelect;
export type DeviceRow = typeof devices.$inferSelect;

export const desktopAuthCodes = pgTable(
  "desktop_auth_codes",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull(),
    state: text("state").notNull(),
    sessionToken: text("session_token").notNull(),
    userId: text("user_id").notNull(),
    redirectUri: text("redirect_uri").notNull(),
    email: text("email").notNull(),
    createdIp: text("created_ip"),
    expiresAt: timestamptz("expires_at").notNull(),
    usedAt: timestamptz("used_at"),
    createdAt: timestamptz("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("desktop_auth_codes_code_idx").on(table.code),
    index("desktop_auth_codes_expires_at_idx").on(table.expiresAt),
    index("desktop_auth_codes_state_idx").on(table.state),
  ],
);

export const desktopAuthEvents = pgTable(
  "desktop_auth_events",
  {
    id: text("id").primaryKey(),
    eventType: text("event_type").notNull(),
    outcome: text("outcome").notNull(),
    userId: text("user_id"),
    redirectUri: text("redirect_uri"),
    clientIp: text("client_ip"),
    reason: text("reason"),
    createdAt: timestamptz("created_at").notNull(),
  },
  (table) => [
    index("desktop_auth_events_event_type_idx").on(table.eventType),
    index("desktop_auth_events_client_ip_created_at_idx").on(
      table.clientIp,
      table.createdAt,
    ),
    index("desktop_auth_events_created_at_idx").on(table.createdAt),
  ],
);

export const userProfiles = pgTable("user_profiles", {
  userId: text("user_id").primaryKey(),
  onboardingCompleted: boolean("onboarding_completed")
    .notNull()
    .default(false),
  updatedAt: timestamptz("updated_at").notNull(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    userId: text("user_id").primaryKey(),
    plan: text("plan").notNull().default("free"),
    status: text("status").notNull().default("active"),
    revenuecatCustomerId: text("revenuecat_customer_id"),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    stripeStatus: text("stripe_status"),
    stripeCurrentPeriodEnd: timestamptz("stripe_current_period_end"),
    stripeIsLaunchPricing: boolean("stripe_is_launch_pricing")
      .notNull()
      .default(false),
    appleOriginalTransactionId: text("apple_original_transaction_id"),
    appleProductId: text("apple_product_id"),
    appleExpiresAt: timestamptz("apple_expires_at"),
    appleStatus: text("apple_status"),
    polarCustomerId: text("polar_customer_id"),
    polarSubscriptionId: text("polar_subscription_id"),
    polarStatus: text("polar_status"),
    polarCurrentPeriodEnd: timestamptz("polar_current_period_end"),
    polarProductId: text("polar_product_id"),
    polarIsLaunchPricing: boolean("polar_is_launch_pricing")
      .notNull()
      .default(false),
    isLaunchPricing: boolean("is_launch_pricing").notNull().default(false),
    currentPeriodEnd: timestamptz("current_period_end"),
    storageLimitBytes: integer("storage_limit_bytes")
      .notNull()
      .default(52_428_800),
    deviceLimit: integer("device_limit").notNull().default(1),
    updatedAt: timestamptz("updated_at").notNull(),
  },
  (table) => [
    index("subscriptions_stripe_customer_id_idx").on(table.stripeCustomerId),
    index("subscriptions_polar_customer_id_idx").on(table.polarCustomerId),
    uniqueIndex("subscriptions_apple_original_transaction_id_idx").on(
      table.appleOriginalTransactionId,
    ),
  ],
);

export {
  authAccount,
  authPasskey,
  authSession,
  authUser,
  authVerification,
} from "@/lib/db/schema-auth";

export const billingEvents = pgTable(
  "billing_events",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    providerEventId: text("provider_event_id").notNull(),
    userId: text("user_id"),
    eventType: text("event_type").notNull(),
    outcome: text("outcome").notNull(),
    receivedAt: timestamptz("received_at").notNull(),
    processedAt: timestamptz("processed_at"),
  },
  (table) => [
    uniqueIndex("billing_events_provider_event_idx").on(
      table.provider,
      table.providerEventId,
    ),
    index("billing_events_user_id_idx").on(table.userId),
  ],
);

export type SubscriptionRow = typeof subscriptions.$inferSelect;
export type BillingEventRow = typeof billingEvents.$inferSelect;
export type UserProfileRow = typeof userProfiles.$inferSelect;
