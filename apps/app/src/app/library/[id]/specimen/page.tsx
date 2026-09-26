import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SpecimenStudio } from "@/components/specimen/specimen-studio";
import { buttonVariants } from "@/components/ui/button";
import { getSessionUserId } from "@typefolio/core/access";
import { groupFontsByFamily } from "@typefolio/core/font-families";
import { getLibraryById } from "@typefolio/core/storage";
import { cn } from "@typefolio/core/utils";

export const dynamic = "force-dynamic";

interface SpecimenPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readParam(
  value: string | string[] | undefined,
): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function SpecimenPage({
  params,
  searchParams,
}: SpecimenPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const userId = await getSessionUserId();

  if (!userId) {
    redirect("/auth/sign-in");
  }

  const library = await getLibraryById(id);
  if (!library || library.ownerUserId !== userId) {
    notFound();
  }

  const tab = readParam(query.tab);
  const validTab =
    tab === "waterfall" || tab === "compare" || tab === "glyphs"
      ? tab
      : undefined;

  const families = groupFontsByFamily(library.fonts);

  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit")}
          >
            <ArrowLeft className="size-4" />
            Home
          </Link>
          <p className="text-sm text-muted-foreground">{library.name}</p>
        </div>

        <SpecimenStudio
          libraryId={library.id}
          families={families}
          initialFamily={readParam(query.family)}
          initialFontId={readParam(query.font)}
          initialTab={validTab}
        />
      </main>
    </div>
  );
}