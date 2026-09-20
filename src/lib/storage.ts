import { createHash } from "crypto";
import { del, get, put } from "@vercel/blob";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { getDb } from "@/lib/db";
import { devices, fonts, libraries } from "@/lib/db/schema";
import { groupFontsByFamily } from "@/lib/font-families";
import { extractFontMetadata } from "@/lib/font-metadata";
import { getFontExtension, isAllowedFontFile } from "@/lib/font-validation";
import { generateSyncCode } from "@/lib/sync-code";
import type {
  CreateLibraryInput,
  Device,
  DevicePlatform,
  FontExtension,
  FontFamilyGroup,
  FontFamilySort,
  FontFile,
  Library,
  LibrarySummary,
  SortOrder,
} from "@/lib/types";

function sha256Hex(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function fontPathname(libraryId: string, storedName: string): string {
  return `libraries/${libraryId}/fonts/${storedName}`;
}

function toFontFile(row: typeof fonts.$inferSelect): FontFile {
  return {
    id: row.id,
    originalName: row.originalName,
    storedName: row.storedName,
    sha256: row.sha256,
    size: row.size,
    extension: row.extension as FontExtension,
    familyName: row.familyName ?? "Unknown",
    styleName: row.styleName ?? undefined,
    weight: row.weight ?? undefined,
    italic: row.italic ?? undefined,
    postscriptName: row.postscriptName ?? undefined,
    variableAxes: row.variableAxes ?? undefined,
    uploadedAt: row.uploadedAt,
  };
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

function toLibrary(
  library: typeof libraries.$inferSelect,
  fontRows: Array<typeof fonts.$inferSelect>,
  deviceRows: Array<typeof devices.$inferSelect>,
): Library {
  return {
    id: library.id,
    ownerUserId: library.ownerUserId,
    name: library.name,
    description: library.description ?? undefined,
    syncCode: library.syncCode,
    fonts: fontRows.map(toFontFile),
    devices: deviceRows.map(toDevice),
    createdAt: library.createdAt,
    updatedAt: library.updatedAt,
  };
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

async function loadLibrary(libraryId: string): Promise<Library | null> {
  const db = getDb();
  const [library] = await db
    .select()
    .from(libraries)
    .where(eq(libraries.id, libraryId))
    .limit(1);

  if (!library) {
    return null;
  }

  const [fontRows, deviceRows] = await Promise.all([
    db
      .select()
      .from(fonts)
      .where(eq(fonts.libraryId, libraryId))
      .orderBy(desc(fonts.uploadedAt)),
    db.select().from(devices).where(eq(devices.libraryId, libraryId)),
  ]);

  return toLibrary(library, fontRows, deviceRows);
}

export async function createLibrary(
  ownerUserId: string,
  input: CreateLibraryInput,
): Promise<Library> {
  const db = getDb();
  const now = new Date().toISOString();
  const library = {
    id: nanoid(12),
    ownerUserId,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    syncCode: generateSyncCode(),
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(libraries).values(library);

  return {
    ...library,
    description: library.description ?? undefined,
    fonts: [],
    devices: [],
  };
}

export async function getOrCreateUserLibrary(
  ownerUserId: string,
): Promise<Library> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(libraries)
    .where(eq(libraries.ownerUserId, ownerUserId))
    .orderBy(desc(libraries.updatedAt))
    .limit(1);

  if (row) {
    const existing = await loadLibrary(row.id);
    if (existing) {
      return existing;
    }
  }

  return createLibrary(ownerUserId, { name: "My fonts" });
}

export async function listLibrariesForUser(
  ownerUserId: string,
): Promise<LibrarySummary[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(libraries)
    .where(eq(libraries.ownerUserId, ownerUserId))
    .orderBy(desc(libraries.updatedAt));

  const summaries: LibrarySummary[] = [];
  for (const row of rows) {
    const fontRows = await db
      .select({ id: fonts.id })
      .from(fonts)
      .where(eq(fonts.libraryId, row.id));
    summaries.push({
      id: row.id,
      name: row.name,
      description: row.description ?? undefined,
      syncCode: row.syncCode,
      fontCount: fontRows.length,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  return summaries;
}

export async function getLibraryById(id: string): Promise<Library | null> {
  return loadLibrary(id);
}

export async function getLibraryBySyncCode(
  syncCode: string,
): Promise<Library | null> {
  const db = getDb();
  const [library] = await db
    .select()
    .from(libraries)
    .where(eq(libraries.syncCode, syncCode))
    .limit(1);

  if (!library) {
    return null;
  }

  return loadLibrary(library.id);
}

export async function updateLibrary(
  libraryId: string,
  input: { name?: string; description?: string | null },
): Promise<Library | null> {
  const existing = await loadLibrary(libraryId);
  if (!existing) {
    return null;
  }

  const db = getDb();
  const now = new Date().toISOString();
  await db
    .update(libraries)
    .set({
      name: input.name?.trim() ?? existing.name,
      description:
        input.description === undefined
          ? (existing.description ?? null)
          : input.description?.trim() || null,
      updatedAt: now,
    })
    .where(eq(libraries.id, libraryId));

  return loadLibrary(libraryId);
}

export async function deleteLibrary(libraryId: string): Promise<boolean> {
  const existing = await loadLibrary(libraryId);
  if (!existing) {
    return false;
  }

  const db = getDb();
  const fontRows = await db
    .select({ blobUrl: fonts.blobUrl, blobPathname: fonts.blobPathname })
    .from(fonts)
    .where(eq(fonts.libraryId, libraryId));

  const blobTargets = fontRows.flatMap((font) => [
    font.blobUrl,
    font.blobPathname,
  ]);
  if (blobTargets.length > 0) {
    await del(blobTargets);
  }

  await db.delete(libraries).where(eq(libraries.id, libraryId));
  return true;
}

export async function addFontsToLibrary(
  libraryId: string,
  files: File[],
): Promise<{ library: Library; added: FontFile[]; rejected: string[] }> {
  const library = await loadLibrary(libraryId);
  if (!library) {
    throw new Error("Library not found");
  }

  const db = getDb();
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
    const pathname = fontPathname(libraryId, storedName);
    const buffer = Buffer.from(await file.arrayBuffer());
    const metadata = extractFontMetadata(buffer, file.name);

    const blob = await put(pathname, new Uint8Array(buffer), {
      access: "private",
      addRandomSuffix: false,
      contentType: "application/octet-stream",
    });

    const fontRow = {
      id: fontId,
      libraryId,
      originalName: file.name,
      storedName,
      blobUrl: blob.url,
      blobPathname: blob.pathname,
      sha256: sha256Hex(buffer),
      size: file.size,
      extension,
      familyName: metadata.familyName,
      styleName: metadata.styleName ?? null,
      weight: metadata.weight ?? null,
      italic: metadata.italic ?? null,
      postscriptName: metadata.postscriptName ?? null,
      variableAxes: metadata.variableAxes ?? null,
      uploadedAt: new Date().toISOString(),
    };

    await db.insert(fonts).values(fontRow);
    added.push(toFontFile(fontRow));
  }

  await db
    .update(libraries)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(libraries.id, libraryId));

  const updated = await loadLibrary(libraryId);
  if (!updated) {
    throw new Error("Library not found");
  }

  return { library: updated, added, rejected };
}

export async function deleteFont(
  libraryId: string,
  fontId: string,
): Promise<boolean> {
  const db = getDb();
  const [font] = await db
    .select()
    .from(fonts)
    .where(and(eq(fonts.libraryId, libraryId), eq(fonts.id, fontId)))
    .limit(1);

  if (!font) {
    return false;
  }

  await del([font.blobUrl, font.blobPathname]);
  await db
    .delete(fonts)
    .where(and(eq(fonts.libraryId, libraryId), eq(fonts.id, fontId)));
  await db
    .update(libraries)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(libraries.id, libraryId));

  return true;
}

async function bufferFromBlob(
  urlOrPathname: string,
): Promise<Buffer | null> {
  const result = await get(urlOrPathname, { access: "private" });
  if (!result || result.statusCode !== 200 || !result.stream) {
    return null;
  }

  const arrayBuffer = await new Response(result.stream).arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function getFontBuffer(
  libraryId: string,
  fontId: string,
): Promise<{ buffer: Buffer; font: FontFile } | null> {
  const db = getDb();
  const [font] = await db
    .select()
    .from(fonts)
    .where(and(eq(fonts.libraryId, libraryId), eq(fonts.id, fontId)))
    .limit(1);

  if (!font) {
    return null;
  }

  const buffer =
    (await bufferFromBlob(font.blobPathname)) ??
    (await bufferFromBlob(font.blobUrl));

  if (!buffer) {
    return null;
  }

  return { buffer, font: toFontFile(font) };
}

export async function getAllFontBuffers(
  libraryId: string,
): Promise<Array<{ buffer: Buffer; font: FontFile }>> {
  const db = getDb();
  const fontRows = await db
    .select()
    .from(fonts)
    .where(eq(fonts.libraryId, libraryId));

  const results: Array<{ buffer: Buffer; font: FontFile }> = [];

  for (const font of fontRows) {
    const buffer =
      (await bufferFromBlob(font.blobPathname)) ??
      (await bufferFromBlob(font.blobUrl));
    if (buffer) {
      results.push({ buffer, font: toFontFile(font) });
    }
  }

  return results;
}

export async function touchLibrary(libraryId: string): Promise<void> {
  const db = getDb();
  await db
    .update(libraries)
    .set({ updatedAt: new Date().toISOString() })
    .where(eq(libraries.id, libraryId));
}

export interface LibraryFontFamiliesResult {
  libraryId: string;
  sort: FontFamilySort;
  order: SortOrder;
  familyCount: number;
  fontCount: number;
  families: FontFamilyGroup[];
}

export async function getLibraryFontFamilies(
  libraryId: string,
  options: { sortBy?: FontFamilySort; order?: SortOrder } = {},
): Promise<LibraryFontFamiliesResult | null> {
  const library = await loadLibrary(libraryId);
  if (!library) {
    return null;
  }

  const sort = options.sortBy ?? "family";
  const order = options.order ?? "asc";
  const families = groupFontsByFamily(library.fonts, { sortBy: sort, order });

  return {
    libraryId: library.id,
    sort,
    order,
    familyCount: families.length,
    fontCount: library.fonts.length,
    families,
  };
}

export interface ReindexFontMetadataResult {
  updated: number;
  skipped: number;
  failed: string[];
}

export async function reindexLibraryFontMetadata(
  libraryId: string,
  options: { force?: boolean } = {},
): Promise<ReindexFontMetadataResult | null> {
  const library = await loadLibrary(libraryId);
  if (!library) {
    return null;
  }

  const db = getDb();
  const result: ReindexFontMetadataResult = {
    updated: 0,
    skipped: 0,
    failed: [],
  };

  const fontRows = await db
    .select()
    .from(fonts)
    .where(eq(fonts.libraryId, libraryId));

  for (const fontRow of fontRows) {
    const needsUpdate = options.force === true || fontRow.familyName === null;
    if (!needsUpdate) {
      result.skipped += 1;
      continue;
    }

    const buffer =
      (await bufferFromBlob(fontRow.blobPathname)) ??
      (await bufferFromBlob(fontRow.blobUrl));

    if (!buffer) {
      result.failed.push(`${fontRow.originalName} (blob unavailable)`);
      continue;
    }

    const metadata = extractFontMetadata(buffer, fontRow.originalName);

    await db
      .update(fonts)
      .set({
        familyName: metadata.familyName,
        styleName: metadata.styleName ?? null,
        weight: metadata.weight ?? null,
        italic: metadata.italic ?? null,
        postscriptName: metadata.postscriptName ?? null,
        variableAxes: metadata.variableAxes ?? null,
      })
      .where(and(eq(fonts.libraryId, libraryId), eq(fonts.id, fontRow.id)));

    result.updated += 1;
  }

  if (result.updated > 0) {
    await db
      .update(libraries)
      .set({ updatedAt: new Date().toISOString() })
      .where(eq(libraries.id, libraryId));
  }

  return result;
}
