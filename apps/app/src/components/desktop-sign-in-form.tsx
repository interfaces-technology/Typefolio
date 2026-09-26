"use client";

import { useActionState } from "react";
import Link from "next/link";

import { signInForDesktop } from "@/app/auth/desktop/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@typefolio/core/auth/client";

interface DesktopSignInFormProps {
  redirectUri: string;
}

export function DesktopSignInForm({ redirectUri }: DesktopSignInFormProps) {
  const [state, formAction, isPending] = useActionState(signInForDesktop, null);

  async function handleGoogle() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: `/auth/desktop?redirect_uri=${encodeURIComponent(redirectUri)}`,
    });
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="redirect_uri" value={redirectUri} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@studio.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {state?.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in and return to app"}
        </Button>
      </form>

      <div className="relative py-1 text-center text-xs text-muted-foreground">
        <span className="bg-card px-2">or</span>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => void handleGoogle()}
      >
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
