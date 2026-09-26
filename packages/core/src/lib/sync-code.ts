import { customAlphabet } from "nanoid";

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const segment = customAlphabet(alphabet, 4);

export function generateSyncCode(): string {
  return `FONT-${segment()}-${segment()}`;
}

export function normalizeSyncCode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "");
}

export function isValidSyncCodeFormat(code: string): boolean {
  return /^FONT-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{4}$/.test(
    code,
  );
}
