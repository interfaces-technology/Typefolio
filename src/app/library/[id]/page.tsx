"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { FontList } from "@/components/font-list";
import { SiteHeader } from "@/components/site-header";
import { SyncCodeDisplay } from "@/components/sync-code-display";
import { UploadZone } from "@/components/upload-zone";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchLibraryById } from "@/lib/api";
import type { Library } from "@/lib/types";

export default function LibraryPage() {
  const params = useParams<{ id: string }>();
  const [library, setLibrary] = useState<Library | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLibrary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLibraryById(params.id);
      setLibrary(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load library";
      setError(message);
      setLibrary(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void loadLibrary();
  }, [loadLibrary]);

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            <ArrowLeft className="size-4" />
            Home
          </Link>
        </div>

        {isLoading && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <Loader2 className="size-8 animate-spin" />
            <p>Loading library…</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="font-medium text-destructive">{error}</p>
            <Button className="mt-4" variant="outline" onClick={() => void loadLibrary()}>
              Try again
            </Button>
          </div>
        )}

        {!isLoading && library && (
          <>
            <header className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {library.name}
              </h1>
              {library.description && (
                <p className="text-muted-foreground">{library.description}</p>
              )}
            </header>

            <SyncCodeDisplay syncCode={library.syncCode} />

            <section className="space-y-3">
              <h2 className="text-lg font-medium">Upload fonts</h2>
              <UploadZone
                libraryId={library.id}
                onUploaded={(updated) => setLibrary(updated)}
              />
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-medium">Your fonts</h2>
              <FontList
                libraryId={library.id}
                fonts={library.fonts}
                libraryName={library.name}
              />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
