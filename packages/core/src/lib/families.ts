import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

import { compareFontStyles } from "@typefolio/core/font-families";
import { getDb } from "@typefolio/core/db";
import { fontFamilies, fonts } from "@typefolio/core/db/schema";
import { nextSlug, slugify } from "@typefolio/core/slug";
import type {
  FontClassification,
  FontFamilyGroup,
  FontFile,
  VariableAxis,
} from "@typefolio/core/types";

const CLASSIFICATIONS: FontClassification[] = [
  "serif",
  "sans",
  "mono",
  "display",
  "other",
];

export function isClassification(value: string): value is FontClassification {
  return CLASSIFICATIONS.includes(value as FontClassification);
}

function guessClassification(name: string): FontClassification | undefined {
  const lower = name.toLowerCase();
  if (/\bmono|code|console\b/.test(lower)) {
    return "mono";
  }
  if (/\bserif|times|garamond|didot\b/.test(lower)) {
    return "serif";
  }
  if (/\bsans|grotesk|gothic\b/.test(lower)) {
    return "sans";
  }
  if (/\bdisplay|script|poster\b/.test(lower)) {
    return "display";
  }
  return undefined;
}

function toFontFile(row: typeof fonts.$inferSelect): FontFile {
  return {
    id: row.id,
    familyId: row.familyId ?? undefined,
    originalName: row.originalName,
    storedName: row.storedName,
    sha256: row.sha256,
    size: row.size,
    extension: row.extension as FontFile["extension"],
    familyName: row.familyName ?? "Unknown",
    styleName: row.styleName ?? undefined,
    weight: row.weight ?? undefined,
    italic: row.italic ?? undefined,
    postscriptName: row.postscriptName ?? undefined,
    variableAxes: (row.variableAxes as VariableAxis[] | null) ?? undefined,
    uploadedAt: row.uploadedAt,
  };
}

