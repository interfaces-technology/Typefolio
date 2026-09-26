import { createHash } from "crypto";

import { getLibraryById } from "@typefolio/core/storage";
import type { FontFile, VariableAxis } from "@typefolio/core/types";

export interface FontManifestEntry {
  id: string;
  originalName: string;
  sha256: string;
  size: number;
  extension: FontFile["extension"];
  familyName: string;
  styleName?: string;
  weight?: number;
  italic?: boolean;
  postscriptName?: string;
  variableAxes?: VariableAxis[];
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
    familyName: font.familyName,
    styleName: font.styleName,
    weight: font.weight,
    italic: font.italic,
    postscriptName: font.postscriptName,
    variableAxes: font.variableAxes,
    uploadedAt: font.uploadedAt,
  }));

  return {
    libraryId: library.id,
    updatedAt: library.updatedAt,
    etag: computeManifestEtag(fonts),
    fonts,
  };
}
