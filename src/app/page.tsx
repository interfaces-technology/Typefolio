import { SignedInHome, SignedOutHome } from "@/components/home-panels";
import { getSessionUserId } from "@/lib/access";
import { listLibrariesForUser } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const userId = await getSessionUserId();
  const libraries = userId ? await listLibrariesForUser(userId) : [];

  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6">
        <section className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Keep your fonts in sync across every device
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Upload font files once. They live in the cloud. Share a short sync
            code, and download the same library anywhere.
          </p>
        </section>

        {userId ? <SignedInHome libraries={libraries} /> : <SignedOutHome />}
      </main>
    </div>
  );
}
