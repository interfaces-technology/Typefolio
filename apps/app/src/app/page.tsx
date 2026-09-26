import { SignedInHome, SignedOutHome } from "@/components/home-panels";
import { getSessionUserId } from "@typefolio/core/access";
import { getOrCreateUserLibrary } from "@typefolio/core/storage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await getSessionUserId();
  const library = userId ? await getOrCreateUserLibrary(userId) : null;

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

        {library ? <SignedInHome library={library} /> : <SignedOutHome />}
      </main>
    </div>
  );
}
