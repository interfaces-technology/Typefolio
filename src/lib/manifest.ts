import { createHash } from "crypto";

import { getLibraryById } from "@/lib/storage";
import type { FontFile } from "@/lib/types";

export interface FontManifestEntry {
  id: string;
  originalName: string;
  sha256: string;
  size: number;
  extension: FontFile["extension"];
  uploadedAt: string;
}

export interface LibraryManifest {
  libraryId: string;
  updatedAt: string;
  etag: string;
  fonts: FontManifestEntry[];
}

function computeManifestEtag(fonts: FontManifestEntry[]): string {
  const payload = fonts
    .map((font) => `${font.id}:${font.sha256}`)
    .sort()
    .join("|");
  return createHash("sha256").update(payload).digest("hex");
}

export async function getLibraryManifest(
  libraryId: string,
): Promise<LibraryManifest | null> {
  const library = await getLibraryById(libraryId);
  if (!library) {
    return null;
  }

  const fonts: FontManifestEntry[] = library.fonts.map((font) => ({
    id: font.id,
    originalName: font.originalName,
    sha256: font.sha256,
    size: font.size,
    extension: font.extension,
    uploadedAt: font.uploadedAt,
  }));

  return {
    libraryId: library.id,
    updatedAt: library.updatedAt,
    etag: computeManifestEtag(fonts),
    fonts,
  };
}
