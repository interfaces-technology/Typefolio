import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";

import { getFontExtension, isAllowedFontFile } from "@/lib/font-validation";
import { generateSyncCode } from "@/lib/sync-code";
import type {
  CreateLibraryInput,
  FontFile,
  Library,
  LibrarySummary,
} from "@/lib/types";

const DATA_DIR =
  process.env.SYNCFONT_DATA_DIR ?? path.join(process.cwd(), ".data");

function librariesDir(): string {
  return path.join(DATA_DIR, "libraries");
}

function libraryDir(id: string): string {
  return path.join(librariesDir(), id);
}

function libraryMetaPath(id: string): string {
  return path.join(libraryDir(id), "metadata.json");
}

function fontsDir(id: string): string {
  return path.join(libraryDir(id), "fonts");
}

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(librariesDir(), { recursive: true });
}

async function readLibrary(id: string): Promise<Library | null> {
  try {
    const raw = await fs.readFile(libraryMetaPath(id), "utf-8");
    return JSON.parse(raw) as Library;
  } catch {
    return null;
  }
}

async function writeLibrary(library: Library): Promise<void> {
  await fs.mkdir(libraryDir(library.id), { recursive: true });
  await fs.mkdir(fontsDir(library.id), { recursive: true });
  await fs.writeFile(
    libraryMetaPath(library.id),
    JSON.stringify(library, null, 2),
    "utf-8",
  );
}

export async function writeLibrarySnapshot(library: Library): Promise<void> {
  await writeLibrary(library);
}

function sha256Hex(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

async function ensureFontHashes(library: Library): Promise<boolean> {
  let changed = false;

  for (const font of library.fonts) {
    if (font.sha256) {
      continue;
    }

    try {
      const buffer = await fs.readFile(
        getFontFilePath(library.id, font.storedName),
      );
      font.sha256 = sha256Hex(buffer);
      changed = true;
    } catch {
      // Skip missing files
    }
  }

  if (changed) {
    await writeLibrary(library);
  }

  return changed;
}

async function findLibraryBySyncCode(syncCode: string): Promise<Library | null> {
  await ensureDataDir();
  const entries = await fs.readdir(librariesDir(), { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const library = await readLibrary(entry.name);
    if (library?.syncCode === syncCode) {
      return library;
    }
  }

  return null;
}

export function toLibrarySummary(library: Library): LibrarySummary {
  return {
    id: library.id,
    name: library.name,
    description: library.description,
    syncCode: library.syncCode,
    fontCount: library.fonts.length,
    createdAt: library.createdAt,
    updatedAt: library.updatedAt,
  };
}

export async function createLibrary(
  input: CreateLibraryInput,
): Promise<Library> {
  await ensureDataDir();

  const now = new Date().toISOString();
  const library: Library = {
    id: nanoid(12),
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    syncCode: generateSyncCode(),
    fonts: [],
    createdAt: now,
    updatedAt: now,
  };

  await writeLibrary(library);
  return library;
}

export async function getLibraryById(id: string): Promise<Library | null> {
  await ensureDataDir();
  const library = await readLibrary(id);
  if (library) {
    await ensureFontHashes(library);
  }
  return library;
}

export async function getLibraryBySyncCode(
  syncCode: string,
): Promise<Library | null> {
  const library = await findLibraryBySyncCode(syncCode);
  if (!library) {
    return null;
  }
  return getLibraryById(library.id);
}

export async function addFontsToLibrary(
  libraryId: string,
  files: File[],
): Promise<{ library: Library; added: FontFile[]; rejected: string[] }> {
  const library = await getLibraryById(libraryId);
  if (!library) {
    throw new Error("Library not found");
  }

  const added: FontFile[] = [];
  const rejected: string[] = [];

  for (const file of files) {
    if (!isAllowedFontFile(file.name, file.type)) {
      rejected.push(`${file.name} (unsupported type)`);
      continue;
    }

    const extension = getFontExtension(file.name);
    if (!extension) {
      rejected.push(`${file.name} (invalid extension)`);
      continue;
    }

    const fontId = nanoid(10);
    const storedName = `${fontId}${extension}`;
    const fontPath = path.join(fontsDir(libraryId), storedName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fontPath, buffer);

    const fontFile: FontFile = {
      id: fontId,
      originalName: file.name,
      storedName,
      sha256: sha256Hex(buffer),
      size: file.size,
      extension,
      uploadedAt: new Date().toISOString(),
    };

    library.fonts.push(fontFile);
    added.push(fontFile);
  }

  library.updatedAt = new Date().toISOString();
  await writeLibrary(library);

  return { library, added, rejected };
}

export function getFontFilePath(
  libraryId: string,
  storedName: string,
): string {
  return path.join(fontsDir(libraryId), storedName);
}

export async function getFontBuffer(
  libraryId: string,
  fontId: string,
): Promise<{ buffer: Buffer; font: FontFile } | null> {
  const library = await getLibraryById(libraryId);
  if (!library) {
    return null;
  }

  const font = library.fonts.find((item) => item.id === fontId);
  if (!font) {
    return null;
  }

  try {
    const buffer = await fs.readFile(
      getFontFilePath(libraryId, font.storedName),
    );
    return { buffer, font };
  } catch {
    return null;
  }
}

export async function getAllFontBuffers(
  libraryId: string,
): Promise<Array<{ buffer: Buffer; font: FontFile }>> {
  const library = await getLibraryById(libraryId);
  if (!library) {
    return [];
  }

  const results: Array<{ buffer: Buffer; font: FontFile }> = [];

  for (const font of library.fonts) {
    try {
      const buffer = await fs.readFile(
        getFontFilePath(libraryId, font.storedName),
      );
      results.push({ buffer, font });
    } catch {
      // Skip missing files
    }
  }

  return results;
}
