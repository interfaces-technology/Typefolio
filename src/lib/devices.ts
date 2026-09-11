import { nanoid } from "nanoid";

import { getLibraryById, writeLibrarySnapshot } from "@/lib/storage";
import type { Device, DevicePlatform } from "@/lib/types";

export interface RegisterDeviceInput {
  name: string;
  platform: DevicePlatform;
}

export interface UpdateDeviceInput {
  lastSyncAt?: string;
  installedFontIds?: string[];
}

export async function registerDevice(
  libraryId: string,
  input: RegisterDeviceInput,
): Promise<{ device: Device } | null> {
  const library = await getLibraryById(libraryId);
  if (!library) {
    return null;
  }

  const now = new Date().toISOString();
  const existing = library.devices?.find(
    (device) => device.name === input.name && device.platform === input.platform,
  );

  if (existing) {
    existing.lastSeenAt = now;
    library.updatedAt = now;
    await writeLibrarySnapshot(library);
    return { device: existing };
  }

  const device: Device = {
    id: nanoid(12),
    name: input.name.trim(),
    platform: input.platform,
    registeredAt: now,
    lastSeenAt: now,
    installedFontIds: [],
  };

  library.devices = [...(library.devices ?? []), device];
  library.updatedAt = now;
  await writeLibrarySnapshot(library);

  return { device };
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

  const device = library.devices?.find((item) => item.id === deviceId);
  if (!device) {
    return null;
  }

  const now = new Date().toISOString();
  device.lastSeenAt = now;

  if (input.lastSyncAt) {
    device.lastSyncAt = input.lastSyncAt;
  }

  if (input.installedFontIds) {
    device.installedFontIds = input.installedFontIds;
  }

  library.updatedAt = now;
  await writeLibrarySnapshot(library);

  return { device };
}
