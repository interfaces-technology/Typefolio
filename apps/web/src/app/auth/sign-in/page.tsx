import { SignInForm } from "@/components/auth-forms";

export const dynamic = "force-dynamic";

interface SignInPageProps {
  searchParams: Promise<{ next?: string; verify?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const query = await searchParams;
  return <SignInForm nextPath={query.next} verifyNotice={query.verify === "1"} />;
}
