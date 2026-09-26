"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAPIError } from "better-auth/api";

import { auth } from "@typefolio/core/auth/server";
import { isAllowedDesktopRedirectUri } from "@typefolio/core/desktop-auth";

export async function signInForDesktop(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const redirectUri = formData.get("redirect_uri");
  if (typeof redirectUri !== "string" || !isAllowedDesktopRedirectUri(redirectUri)) {
    return { error: "Invalid desktop callback URL." };
  }

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

  redirect(`/auth/desktop?redirect_uri=${encodeURIComponent(redirectUri)}`);
}
