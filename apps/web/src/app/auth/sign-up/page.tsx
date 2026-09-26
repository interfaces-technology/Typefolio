import { SignUpForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

interface SignUpPageProps {
  searchParams: Promise<{ redirect_uri?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const query = await searchParams;
  return <SignUpForm redirectUri={query.redirect_uri} />;
}
