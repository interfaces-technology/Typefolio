import type { Library, LibrarySummary } from "@/lib/types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as { error?: string } & T;
  if (!response.ok) {
    throw new ApiError(data.error ?? "Something went wrong", response.status);
  }
  return data;
}

export async function createLibrary(input: {
  name: string;
  description?: string;
}): Promise<LibrarySummary> {
  const response = await fetch("/api/libraries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseResponse<{ library: LibrarySummary }>(response);
  return data.library;
}

export async function fetchLibraries(): Promise<LibrarySummary[]> {
  const response = await fetch("/api/libraries");
  const data = await parseResponse<{ libraries: LibrarySummary[] }>(response);
  return data.libraries;
}

export async function fetchLibraryById(
  id: string,
): Promise<{ library: Library; isOwner: boolean }> {
  const response = await fetch(`/api/libraries/${id}`);
  return parseResponse<{ library: Library; isOwner: boolean }>(response);
}

export async function fetchLibraryBySyncCode(code: string): Promise<Library> {
  const response = await fetch(`/api/libraries/by-code/${code}`);
  const data = await parseResponse<{ library: Library }>(response);
  return data.library;
}

export async function deleteLibrary(id: string): Promise<void> {
  const response = await fetch(`/api/libraries/${id}`, { method: "DELETE" });
  await parseResponse<{ ok: boolean }>(response);
}

export async function deleteFont(
  libraryId: string,
  fontId: string,
): Promise<void> {
  const response = await fetch(`/api/libraries/${libraryId}/fonts/${fontId}`, {
    method: "DELETE",
  });
  await parseResponse<{ ok: boolean }>(response);
}

export async function uploadFonts(
  libraryId: string,
  files: File[],
): Promise<{ library: Library; added: number; rejected: string[] }> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("fonts", file);
  }

  const response = await fetch(`/api/libraries/${libraryId}/fonts`, {
    method: "POST",
    body: formData,
  });

  const data = await parseResponse<{
    library: Library;
    added: number;
    rejected: string[];
  }>(response);

  return data;
}

export function fontDownloadPath(
  libraryId: string,
  fontId: string,
  syncCode?: string,
): string {
  const path = `/api/libraries/${libraryId}/fonts/${fontId}`;
  return syncCode ? `${path}?syncCode=${encodeURIComponent(syncCode)}` : path;
}

export function libraryZipPath(libraryId: string, syncCode?: string): string {
  const path = `/api/libraries/${libraryId}/download`;
  return syncCode ? `${path}?syncCode=${encodeURIComponent(syncCode)}` : path;
}
