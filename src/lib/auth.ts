import { getLibraryById } from "@/lib/storage";
import { normalizeSyncCode } from "@/lib/sync-code";

export async function validateSyncCodeForLibrary(
  libraryId: string,
  syncCodeHeader: string | null,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!syncCodeHeader?.trim()) {
    return {
      ok: false,
      status: 401,
      error: "Missing X-Sync-Code header.",
    };
  }

  const library = await getLibraryById(libraryId);
  if (!library) {
    return { ok: false, status: 404, error: "Library not found." };
  }

  const provided = normalizeSyncCode(syncCodeHeader);
  if (provided !== library.syncCode) {
    return { ok: false, status: 403, error: "Invalid sync code for this library." };
  }

  return { ok: true };
}
