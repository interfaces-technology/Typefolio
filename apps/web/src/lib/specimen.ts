import type { CSSProperties } from "react";

import type { FontFile, VariableAxis } from "@/lib/types";

export function specimenFontName(font: { id: string }): string {
  return `tf-specimen-${font.id}`;
}

const AXIS_LABELS: Record<string, string> = {
  wght: "Weight",
  wdth: "Width",
  slnt: "Slant",
  ital: "Italic",
  opsz: "Optical size",
  GRAD: "Grade",
  XTRA: "X-width",
  YTSE: "Serif",
};

export function axisLabel(axis: VariableAxis): string {
  return axis.name || AXIS_LABELS[axis.tag] || axis.tag;
}

export function defaultAxisValues(font: FontFile): Record<string, number> {
  if (!font.variableAxes) {
    return {};
  }
  const values: Record<string, number> = {};
  for (const axis of font.variableAxes) {
    values[axis.tag] = axis.defaultValue;
  }
  return values;
}

function buildFaceDescriptors(font: FontFile): FontFaceDescriptors {
  const descriptors: FontFaceDescriptors = {};
  if (font.italic) {
    descriptors.style = "italic";
  }
  if (font.variableAxes?.length) {
    const wght = font.variableAxes.find((axis) => axis.tag === "wght");
    if (wght) {
      descriptors.weight = `${wght.min} ${wght.max}`;
    }
  } else if (font.weight) {
    descriptors.weight = String(font.weight);
  }
  return descriptors;
}

const pendingFaces = new Map<string, Promise<FontFace>>();

export async function loadSpecimenFont(
  libraryId: string,
  font: FontFile,
): Promise<FontFace> {
  const name = specimenFontName(font);
  const cached = pendingFaces.get(name);
  if (cached) {
    return cached;
  }

  const promise = (async () => {
    const response = await fetch(`/api/libraries/${libraryId}/fonts/${font.id}`);
    if (!response.ok) {
      throw new Error(`Could not load ${font.originalName}`);
    }
    const buffer = await response.arrayBuffer();
    const face = new FontFace(name, buffer, buildFaceDescriptors(font));
    face.display = "swap";
    await face.load();
    if (typeof document !== "undefined") {
      document.fonts.add(face);
    }
    return face;
  })();

  pendingFaces.set(name, promise);
  promise.catch(() => {
    pendingFaces.delete(name);
  });
  return promise;
}

export function variationSettings(
  font: FontFile,
  values?: Record<string, number>,
): string | undefined {
  if (!font.variableAxes?.length) {
    return undefined;
  }
  const settings = font.variableAxes
    .map((axis) => {
      const value = values?.[axis.tag] ?? axis.defaultValue;
      return `'${axis.tag}' ${value}`;
    })
    .join(", ");
  return settings || undefined;
}

export function specimenStyle(
  font: FontFile,
  values?: Record<string, number>,
): CSSProperties {
  const style: CSSProperties = {
    fontFamily: `"${specimenFontName(font)}"`,
  };
  const settings = variationSettings(font, values);
  if (settings) {
    style.fontVariationSettings = settings;
  } else if (font.weight) {
    style.fontWeight = font.weight;
  }
  if (font.italic) {
    style.fontStyle = "italic";
  }
  return style;
}

export const SPECIMEN_SAMPLES: Array<{ id: string; label: string; text: string }> = [
  {
    id: "pangram",
    label: "Pangram",
    text: "The quick brown fox jumps over the lazy dog.",
  },
  {
    id: "slogan",
    label: "Slogan",
    text: "Your fonts, on every device.",
  },
  {
    id: "alphabet",
    label: "Alphabet",
    text: "ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz",
  },
  {
    id: "numerals",
    label: "Numerals",
    text: "0123456789 ½ £ $ € © ® ™",
  },
  {
    id: "geometric",
    label: "Hamburgefonts",
    text: "HAMBURGEVONS",
  },
  {
    id: "longform",
    label: "Type specimen",
    text: "The goal is not beauty, but legibility. Good typography makes text disappear — the reader sees the meaning, not the medium.",
  },
];

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/(^|\s)(\w)/g, (_match, space: string, letter: string) => {
      return `${space}${letter.toUpperCase()}`;
    });
}

export function applyCase(value: string, mode: string): string {
  if (mode === "uppercase") {
    return value.toUpperCase();
  }
  if (mode === "lowercase") {
    return value.toLowerCase();
  }
  if (mode === "title") {
    return titleCase(value);
  }
  return value;
}
