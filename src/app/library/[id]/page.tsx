import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { SignedInHome } from "@/components/home-panels";
import { buttonVariants } from "@/components/ui/button";
import { getSessionUserId } from "@/lib/access";
import { getLibraryById } from "@/lib/storage";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface LibraryPageProps {
  params: Promise<{ id: string }>;
}

export default async function LibraryPage({ params }: LibraryPageProps) {
  const { id } = await params;
  const userId = await getSessionUserId();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  const library = await getLibraryById(id);
  if (!library) {
    notFound();
  }

  if (library.ownerUserId !== userId) {
    return (
      <div className="flex min-h-full flex-col">
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit")}
          >
            <ArrowLeft className="size-4" />
            Home
          </Link>
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
          <p className="font-medium text-destructive">
            You do not have access to these fonts.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with the account that uploaded them.
          </p>
        </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit")}
        >
          <ArrowLeft className="size-4" />
          Home
        </Link>
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{library.name}</h1>
          {library.description ? (
            <p className="text-muted-foreground">{library.description}</p>
          ) : null}
        </header>
        <SignedInHome library={library} />
      </main>
    </div>
  );
}
