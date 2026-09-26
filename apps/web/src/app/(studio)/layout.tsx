import { SiteHeader } from "@/components/site-header";
import { getMe, getSessionUser } from "@/lib/api-server";

export const dynamic = "force-dynamic";

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, me] = await Promise.all([getSessionUser(), getMe()]);

  return (
    <>
      <SiteHeader email={session?.email} plan={me?.entitlement.plan} />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6">
        {children}
      </div>
    </>
  );
}
