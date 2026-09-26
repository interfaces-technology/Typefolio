"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAPIError } from "better-auth/api";

import { auth } from "@typefolio/core/auth/server";

export async function signUpWithEmail(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;

  if (!email?.trim() || !name?.trim() || !password) {
    return { error: "Name, email, and password are required." };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email: email.trim(),
        name: name.trim(),
        password,
      },
      headers: await headers(),
    });
  } catch (error) {
    if (isAPIError(error)) {
      return { error: error.message || "Could not create account." };
    }
    throw error;
  }

  redirect("/auth/sign-in?verify=1");
}
