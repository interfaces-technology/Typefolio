"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSessionUserId } from "@typefolio/core/access";
import { deleteDevice } from "@typefolio/core/devices";
import { getLibraryById } from "@typefolio/core/storage";

export async function removeDevice(
  formData: FormData,
): Promise<{ error?: string }> {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const libraryId = String(formData.get("libraryId") ?? "");
  const deviceId = String(formData.get("deviceId") ?? "");
  const library = await getLibraryById(libraryId);

  if (!library || library.ownerUserId !== userId) {
    return { error: "You do not have access to this library." };
  }

  const removed = await deleteDevice(libraryId, deviceId);
  if (!removed) {
    return { error: "Device not found." };
  }

  revalidatePath("/account");
  return {};
}
