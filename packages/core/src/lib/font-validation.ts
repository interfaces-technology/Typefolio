import { FONT_EXTENSIONS, type FontExtension } from "@typefolio/core/types";

const MIME_TYPES: Record<FontExtension, string[]> = {
  ".ttf": ["font/ttf", "application/x-font-ttf", "application/octet-stream"],
  ".otf": ["font/otf", "application/x-font-otf", "application/octet-stream"],
  ".woff": ["font/woff", "application/font-woff", "application/octet-stream"],
  ".woff2": [
    "font/woff2",
    "application/font-woff2",
    "application/octet-stream",
  ],
};

export function getFontExtension(filename: string): FontExtension | null {
  const lower = filename.toLowerCase();
  for (const ext of FONT_EXTENSIONS) {
    if (lower.endsWith(ext)) {
      return ext;
    }
  }
  return null;
}

export function isAllowedFontFile(filename: string, mimeType: string): boolean {
  const extension = getFontExtension(filename);
  if (!extension) {
    return false;
  }

  const allowedMimes = MIME_TYPES[extension];
  if (!mimeType) {
    return true;
  }

  return allowedMimes.includes(mimeType);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
