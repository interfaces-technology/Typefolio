import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DesktopSignInForm } from "@/components/auth-forms";
import { getSessionUser } from "@/lib/api-server";
import {
  buildDesktopCallbackUrl,
  isAllowedDesktopRedirectUri,
  sessionCookieName,
} from "@/lib/desktop-auth";

export const dynamic = "force-dynamic";

interface DesktopAuthPageProps {
  searchParams: Promise<{ redirect_uri?: string }>;
}

export default async function DesktopAuthPage({
  searchParams,
}: DesktopAuthPageProps) {
  const { redirect_uri: redirectUri } = await searchParams;

  if (!redirectUri || !isAllowedDesktopRedirectUri(redirectUri)) {
    return (
      <div className="space-y-4">
        <h1 className="text-[1.75rem] font-semibold">Desktop sign-in</h1>
        <p className="text-sm text-muted-foreground">
          This page is opened by the Typefolio app. The callback URL is missing
          or invalid.
        </p>
        <Link href="/" className="text-sm font-medium underline-offset-4 hover:underline">
          Back to Typefolio
        </Link>
      </div>
    );
  }

  const session = await getSessionUser();
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName())?.value;

  if (session?.email && sessionToken) {
    redirect(buildDesktopCallbackUrl(redirectUri, sessionToken, session.email));
  }

  return <DesktopSignInForm redirectUri={redirectUri} />;
}
