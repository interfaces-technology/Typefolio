import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { FontList } from "@/components/font-list";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { getLibraryBySyncCode } from "@/lib/storage";
import { isValidSyncCodeFormat, normalizeSyncCode } from "@/lib/sync-code";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface SyncPageProps {
  params: Promise<{ code: string }>;
}

export default async function SyncPage({ params }: SyncPageProps) {
  const { code } = await params;
  const normalized = normalizeSyncCode(code);

  if (!isValidSyncCodeFormat(normalized)) {
    return (
      <div className="flex min-h-full flex-col">
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit")}>
            <ArrowLeft className="size-4" />
            Home
          </Link>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="font-medium text-destructive">Invalid sync code format.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Double-check the code format: FONT-ABCD-1234
            </p>
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4 inline-flex")}
            >
              Enter another code
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const library = await getLibraryBySyncCode(normalized);
  if (!library) {
    notFound();
  }

  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit")}>
          <ArrowLeft className="size-4" />
          Home
        </Link>
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {library.name}
            </h1>
            <Badge variant="outline" className="font-mono">
              {library.syncCode}
            </Badge>
          </div>
          {library.description && (
            <p className="text-muted-foreground">{library.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Download individual files or grab the full set as a ZIP. Install
            them on your device after downloading.
          </p>
        </header>
        <FontList
          libraryId={library.id}
          fonts={library.fonts}
          libraryName={library.name}
          syncCode={library.syncCode}
        />
      </main>
    </div>
  );
}
