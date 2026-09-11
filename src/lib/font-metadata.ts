import * as fontkit from "fontkit";

import { getFontExtension } from "@/lib/font-validation";
import type { FontMetadata } from "@/lib/types";

const UNKNOWN_FAMILY = "Unknown";

const STYLE_TOKENS = [
  "thin",
  "extralight",
  "ultralight",
  "light",
  "regular",
  "book",
  "medium",
  "semibold",
  "demibold",
  "bold",
  "extrabold",
  "ultrabold",
  "black",
  "heavy",
  "italic",
  "oblique",
] as const;

const WEIGHT_FROM_TOKEN: Record<string, number> = {
  thin: 100,
  extralight: 200,
  ultralight: 200,
  light: 300,
  regular: 400,
  book: 400,
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700,
  extrabold: 800,
  ultrabold: 800,
  black: 900,
  heavy: 900,
};

function normalizeName(value: string | undefined | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function buildStyleName(
  subfamilyName: string | undefined,
  italic: boolean,
): string | undefined {
  const base = normalizeName(subfamilyName);
  if (base) {
    if (italic && !/italic|oblique/i.test(base)) {
      return `${base} Italic`;
    }
    return base;
  }

  return italic ? "Italic" : undefined;
}

function extractFromFontkit(buffer: Buffer): FontMetadata | null {
  try {
    const font = fontkit.create(buffer);
    const familyName =
      normalizeName(font.familyName) ??
      normalizeName(font.name?.records?.preferredFamily) ??
      normalizeName(font.name?.records?.fontFamily);

    if (!familyName) {
      return null;
    }

    const subfamilyName =
      normalizeName(font.subfamilyName) ??
      normalizeName(font.name?.records?.preferredSubfamily) ??
      normalizeName(font.name?.records?.fontSubfamily);

    const styleName = buildStyleName(subfamilyName, font.italic === true);
    const weight =
      typeof font.weight === "number" && font.weight > 0
        ? font.weight
        : undefined;
    const postscriptName = normalizeName(font.postscriptName);

    return {
      familyName,
      styleName,
      weight,
      postscriptName,
    };
  } catch {
    return null;
  }
}

function titleCaseToken(token: string): string {
  if (token.length === 0) {
    return token;
  }
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

const STYLE_COMPOUNDS: Record<string, string[]> = {
  bolditalic: ["bold", "italic"],
  boldoblique: ["bold", "oblique"],
  semibolditalic: ["semibold", "italic"],
  mediumitalic: ["medium", "italic"],
  lightitalic: ["light", "italic"],
};

function expandToken(token: string): string[] {
  const camelSplit = token
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");

  return camelSplit.split(/\s+/).filter(Boolean);
}

function splitStyleCompounds(token: string): string[] {
  const lower = token.toLowerCase();
  const compound = STYLE_COMPOUNDS[lower];
  if (compound) {
    return compound;
  }

  for (const [combined, parts] of Object.entries(STYLE_COMPOUNDS)) {
    if (lower.endsWith(combined) && lower.length > combined.length) {
      const prefix = lower.slice(0, -combined.length);
      return prefix ? [prefix, ...parts] : parts;
    }
  }

  return [token];
}

function parseFilenameMetadata(filename: string): FontMetadata {
  const extension = getFontExtension(filename);
  const baseName = extension
    ? filename.slice(0, -extension.length)
    : filename;

  const normalized = baseName.replace(/[_]+/g, " ").trim();
  if (!normalized) {
    return { familyName: UNKNOWN_FAMILY };
  }

  const separators = /[-\s]+/;
  const rawTokens = normalized.split(separators).filter(Boolean);
  const tokens = rawTokens.flatMap((token) =>
    expandToken(token).flatMap(splitStyleCompounds),
  );

  if (tokens.length === 0) {
    return { familyName: UNKNOWN_FAMILY };
  }

  const styleTokens: string[] = [];
  const familyTokens: string[] = [];

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (STYLE_TOKENS.includes(lower as (typeof STYLE_TOKENS)[number])) {
      styleTokens.push(lower);
    } else {
      familyTokens.push(token);
    }
  }

  const familyName =
    familyTokens.length > 0
      ? familyTokens.map(titleCaseToken).join(" ")
      : titleCaseToken(tokens[0]);

  let styleName: string | undefined;
  let weight: number | undefined;

  if (styleTokens.length > 0) {
    styleName = styleTokens.map(titleCaseToken).join(" ");
    for (const token of styleTokens) {
      const mapped = WEIGHT_FROM_TOKEN[token];
      if (mapped) {
        weight = mapped;
        break;
      }
    }
  }

  return {
    familyName,
    styleName,
    weight,
  };
}

export function extractFontMetadata(
  buffer: Buffer,
  fallbackFilename: string,
): FontMetadata {
  const fromFont = extractFromFontkit(buffer);
  if (fromFont) {
    return fromFont;
  }

  const fromFilename = parseFilenameMetadata(fallbackFilename);
  return {
    familyName: fromFilename.familyName || UNKNOWN_FAMILY,
    styleName: fromFilename.styleName,
    weight: fromFilename.weight,
  };
}
