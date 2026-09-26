import Link from "next/link";

import { FamilyGrid } from "@/components/family-grid";
import { FontFiles } from "@/components/font-files";
import { StorageMeter } from "@/components/storage-meter";
import { UploadZone } from "@/components/upload-zone";
import { VerifyEmail } from "@/components/verify-email";
import { buttonVariants } from "@/components/ui/button";
import {
  getFamilies,
  getLibrary,
  getMe,
  getSessionUser,
  readOrder,
  readSort,
} from "@/lib/api-server";
import { cn } from "cn";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ sort?: string; order?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await getSessionUser();
  const me = await getMe();

  if (!session || !me) {
    return (
      <main className="flex flex-1 flex-col justify-center py-16">
        <div className="max-w-xl space-y-6">
          <p className="text-sm text-muted-foreground">Typefolio</p>
          <h1 className="text-[2.75rem] font-semibold tracking-tight">
            Your fonts, on every device.
          </h1>
          <p className="max-w-prose text-base text-muted-foreground">
            Upload a font once. The same account opens it on the web, and Pro
            syncs it to the Mac and iPad apps.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/auth/sign-up" className={cn(buttonVariants())}>
              Create account
            </Link>
            <Link
              href="/auth/sign-in"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const query = await searchParams;
  const sort = readSort(query.sort);
  const order = readOrder(query.order);
  const [families, library] = await Promise.all([
    getFamilies(me.library.id, sort, order),
    getLibrary(me.library.id),
  ]);

  const storageFull =
    me.entitlement.storageUsedBytes >= me.entitlement.storageLimitBytes;
  const uploadReason = !me.user.emailVerified
    ? "Verify your email before uploading fonts."
    : storageFull
      ? "Storage is full. Delete a font or move to Pro before uploading more."
      : null;

  const sortHref = (nextSort: "family" | "uploadedAt", nextOrder: "asc" | "desc") => {
    const params = new URLSearchParams({ sort: nextSort, order: nextOrder });
    return `/?${params.toString()}`;
  };

  return (
    <main className="flex flex-1 flex-col gap-10">
      <header className="grid gap-6 lg:grid-cols-[1fr_16rem] lg:items-end">
        <div className="space-y-2">
          <h1 className="text-[1.75rem] font-semibold">{me.library.name}</h1>
          <p className="max-w-prose text-muted-foreground">
            {families.familyCount === 0
              ? "This drawer is empty."
              : `${families.familyCount} ${families.familyCount === 1 ? "family" : "families"} · ${families.fontCount} ${families.fontCount === 1 ? "file" : "files"}`}
          </p>
        </div>
        <StorageMeter
          usedBytes={me.entitlement.storageUsedBytes}
          limitBytes={me.entitlement.storageLimitBytes}
          plan={me.entitlement.plan}
        />
      </header>

      {!me.user.emailVerified ? <VerifyEmail email={session.email} /> : null}

      {families.families.length === 0 ? (
        <UploadZone disabledReason={uploadReason} />
      ) : (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground">
            Upload more fonts
          </summary>
          <div className="pt-4">
            <UploadZone disabledReason={uploadReason} />
          </div>
        </details>
      )}

      {families.families.length > 0 ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-medium">Families</h2>
            <div className="flex flex-wrap gap-2 text-sm">
              <Link
                href={sortHref("family", "asc")}
                aria-current={sort === "family" ? "true" : undefined}
                className={sort === "family" ? "font-medium" : "text-muted-foreground"}
              >
                Name
              </Link>
              <Link
                href={sortHref("uploadedAt", "desc")}
                aria-current={sort === "uploadedAt" ? "true" : undefined}
                className={
                  sort === "uploadedAt" ? "font-medium" : "text-muted-foreground"
                }
              >
                Recently added
              </Link>
              <Link
                href={`/library/${me.library.id}/specimen`}
                className="font-medium text-primary"
              >
                Specimen
              </Link>
            </div>
          </div>
          <FamilyGrid libraryId={me.library.id} families={families.families} />
        </section>
      ) : (
        <p className="max-w-prose text-sm text-muted-foreground">
          Drop a .ttf, .otf, .woff, or .woff2 file. Each family shows up in its
          own letters.
        </p>
      )}

      <FontFiles libraryId={me.library.id} fonts={library.library.fonts} />
    </main>
  );
}
