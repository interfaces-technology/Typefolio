export const FONT_EXTENSIONS = [".ttf", ".otf", ".woff", ".woff2"] as const;

export type FontExtension = (typeof FONT_EXTENSIONS)[number];

export interface FontMetadata {
  familyName: string;
  styleName?: string;
  weight?: number;
  postscriptName?: string;
}

export interface FontFile extends FontMetadata {
  id: string;
  originalName: string;
  storedName: string;
  sha256: string;
  size: number;
  extension: FontExtension;
  uploadedAt: string;
}

export interface FontFamilyGroup {
  familyName: string;
  styleCount: number;
  fonts: FontFile[];
}

export type FontFamilySort = "family" | "uploadedAt";
export type SortOrder = "asc" | "desc";

export type DevicePlatform = "macos" | "windows" | "linux" | "ios";

export interface Device {
  id: string;
  name: string;
  platform: DevicePlatform;
  registeredAt: string;
  lastSeenAt: string;
  lastSyncAt?: string;
  installedFontIds: string[];
}

export interface Library {
  id: string;
  ownerUserId: string;
  name: string;
  description?: string;
  syncCode: string;
  fonts: FontFile[];
  devices?: Device[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateLibraryInput {
  name: string;
  description?: string;
}

export interface LibrarySummary {
  id: string;
  name: string;
  description?: string;
  syncCode: string;
  fontCount: number;
  createdAt: string;
  updatedAt: string;
}
