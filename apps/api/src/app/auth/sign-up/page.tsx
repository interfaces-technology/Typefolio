import { AuthShell } from "@/components/auth-shell";
import { SignUpForm } from "@/components/sign-up-form";
import { isAllowedDesktopRedirectUri } from "@typefolio/core/desktop-auth";

export const dynamic = "force-dynamic";

interface SignUpPageProps {
  searchParams: Promise<{ redirect_uri?: string; verify?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { redirect_uri: redirectUri, verify } = await searchParams;
  const safeRedirectUri =
    redirectUri && isAllowedDesktopRedirectUri(redirectUri) ? redirectUri : undefined;

  return (
    <AuthShell
      title={verify === "1" ? "Check your email" : "Create account"}
      description={
        verify === "1"
          ? "Verify your email to sync fonts with the Mac or iPad app."
          : "Create an account for Typefolio sync. The web library is being redesigned — use the native apps after sign-in."
      }
    >
      <SignUpForm redirectUri={safeRedirectUri} showVerifyNotice={verify === "1"} />
    </AuthShell>
  );
}
