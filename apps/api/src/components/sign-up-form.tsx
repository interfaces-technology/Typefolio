"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signUpWithEmail } from "@/app/auth/sign-up/actions";
import {
  errorText,
  fieldInput,
  fieldLabel,
  mutedLink,
  primaryButton,
  secondaryButton,
} from "@/components/auth-shell";
import { authClient } from "@typefolio/core/auth/client";

export function SignUpForm({
  redirectUri,
  showVerifyNotice,
}: {
  redirectUri?: string;
  showVerifyNotice?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(signUpWithEmail, null);

  async function handleGoogle() {
    if (!redirectUri) {
      return;
    }
    await authClient.signIn.social({
      provider: "google",
      callbackURL: `/auth/desktop?redirect_uri=${encodeURIComponent(redirectUri)}`,
    });
  }

  if (showVerifyNotice) {
    return (
      <p style={{ fontSize: "0.9375rem", color: "#525252", margin: 0 }}>
        Check your email to verify your account, then sign in from the Typefolio app again.
      </p>
    );
  }

  return (
    <>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {redirectUri ? (
          <input type="hidden" name="redirect_uri" value={redirectUri} />
        ) : null}
        <div>
          <label htmlFor="name" style={fieldLabel}>
            Name
          </label>
          <input id="name" name="name" type="text" autoComplete="name" required style={fieldInput} />
        </div>
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
            autoComplete="new-password"
            required
            minLength={8}
            style={fieldInput}
          />
        </div>
        {state?.error ? <p style={errorText}>{state.error}</p> : null}
        <button type="submit" style={primaryButton} disabled={isPending}>
          {isPending ? "Creating account…" : "Create account"}
        </button>
      </form>

      {redirectUri ? (
        <>
          <p style={{ textAlign: "center", fontSize: "0.75rem", color: "#737373", margin: "1rem 0" }}>
            or
          </p>
          <button type="button" style={secondaryButton} onClick={() => void handleGoogle()}>
            Continue with Google
          </button>
        </>
      ) : null}

      <p style={mutedLink}>
        Already have an account?{" "}
        {redirectUri ? (
          <Link
            href={`/auth/desktop?redirect_uri=${encodeURIComponent(redirectUri)}`}
            style={{ color: "#171717", fontWeight: 500 }}
          >
            Sign in
          </Link>
        ) : (
          <Link href="/auth/desktop" style={{ color: "#171717", fontWeight: 500 }}>
            Desktop sign-in
          </Link>
        )}
      </p>
    </>
  );
}
