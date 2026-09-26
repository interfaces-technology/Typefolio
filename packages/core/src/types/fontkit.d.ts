declare module "fontkit" {
  export interface Font {
    familyName?: string;
    subfamilyName?: string;
    postscriptName?: string;
    fullName?: string;
    weight?: number;
    italic?: boolean;
    name?: { records?: Record<string, string> };
    encode?: () => Uint8Array;
  }

  export function create(buffer: Buffer): Font;
}
