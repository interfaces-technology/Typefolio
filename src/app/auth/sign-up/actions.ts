"use server";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";

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

  const { error } = await auth.signUp.email({
    email: email.trim(),
    name: name.trim(),
    password,
  });

  if (error) {
    return { error: error.message || "Could not create account." };
  }

  redirect("/");
}
