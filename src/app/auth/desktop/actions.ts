"use server";

import { auth } from "@/lib/auth/server";
import { isAllowedDesktopRedirectUri } from "@/lib/desktop-auth";
import { redirect } from "next/navigation";

export async function signInForDesktop(
  _prevState: { error: string } | null,
  formData: FormData,
) {
  const redirectUri = formData.get("redirect_uri");
  if (typeof redirectUri !== "string" || !isAllowedDesktopRedirectUri(redirectUri)) {
    return { error: "Invalid desktop callback URL." };
  }

  const { error } = await auth.signIn.email({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) {
    return { error: error.message || "Could not sign in. Try again." };
  }

  redirect(`/auth/desktop?redirect_uri=${encodeURIComponent(redirectUri)}`);
}
