"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAPIError } from "better-auth/api";

import { auth } from "@/lib/auth/server";

export async function signInWithEmail(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  try {
    await auth.api.signInEmail({
      body: {
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      },
      headers: await headers(),
    });
  } catch (error) {
    if (isAPIError(error)) {
      return { error: error.message || "Could not sign in. Try again." };
    }
    throw error;
  }

  redirect("/");
}
