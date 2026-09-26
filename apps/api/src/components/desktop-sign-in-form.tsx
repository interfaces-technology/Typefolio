"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInForDesktop } from "@/app/auth/desktop/actions";
import {
  AuthShell,
  errorText,
  fieldInput,
  fieldLabel,
  mutedLink,
  primaryButton,
  secondaryButton,
} from "@/components/auth-shell";
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
    <>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        <input type="hidden" name="redirect_uri" value={redirectUri} />
        <div>
          <label htmlFor="email" style={fieldLabel}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@studio.com"
            style={fieldInput}
          />
        </div>
        <div>
          <label htmlFor="password" style={fieldLabel}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            style={fieldInput}
          />
        </div>
        {state?.error ? <p style={errorText}>{state.error}</p> : null}
        <button type="submit" style={primaryButton} disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in and return to app"}
        </button>
      </form>

      <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#737373", margin: "1rem 0" }}>
        or
      </p>

      <button type="button" style={secondaryButton} onClick={() => void handleGoogle()}>
        Continue with Google
      </button>

      <p style={mutedLink}>
        No account?{" "}
        <Link
          href={`/auth/sign-up?redirect_uri=${encodeURIComponent(redirectUri)}`}
          style={{ color: "#171717", fontWeight: 500 }}
        >
          Create one
        </Link>
      </p>
    </>
  );
}

export function DesktopSignInShell({ redirectUri }: DesktopSignInFormProps) {
  return (
    <AuthShell
      title="Sign in to Typefolio"
      description="Finish signing in here, then you'll return to the Typefolio app automatically."
    >
      <DesktopSignInForm redirectUri={redirectUri} />
    </AuthShell>
  );
}
