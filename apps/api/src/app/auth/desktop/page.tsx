import { cookies, headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  DesktopSignInForm,
  DesktopSignInShell,
} from "@/components/desktop-sign-in-form";
import { AuthShell, primaryButton } from "@/components/auth-shell";
import { auth } from "@typefolio/core/auth/server";
import { getSessionCookieName } from "@typefolio/core/auth/config";
import {
  buildDesktopCallbackUrl,
  isAllowedDesktopRedirectUri,
} from "@typefolio/core/desktop-auth";

export const dynamic = "force-dynamic";

interface DesktopAuthPageProps {
  searchParams: Promise<{ redirect_uri?: string; verify?: string }>;
}

const SESSION_COOKIE_NAME = getSessionCookieName();

export default async function DesktopAuthPage({ searchParams }: DesktopAuthPageProps) {
  const { redirect_uri: redirectUri, verify } = await searchParams;

  if (!isAllowedDesktopRedirectUri(redirectUri)) {
    return (
      <AuthShell
        title="Desktop sign-in"
        description="This page is opened by the Typefolio app. The callback URL is missing or invalid."
      >
        <Link href="/" style={{ ...primaryButton, display: "inline-block", textAlign: "center", textDecoration: "none" }}>
          Back to API home
        </Link>
      </AuthShell>
    );
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (session?.user && sessionToken) {
    redirect(
      buildDesktopCallbackUrl(
        redirectUri!,
        sessionToken,
        session.user.email ?? session.user.name ?? "user",
      ),
    );
  }

  if (verify === "1") {
    return (
      <AuthShell
        title="Verify your email"
        description="We sent a verification link. After you confirm, sign in below to return to the app."
      >
        <DesktopSignInForm redirectUri={redirectUri!} />
      </AuthShell>
    );
  }

  return <DesktopSignInShell redirectUri={redirectUri!} />;
}
