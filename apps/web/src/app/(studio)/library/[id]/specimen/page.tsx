import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SpecimenStudio } from "@/components/specimen/specimen-studio";
import { getFamilies, getMe } from "@/lib/api-server";

export const dynamic = "force-dynamic";

interface SpecimenPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function SpecimenPage({
  params,
  searchParams,
}: SpecimenPageProps) {
  const me = await getMe();
  if (!me) {
    redirect("/auth/sign-in");
  }

  const { id } = await params;
  if (id !== me.library.id) {
    notFound();
  }

  const query = await searchParams;
  const families = await getFamilies(id);
  const tab = readParam(query.tab);
  const initialTab =
    tab === "waterfall" || tab === "compare" || tab === "glyphs" || tab === "specimen"
      ? tab
      : "specimen";

  return (
    <main className="flex flex-1 flex-col gap-6">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-[1.75rem] font-semibold">Specimen</h1>
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
          Back to library
        </Link>
      </div>
      {families.families.length === 0 ? (
        <p className="max-w-prose text-muted-foreground">
          Upload a font before opening the specimen studio.
        </p>
      ) : (
        <SpecimenStudio
          libraryId={id}
          families={families.families}
          initialFamily={readParam(query.family)}
          initialFontId={readParam(query.font)}
          initialTab={initialTab}
          compareEnabled={me.entitlement.features.compare}
        />
      )}
    </main>
  );
}
