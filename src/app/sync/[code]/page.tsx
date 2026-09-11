"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";

import { FontList } from "@/components/font-list";
import { SiteHeader } from "@/components/site-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { fetchLibraryBySyncCode } from "@/lib/api";
import { normalizeSyncCode } from "@/lib/sync-code";
import type { Library } from "@/lib/types";

export default function SyncPage() {
  const params = useParams<{ code: string }>();
  const [library, setLibrary] = useState<Library | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadLibrary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const code = normalizeSyncCode(params.code);

    try {
      const data = await fetchLibraryBySyncCode(code);
      setLibrary(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not open library";
      setError(message);
      setLibrary(null);
    } finally {
      setIsLoading(false);
    }
  }, [params.code]);

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
            <p>Looking up sync code…</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
            <p className="font-medium text-destructive">{error}</p>
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
        )}

        {!isLoading && library && (
          <>
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
            />
          </>
        )}
      </main>
    </div>
  );
}
