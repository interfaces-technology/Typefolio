import type {
  ActivityEvent,
  CollectionDetail,
  CollectionItemType,
  CollectionSummary,
  Entitlement,
  FavoriteItemType,
  FontClassification,
  FontFamilyGroup,
  Library,
  LibrarySummary,
  ReferenceFontRole,
  ReferenceRecord,
  SearchResults,
  ShareLink,
  ShareVisibility,
} from "@typefolio/core/types";

function publicApiBase(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
}

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

function request(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${publicApiBase()}${path}`, {
    credentials: "include",
    ...init,
  });
}

export async function getMe(): Promise<{
  user: { id: string; emailVerified: boolean };
  library: LibrarySummary;
  entitlement: Entitlement;
}> {
  return parseResponse(await request("/api/me"));
}

export async function deleteFont(
  libraryId: string,
  fontId: string,
): Promise<void> {
  await parseResponse<{ ok: boolean }>(
    await request(`/api/libraries/${libraryId}/fonts/${fontId}`, {
      method: "DELETE",
    }),
  );
}

export async function uploadFonts(
  files: File[],
): Promise<{ library: Library; added: number; rejected: string[] }> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("fonts", file);
  }

  return parseResponse(
    await request("/api/fonts", {
      method: "POST",
      body: formData,
    }),
  );
}

export function fontDownloadPath(libraryId: string, fontId: string): string {
  return `${publicApiBase()}/api/libraries/${libraryId}/fonts/${fontId}`;
}

export function fontGlyphsPath(libraryId: string, fontId: string): string {
  return `${publicApiBase()}/api/libraries/${libraryId}/fonts/${fontId}/glyphs`;
}

export function libraryZipPath(libraryId: string): string {
  return `${publicApiBase()}/api/libraries/${libraryId}/download`;
}

export async function listFamilies(
  libraryId: string,
  query: {
    q?: string;
    classification?: FontClassification;
    mood?: string;
    sort?: string;
  } = {},
): Promise<{
  libraryId: string;
  familyCount: number;
  fontCount: number;
  families: FontFamilyGroup[];
}> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.classification) params.set("classification", query.classification);
  if (query.mood) params.set("mood", query.mood);
  if (query.sort) params.set("sort", query.sort);
  const suffix = params.toString() ? `?${params}` : "";
  return parseResponse(
    await request(`/api/libraries/${libraryId}/families${suffix}`),
  );
}

export async function getFamily(
  libraryId: string,
  slug: string,
): Promise<{ family: FontFamilyGroup; installState: "none" | "partial" | "installed" }> {
  return parseResponse(
    await request(`/api/libraries/${libraryId}/families/${slug}`),
  );
}

export async function updateFamily(
  libraryId: string,
  slug: string,
  input: Record<string, unknown>,
): Promise<{ family: FontFamilyGroup }> {
  return parseResponse(
    await request(`/api/libraries/${libraryId}/families/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function toggleFamilyFavorite(
  libraryId: string,
  slug: string,
): Promise<{ family: FontFamilyGroup }> {
  return parseResponse(
    await request(`/api/libraries/${libraryId}/families/${slug}/favorite`, {
      method: "POST",
    }),
  );
}

export async function searchLibrary(
  libraryId: string,
  q: string,
): Promise<SearchResults> {
  const params = new URLSearchParams({ q, libraryId });
  return parseResponse(await request(`/api/search?${params}`));
}

export async function listCollections(
  libraryId: string,
): Promise<{ collections: CollectionSummary[] }> {
  return parseResponse(
    await request(`/api/libraries/${libraryId}/collections`),
  );
}

export async function getCollection(
  libraryId: string,
  slug: string,
): Promise<{ collection: CollectionDetail }> {
  return parseResponse(
    await request(`/api/libraries/${libraryId}/collections/${slug}`),
  );
}

export async function createCollection(
  libraryId: string,
  input: { name: string; description?: string },
): Promise<{ collection: CollectionDetail }> {
  return parseResponse(
    await request(`/api/libraries/${libraryId}/collections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function addCollectionItem(
  libraryId: string,
  slug: string,
  input: { itemType: CollectionItemType; itemId?: string; noteBody?: string },
): Promise<{ collection: CollectionDetail }> {
  return parseResponse(
    await request(`/api/libraries/${libraryId}/collections/${slug}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function removeCollectionItem(
  libraryId: string,
  slug: string,
  itemId: string,
): Promise<{ collection: CollectionDetail }> {
  return parseResponse(
    await request(
      `/api/libraries/${libraryId}/collections/${slug}/items?itemId=${itemId}`,
      { method: "DELETE" },
    ),
  );
}

export async function listReferences(
  libraryId: string,
): Promise<{ references: ReferenceRecord[] }> {
  return parseResponse(
    await request(`/api/libraries/${libraryId}/references`),
  );
}

export async function getReference(
  libraryId: string,
  slug: string,
): Promise<{ reference: ReferenceRecord }> {
  return parseResponse(
    await request(`/api/libraries/${libraryId}/references/${slug}`),
  );
}

export async function createReference(
  libraryId: string,
  input: {
    title: string;
    category?: string;
    year?: string;
    description?: string;
    tags?: string;
    image: File;
    familyIds?: string;
  },
): Promise<{ reference: ReferenceRecord }> {
  const form = new FormData();
  form.set("title", input.title);
  if (input.category) form.set("category", input.category);
  if (input.year) form.set("year", input.year);
  if (input.description) form.set("description", input.description);
  if (input.tags) form.set("tags", input.tags);
  if (input.familyIds) form.set("familyIds", input.familyIds);
  form.set("image", input.image);
  return parseResponse(
    await request(`/api/libraries/${libraryId}/references`, {
      method: "POST",
      body: form,
    }),
  );
}

export async function updateReference(
  libraryId: string,
  slug: string,
  input: {
    title?: string;
    category?: string;
    year?: number | null;
    description?: string;
    tags?: string[];
    familyIds?: Array<{ familyId: string; role?: ReferenceFontRole }>;
  },
): Promise<{ reference: ReferenceRecord }> {
  return parseResponse(
    await request(`/api/libraries/${libraryId}/references/${slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteReference(
  libraryId: string,
  slug: string,
): Promise<void> {
  await parseResponse<{ ok: boolean }>(
    await request(`/api/libraries/${libraryId}/references/${slug}`, {
      method: "DELETE",
    }),
  );
}

export async function listFavorites(
  libraryId: string,
  type?: FavoriteItemType,
): Promise<{
  fonts: FontFamilyGroup[];
  references: ReferenceRecord[];
}> {
  const suffix = type ? `?type=${type}` : "";
  return parseResponse(
    await request(`/api/libraries/${libraryId}/favorites${suffix}`),
  );
}

export async function toggleFavorite(
  libraryId: string,
  itemType: FavoriteItemType,
  itemId: string,
): Promise<{ favorited: boolean }> {
  return parseResponse(
    await request(`/api/libraries/${libraryId}/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemType, itemId }),
    }),
  );
}

export async function listActivity(
  libraryId: string,
): Promise<{ activity: ActivityEvent[] }> {
  return parseResponse(await request(`/api/libraries/${libraryId}/activity`));
}

export async function listDevices(
  libraryId: string,
): Promise<{ devices: import("@typefolio/core/types").Device[] }> {
  return parseResponse(await request(`/api/libraries/${libraryId}/devices`));
}

export async function createShareLink(
  libraryId: string,
  input: {
    resourceType: string;
    resourceId: string;
    visibility?: ShareVisibility;
  },
): Promise<{ share: ShareLink }> {
  return parseResponse(
    await request(`/api/libraries/${libraryId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function openBillingPortal(): Promise<{ portalUrl: string }> {
  return parseResponse(
    await request("/api/billing/portal", { method: "POST" }),
  );
}