function toFamily(
  row: typeof fontFamilies.$inferSelect,
  familyFonts: FontFile[],
): FontFamilyGroup {
  return {
    id: row.id,
    slug: row.slug,
    familyName: row.name,
    foundry: row.foundry ?? undefined,
    version: row.version ?? undefined,
    classification: row.classification
      ? (row.classification as FontClassification)
      : undefined,
    mood: row.mood,
    license: row.license ?? undefined,
    source: row.source ?? undefined,
    languages: row.languages,
    glyphCount: row.glyphCount ?? undefined,
    favoritedAt: row.favoritedAt ?? undefined,
    editedFields: row.editedFields,
    totalSize: familyFonts.reduce((sum, font) => sum + font.size, 0),
    styleCount: familyFonts.length,
    fonts: [...familyFonts].sort(compareFontStyles),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function ensureFamilyForName(
  libraryId: string,
  familyName: string,
): Promise<{ id: string; slug: string }> {
  const db = getDb();
  const name = familyName.trim() || "Unknown";
  const [existing] = await db
    .select()
    .from(fontFamilies)
    .where(and(eq(fontFamilies.libraryId, libraryId), eq(fontFamilies.name, name)))
    .limit(1);

  if (existing) {
    return { id: existing.id, slug: existing.slug };
  }

  const taken = new Set(
    (
      await db
        .select({ slug: fontFamilies.slug })
        .from(fontFamilies)
        .where(eq(fontFamilies.libraryId, libraryId))
    ).map((row) => row.slug),
  );
  const now = new Date().toISOString();
  const row = {
    id: nanoid(12),
    libraryId,
    slug: nextSlug(slugify(name), taken),
    name,
    foundry: null,
    version: null,
    classification: guessClassification(name) ?? null,
    mood: [] as string[],
    license: null,
    source: null,
    languages: [] as string[],
    glyphCount: null,
    favoritedAt: null,
    editedFields: [] as string[],
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(fontFamilies).values(row);
  return { id: row.id, slug: row.slug };
}

export interface FamilyListQuery {
  q?: string;
  classification?: FontClassification;
  mood?: string;
  sort?: "newest" | "updated" | "name-asc" | "name-desc";
}

export async function listFamilies(
  libraryId: string,
  query: FamilyListQuery = {},
): Promise<FontFamilyGroup[]> {
  const db = getDb();
  const conditions = [eq(fontFamilies.libraryId, libraryId)];

  if (query.q?.trim()) {
    const term = `%${query.q.trim()}%`;
    conditions.push(
      or(
        ilike(fontFamilies.name, term),
        ilike(fontFamilies.foundry, term),
        ilike(fontFamilies.source, term),
      )!,
    );
  }
  if (query.classification) {
    conditions.push(eq(fontFamilies.classification, query.classification));
  }
  if (query.mood?.trim()) {
    conditions.push(
      sql`${fontFamilies.mood} @> ${JSON.stringify([query.mood.trim()])}::jsonb`,
    );
  }

  const order =
    query.sort === "name-asc"
      ? fontFamilies.name
      : query.sort === "name-desc"
        ? desc(fontFamilies.name)
        : query.sort === "updated"
          ? desc(fontFamilies.updatedAt)
          : desc(fontFamilies.createdAt);

  const rows = await db
    .select()
    .from(fontFamilies)
    .where(and(...conditions))
    .orderBy(order);

  if (rows.length === 0) {
    return [];
  }

  const fontRows = await db
    .select()
    .from(fonts)
    .where(
      inArray(
        fonts.familyId,
        rows.map((row) => row.id),
      ),
    );

  const fontsByFamily = new Map<string, FontFile[]>();
  for (const font of fontRows) {
    if (!font.familyId) {
      continue;
    }
    const list = fontsByFamily.get(font.familyId) ?? [];
    list.push(toFontFile(font));
    fontsByFamily.set(font.familyId, list);
  }

  return rows.map((row) => toFamily(row, fontsByFamily.get(row.id) ?? []));
}

export async function getFamilyBySlug(
  libraryId: string,
  slug: string,
): Promise<FontFamilyGroup | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(fontFamilies)
    .where(and(eq(fontFamilies.libraryId, libraryId), eq(fontFamilies.slug, slug)))
    .limit(1);

  if (!row) {
    return null;
  }

  const fontRows = await db
    .select()
    .from(fonts)
    .where(eq(fonts.familyId, row.id));

  return toFamily(row, fontRows.map(toFontFile));
}

export async function getFamilyById(
  libraryId: string,
  familyId: string,
): Promise<FontFamilyGroup | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(fontFamilies)
    .where(and(eq(fontFamilies.libraryId, libraryId), eq(fontFamilies.id, familyId)))
    .limit(1);
  if (!row) {
    return null;
  }
  const fontRows = await db.select().from(fonts).where(eq(fonts.familyId, row.id));
  return toFamily(row, fontRows.map(toFontFile));
}

export interface UpdateFamilyInput {
  foundry?: string | null;
  version?: string | null;
  classification?: FontClassification | null;
  mood?: string[];
  license?: string | null;
  source?: string | null;
  languages?: string[];
}

export async function updateFamily(
  libraryId: string,
  slug: string,
  input: UpdateFamilyInput,
): Promise<FontFamilyGroup | null> {
  const existing = await getFamilyBySlug(libraryId, slug);
  if (!existing?.id) {
    return null;
  }

  const db = getDb();
  const edited = new Set(existing.editedFields ?? []);
  const patch: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  const assign = (field: keyof UpdateFamilyInput, column: string) => {
    if (input[field] !== undefined) {
      patch[column] = input[field];
      edited.add(field);
    }
  };

  assign("foundry", "foundry");
  assign("version", "version");
  assign("classification", "classification");
  assign("mood", "mood");
  assign("license", "license");
  assign("source", "source");
  assign("languages", "languages");
  patch.editedFields = Array.from(edited);

  await db
    .update(fontFamilies)
    .set(patch)
    .where(eq(fontFamilies.id, existing.id));

  return getFamilyBySlug(libraryId, slug);
}

export async function toggleFamilyFavorite(
  libraryId: string,
  slug: string,
): Promise<FontFamilyGroup | null> {
  const existing = await getFamilyBySlug(libraryId, slug);
  if (!existing?.id) {
    return null;
  }

  const db = getDb();
  await db
    .update(fontFamilies)
    .set({
      favoritedAt: existing.favoritedAt ? null : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(fontFamilies.id, existing.id));

  return getFamilyBySlug(libraryId, slug);
}

export function familyInstallStateFromDevices(
  family: FontFamilyGroup,
  deviceRecords: Array<{ installedFontIds: string[] }>,
): "none" | "partial" | "installed" {
  const fontIds = new Set(family.fonts.map((font) => font.id));
  if (fontIds.size === 0 || deviceRecords.length === 0) {
    return "none";
  }

  const installed = new Set(
    deviceRecords.flatMap((device) => device.installedFontIds),
  );
  const hits = family.fonts.filter((font) => installed.has(font.id)).length;
  if (hits === 0) {
    return "none";
  }
  return hits === fontIds.size ? "installed" : "partial";
}

export async function backfillFamilies(libraryId: string): Promise<number> {
  const db = getDb();
  const orphanFonts = await db
    .select()
    .from(fonts)
    .where(eq(fonts.libraryId, libraryId));

  let created = 0;
  for (const font of orphanFonts) {
    if (font.familyId) {
      continue;
    }
    const family = await ensureFamilyForName(
      libraryId,
      font.familyName ?? "Unknown",
    );
    await db
      .update(fonts)
      .set({ familyId: family.id })
      .where(eq(fonts.id, font.id));
    created += 1;
  }
  return created;
}
