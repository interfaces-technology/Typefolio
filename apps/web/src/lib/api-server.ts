import { cookies } from "next/headers";

import { ApiError } from "@/lib/api";
import type {
  BillingPlansResponse,
  Device,
  FamilyListResponse,
  FontFamilySort,
  LibraryResponse,
  MeResponse,
  SessionUser,
  SortOrder,
} from "@/lib/types";

function apiOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:43123"
  );
}

export async function serverApi<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const cookieStore = await cookies();
  const headers = new Headers(init?.headers);
  const cookie = cookieStore.toString();
  if (cookie) {
    headers.set("cookie", cookie);
  }

  const response = await fetch(`${apiOrigin()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const data = (await response.json()) as
    | (T & { error?: string; code?: string })
    | null;

  if (!response.ok) {
    const body = data && typeof data === "object" ? data : null;
    throw new ApiError(
      body?.error ?? "Something went wrong",
      response.status,
      body?.code,
    );
  }

  return data as T;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const data = await serverApi<{
      user?: {
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
      } | null;
    } | null>("/api/auth/get-session");
    if (!data?.user) {
      return null;
    }
    return data.user;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
      return null;
    }
    if (error instanceof ApiError) {
      return null;
    }
    throw error;
  }
}

export async function getMe(): Promise<MeResponse | null> {
  try {
    return await serverApi<MeResponse>("/api/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function getLibrary(libraryId: string): Promise<LibraryResponse> {
  return serverApi<LibraryResponse>(`/api/libraries/${libraryId}`);
}

export async function getFamilies(
  libraryId: string,
  sort: FontFamilySort = "family",
  order: SortOrder = "asc",
): Promise<FamilyListResponse> {
  const params = new URLSearchParams({ sort, order });
  return serverApi<FamilyListResponse>(
    `/api/libraries/${libraryId}/families?${params.toString()}`,
  );
}

export async function getDevices(libraryId: string): Promise<Device[]> {
  const data = await serverApi<{ devices: Device[] }>(
    `/api/libraries/${libraryId}/devices`,
  );
  return data.devices;
}

export async function getBillingPlans(): Promise<BillingPlansResponse> {
  return serverApi<BillingPlansResponse>("/api/billing/plans");
}

export function readSort(value: string | undefined): FontFamilySort {
  return value === "uploadedAt" ? "uploadedAt" : "family";
}

export function readOrder(value: string | undefined): SortOrder {
  return value === "desc" ? "desc" : "asc";
}
