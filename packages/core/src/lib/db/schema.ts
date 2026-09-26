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

import type { VariableAxis } from "@typefolio/core/types";

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

export const fontFamilies = pgTable(
  "font_families",
  {
    id: text("id").primaryKey(),
    libraryId: text("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    foundry: text("foundry"),
    version: text("version"),
    classification: text("classification"),
    mood: jsonb("mood").$type<string[]>().notNull().default([]),
    license: text("license"),
    source: text("source"),
    languages: jsonb("languages").$type<string[]>().notNull().default([]),
    glyphCount: integer("glyph_count"),
    favoritedAt: timestamptz("favorited_at"),
    editedFields: jsonb("edited_fields").$type<string[]>().notNull().default([]),
    createdAt: timestamptz("created_at").notNull(),
    updatedAt: timestamptz("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("font_families_library_slug_idx").on(table.libraryId, table.slug),
    index("font_families_library_id_idx").on(table.libraryId),
    index("font_families_library_name_idx").on(table.libraryId, table.name),
  ],
);

export const fonts = pgTable(
  "fonts",
  {
    id: text("id").primaryKey(),
    libraryId: text("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    familyId: text("family_id").references(() => fontFamilies.id, {
      onDelete: "set null",
    }),
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
    index("fonts_family_id_idx").on(table.familyId),
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

export const collections = pgTable(
  "collections",
  {
    id: text("id").primaryKey(),
    libraryId: text("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: timestamptz("created_at").notNull(),
    updatedAt: timestamptz("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("collections_library_slug_idx").on(table.libraryId, table.slug),
    index("collections_library_id_idx").on(table.libraryId),
  ],
);

export const collectionItems = pgTable(
  "collection_items",
  {
    id: text("id").primaryKey(),
    collectionId: text("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull(),
    itemId: text("item_id"),
    noteBody: text("note_body"),
    position: integer("position").notNull().default(0),
  },
  (table) => [
    index("collection_items_collection_id_idx").on(table.collectionId),
  ],
);

export const references = pgTable(
  "references",
  {
    id: text("id").primaryKey(),
    libraryId: text("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    category: text("category"),
    year: integer("year"),
    description: text("description"),
    imageUrl: text("image_url").notNull(),
    imagePathname: text("image_pathname").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    createdAt: timestamptz("created_at").notNull(),
    updatedAt: timestamptz("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("references_library_slug_idx").on(table.libraryId, table.slug),
    index("references_library_id_idx").on(table.libraryId),
  ],
);

export const referenceFonts = pgTable(
  "reference_fonts",
  {
    id: text("id").primaryKey(),
    referenceId: text("reference_id")
      .notNull()
      .references(() => references.id, { onDelete: "cascade" }),
    familyId: text("family_id")
      .notNull()
      .references(() => fontFamilies.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("related"),
  },
  (table) => [
    uniqueIndex("reference_fonts_pair_idx").on(table.referenceId, table.familyId),
    index("reference_fonts_family_id_idx").on(table.familyId),
  ],
);

export const favorites = pgTable(
  "favorites",
  {
    id: text("id").primaryKey(),
    libraryId: text("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull(),
    itemId: text("item_id").notNull(),
    createdAt: timestamptz("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("favorites_library_item_idx").on(
      table.libraryId,
      table.itemType,
      table.itemId,
    ),
    index("favorites_library_id_idx").on(table.libraryId),
  ],
);

export const activityEvents = pgTable(
  "activity_events",
  {
    id: text("id").primaryKey(),
    libraryId: text("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    occurredAt: timestamptz("occurred_at").notNull(),
    action: text("action").notNull(),
    itemName: text("item_name").notNull(),
    deviceId: text("device_id"),
  },
  (table) => [index("activity_events_library_occurred_idx").on(table.libraryId, table.occurredAt)],
);

export const shareLinks = pgTable(
  "share_links",
  {
    id: text("id").primaryKey(),
    libraryId: text("library_id")
      .notNull()
      .references(() => libraries.id, { onDelete: "cascade" }),
    resourceType: text("resource_type").notNull(),
    resourceId: text("resource_id").notNull(),
    token: text("token").notNull(),
    visibility: text("visibility").notNull().default("link"),
    createdAt: timestamptz("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("share_links_token_idx").on(table.token),
    index("share_links_library_id_idx").on(table.libraryId),
  ],
);

export type LibraryRow = typeof libraries.$inferSelect;
export type FontFamilyRow = typeof fontFamilies.$inferSelect;
export type FontRow = typeof fonts.$inferSelect;
export type DeviceRow = typeof devices.$inferSelect;
export type CollectionRow = typeof collections.$inferSelect;
export type CollectionItemRow = typeof collectionItems.$inferSelect;
export type ReferenceRow = typeof references.$inferSelect;
export type FavoriteRow = typeof favorites.$inferSelect;
export type ActivityEventRow = typeof activityEvents.$inferSelect;
export type ShareLinkRow = typeof shareLinks.$inferSelect;

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
} from "@typefolio/core/db/schema-auth";

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
