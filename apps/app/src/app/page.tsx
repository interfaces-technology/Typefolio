import { SignedInHome, SignedOutHome } from "@/components/home-panels";
import { getSessionUserId } from "@typefolio/core/access";
import { getUserEntitlement } from "@typefolio/core/entitlements";
import { getOrCreateUserLibrary } from "@typefolio/core/storage";
import type { Entitlement, Library } from "@typefolio/core/types";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await getSessionUserId();
  let library: Library | null = null;
  let entitlement: Entitlement | null = null;

  if (userId) {
    [library, entitlement] = await Promise.all([
      getOrCreateUserLibrary(userId),
      getUserEntitlement(userId),
    ]);
  }

  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
        <section className="max-w-2xl space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Typefolio</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your library
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Upload and manage the fonts tied to your account. Native apps sync
            from the same library.
          </p>
        </section>

        {library && entitlement ? (
          <SignedInHome library={library} entitlement={entitlement} />
        ) : (
          <SignedOutHome />
        )}
      </main>
    </div>
  );
}
