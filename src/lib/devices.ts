import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getDb } from "@/lib/db";
import { devices } from "@/lib/db/schema";
import { getLibraryById, touchLibrary } from "@/lib/storage";
import type { Device, DevicePlatform } from "@/lib/types";

export interface RegisterDeviceInput {
  name: string;
  platform: DevicePlatform;
}

export interface UpdateDeviceInput {
  lastSyncAt?: string;
  installedFontIds?: string[];
}

function toDevice(row: typeof devices.$inferSelect): Device {
  return {
    id: row.id,
    name: row.name,
    platform: row.platform as DevicePlatform,
    registeredAt: row.registeredAt,
    lastSeenAt: row.lastSeenAt,
    lastSyncAt: row.lastSyncAt ?? undefined,
    installedFontIds: row.installedFontIds,
  };
}

export async function registerDevice(
  libraryId: string,
  input: RegisterDeviceInput,
): Promise<{ device: Device } | null> {
  const library = await getLibraryById(libraryId);
  if (!library) {
    return null;
  }

  const db = getDb();
  const now = new Date().toISOString();
  const name = input.name.trim();

  const [existing] = await db
    .select()
    .from(devices)
    .where(
      and(
        eq(devices.libraryId, libraryId),
        eq(devices.name, name),
        eq(devices.platform, input.platform),
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(devices)
      .set({ lastSeenAt: now })
      .where(eq(devices.id, existing.id))
      .returning();
    await touchLibrary(libraryId);
    return { device: toDevice(updated ?? { ...existing, lastSeenAt: now }) };
  }

  const device = {
    id: nanoid(12),
    libraryId,
    name,
    platform: input.platform,
    registeredAt: now,
    lastSeenAt: now,
    lastSyncAt: null,
    installedFontIds: [] as string[],
  };

  await db.insert(devices).values(device);
  await touchLibrary(libraryId);

  return { device: toDevice(device) };
}

export async function updateDevice(
  libraryId: string,
  deviceId: string,
  input: UpdateDeviceInput,
): Promise<{ device: Device } | null> {
  const library = await getLibraryById(libraryId);
  if (!library) {
    return null;
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(devices)
    .where(and(eq(devices.libraryId, libraryId), eq(devices.id, deviceId)))
    .limit(1);

  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();
  const [updated] = await db
    .update(devices)
    .set({
      lastSeenAt: now,
      lastSyncAt: input.lastSyncAt ?? existing.lastSyncAt,
      installedFontIds: input.installedFontIds ?? existing.installedFontIds,
    })
    .where(eq(devices.id, deviceId))
    .returning();

  await touchLibrary(libraryId);

  return updated ? { device: toDevice(updated) } : null;
}

export async function listDevices(libraryId: string): Promise<Device[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(devices)
    .where(eq(devices.libraryId, libraryId));
  return rows.map(toDevice);
}
