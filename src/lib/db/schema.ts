import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

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
    uploadedAt: timestamptz("uploaded_at").notNull(),
  },
  (table) => [index("fonts_library_id_idx").on(table.libraryId)],
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
