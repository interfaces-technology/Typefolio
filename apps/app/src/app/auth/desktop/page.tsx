import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

import { DesktopSignInForm } from "@/components/desktop-sign-in-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@typefolio/core/utils";
import { auth } from "@typefolio/core/auth/server";
import { getSessionCookieName } from "@typefolio/core/auth/config";
import {
  buildDesktopCallbackUrl,
  isAllowedDesktopRedirectUri,
} from "@typefolio/core/desktop-auth";

export const dynamic = "force-dynamic";

interface DesktopAuthPageProps {
  searchParams: Promise<{ redirect_uri?: string }>;
}

const SESSION_COOKIE_NAME = getSessionCookieName();

export default async function DesktopAuthPage({ searchParams }: DesktopAuthPageProps) {
  const { redirect_uri: redirectUri } = await searchParams;

  if (!isAllowedDesktopRedirectUri(redirectUri)) {
    return (
      <div className="flex min-h-full flex-col">
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Desktop sign-in</CardTitle>
              <CardDescription>
                This page is opened by the Typefolio app. The callback URL is
                missing or invalid.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
                Back to Typefolio
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
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

  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Sign in to Typefolio</CardTitle>
            <CardDescription>
              Finish signing in here, then you&apos;ll return to the Typefolio app
              automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DesktopSignInForm redirectUri={redirectUri!} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
