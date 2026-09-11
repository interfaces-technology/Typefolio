import type {
  FontFamilyGroup,
  FontFamilySort,
  FontFile,
  SortOrder,
} from "@/lib/types";

const UNKNOWN_FAMILY = "Unknown";

export interface GroupFontsOptions {
  sortBy?: FontFamilySort;
  order?: SortOrder;
}

export interface FamilyQueryParams {
  sort: FontFamilySort;
  order: SortOrder;
}

function resolveFamilyName(font: FontFile): string {
  const name = font.familyName?.trim();
  return name ? name : UNKNOWN_FAMILY;
}

export function compareFontStyles(a: FontFile, b: FontFile): number {
  const weightA = a.weight ?? Number.MAX_SAFE_INTEGER;
  const weightB = b.weight ?? Number.MAX_SAFE_INTEGER;
  if (weightA !== weightB) {
    return weightA - weightB;
  }

  const styleA = a.styleName ?? a.originalName;
  const styleB = b.styleName ?? b.originalName;
  const styleCompare = styleA.localeCompare(styleB, undefined, {
    sensitivity: "base",
  });
  if (styleCompare !== 0) {
    return styleCompare;
  }

  return a.originalName.localeCompare(b.originalName, undefined, {
    sensitivity: "base",
  });
}

function compareFamiliesByName(
  a: FontFamilyGroup,
  b: FontFamilyGroup,
  order: SortOrder,
): number {
  const comparison = a.familyName.localeCompare(b.familyName, undefined, {
    sensitivity: "base",
  });
  return order === "desc" ? -comparison : comparison;
}

function compareFamiliesByUploadedAt(
  a: FontFamilyGroup,
  b: FontFamilyGroup,
  order: SortOrder,
): number {
  const latestA = a.fonts.reduce((latest, font) =>
    font.uploadedAt > latest ? font.uploadedAt : latest,
  a.fonts[0]?.uploadedAt ?? "");
  const latestB = b.fonts.reduce((latest, font) =>
    font.uploadedAt > latest ? font.uploadedAt : latest,
  b.fonts[0]?.uploadedAt ?? "");

  const comparison = latestA.localeCompare(latestB);
  return order === "desc" ? -comparison : comparison;
}

export function groupFontsByFamily(
  fonts: FontFile[],
  options: GroupFontsOptions = {},
): FontFamilyGroup[] {
  const sortBy = options.sortBy ?? "family";
  const order = options.order ?? "asc";

  const grouped = new Map<string, FontFile[]>();

  for (const font of fonts) {
    const familyName = resolveFamilyName(font);
    const existing = grouped.get(familyName);
    if (existing) {
      existing.push(font);
    } else {
      grouped.set(familyName, [font]);
    }
  }

  const families: FontFamilyGroup[] = Array.from(grouped.entries()).map(
    ([familyName, familyFonts]) => ({
      familyName,
      styleCount: familyFonts.length,
      fonts: [...familyFonts].sort(compareFontStyles),
    }),
  );

  families.sort((a, b) => {
    if (sortBy === "uploadedAt") {
      return compareFamiliesByUploadedAt(a, b, order);
    }
    return compareFamiliesByName(a, b, order);
  });

  return families;
}

export function parseFamilyQueryParams(
  searchParams: URLSearchParams,
): FamilyQueryParams {
  const sortParam = searchParams.get("sort");
  const orderParam = searchParams.get("order");

  const sort: FontFamilySort =
    sortParam === "uploadedAt" ? "uploadedAt" : "family";
  const order: SortOrder = orderParam === "desc" ? "desc" : "asc";

  return { sort, order };
}
