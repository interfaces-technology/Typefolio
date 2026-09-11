export const FONT_EXTENSIONS = [".ttf", ".otf", ".woff", ".woff2"] as const;

export type FontExtension = (typeof FONT_EXTENSIONS)[number];

export interface FontFile {
  id: string;
  originalName: string;
  storedName: string;
  size: number;
  extension: FontExtension;
  uploadedAt: string;
}

export interface Library {
  id: string;
  name: string;
  description?: string;
  syncCode: string;
  fonts: FontFile[];
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
