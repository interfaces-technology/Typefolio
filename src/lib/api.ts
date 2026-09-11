import type { Library } from "@/lib/types";

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
  files: File[],
): Promise<{ library: Library; added: number; rejected: string[] }> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("fonts", file);
  }

  const response = await fetch("/api/fonts", {
    method: "POST",
    body: formData,
  });

  return parseResponse<{
    library: Library;
    added: number;
    rejected: string[];
  }>(response);
}

export function fontDownloadPath(libraryId: string, fontId: string): string {
  return `/api/libraries/${libraryId}/fonts/${fontId}`;
}

export function libraryZipPath(libraryId: string): string {
  return `/api/libraries/${libraryId}/download`;
}
