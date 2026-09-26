import type { CheckoutPriceId, Library } from "@typefolio/core/types";

function publicApiBase(): string {
  // Stay on the app origin. apps/app rewrites /api to the API so the
  // session cookie is included without a cross-origin request.
  return "";
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as { error?: string; code?: string } & T;
  if (!response.ok) {
    throw new ApiError(
      data.error ?? "Something went wrong",
      response.status,
      data.code,
    );
  }
  return data;
}

export async function deleteFont(
  libraryId: string,
  fontId: string,
): Promise<void> {
  const response = await fetch(
    `${publicApiBase()}/api/libraries/${libraryId}/fonts/${fontId}`,
    {
      method: "DELETE",
    },
  );
  await parseResponse<{ ok: boolean }>(response);
}

export async function uploadFonts(
  files: File[],
): Promise<{ library: Library; added: number; rejected: string[] }> {
  const formData = new FormData();
  for (const file of files) {
    formData.append("fonts", file);
  }

  const response = await fetch(`${publicApiBase()}/api/fonts`, {
    method: "POST",
    body: formData,
  });

  return parseResponse<{
    library: Library;
    added: number;
    rejected: string[];
  }>(response);
}

export async function startCheckout(
  priceId: CheckoutPriceId,
): Promise<{ checkoutUrl: string }> {
  const response = await fetch(`${publicApiBase()}/api/billing/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ priceId }),
  });

  return parseResponse<{ checkoutUrl: string }>(response);
}

export async function startBillingPortal(): Promise<{ portalUrl: string }> {
  const response = await fetch(`${publicApiBase()}/api/billing/portal`, {
    method: "POST",
    credentials: "include",
  });

  return parseResponse<{ portalUrl: string }>(response);
}

export async function deleteAccount(): Promise<void> {
  const response = await fetch(`${publicApiBase()}/api/me`, {
    method: "DELETE",
    credentials: "include",
  });

  await parseResponse<{ deleted: boolean }>(response);
}

export function fontDownloadPath(libraryId: string, fontId: string): string {
  return `${publicApiBase()}/api/libraries/${libraryId}/fonts/${fontId}`;
}
