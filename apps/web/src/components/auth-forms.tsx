"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { buildDesktopCallbackUrl } from "@/lib/desktop-auth";

function safeNext(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export function SignInForm({
  nextPath,
  verifyNotice,
}: {
  nextPath?: string;
  verifyNotice?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const destination = safeNext(nextPath);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const { error: authError } = await authClient.signIn.email({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    if (authError) {
      setError(authError.message || "Could not sign in. Try again.");
      setPending(false);
      return;
    }
    router.push(destination);
    router.refresh();
  }

  async function google() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: destination,
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-[1.75rem] font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          The same account opens this library on every device.
        </p>
      </div>
      {verifyNotice ? (
        <p className="text-sm">
          Check your email to verify the account, then sign in.
        </p>
      ) : null}
      <form action={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={error ? true : undefined}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <Button type="button" variant="outline" className="w-full" onClick={() => void google()}>
        Continue with Google
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/auth/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}

export function SignUpForm({ redirectUri }: { redirectUri?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!name || !email || !password) {
      setError("Name, email, and password are required.");
      setPending(false);
      return;
    }
    const { error: authError } = await authClient.signUp.email({
      name,
      email,
      password,
      callbackURL: "/",
    });
    if (authError) {
      setError(authError.message || "Could not create the account.");
      setPending(false);
      return;
    }
    const next = redirectUri
      ? `/auth/sign-in?verify=1&next=${encodeURIComponent(`/auth/desktop?redirect_uri=${encodeURIComponent(redirectUri)}`)}`
      : "/auth/sign-in?verify=1";
    router.push(next);
  }

  async function google() {
    const callbackURL = redirectUri
      ? `/auth/desktop?redirect_uri=${encodeURIComponent(redirectUri)}`
      : "/";
    await authClient.signIn.social({
      provider: "google",
      callbackURL,
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-[1.75rem] font-semibold">Create account</h1>
        <p className="text-sm text-muted-foreground">
          Fonts stay with this account. You will get a verification email before uploads.
        </p>
      </div>
      <form action={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" type="text" autoComplete="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            aria-invalid={error ? true : undefined}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <Button type="button" variant="outline" className="w-full" onClick={() => void google()}>
        Continue with Google
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export function DesktopSignInForm({ redirectUri }: { redirectUri: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const { data, error: authError } = await authClient.signIn.email({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    if (authError || !data?.token || !data.user.email) {
      setError(authError?.message || "Could not sign in. Try again.");
      setPending(false);
      return;
    }
    window.location.assign(
      buildDesktopCallbackUrl(redirectUri, data.token, data.user.email),
    );
  }

  async function google() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: `/auth/desktop?redirect_uri=${encodeURIComponent(redirectUri)}`,
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-[1.75rem] font-semibold">Sign in to Typefolio</h1>
        <p className="text-sm text-muted-foreground">
          Finish here, then you return to the Typefolio app.
        </p>
      </div>
      <form action={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={error ? true : undefined}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in and return to the app"}
        </Button>
      </form>
      <Button type="button" variant="outline" className="w-full" onClick={() => void google()}>
        Continue with Google
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link
          href={`/auth/sign-up?redirect_uri=${encodeURIComponent(redirectUri)}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
