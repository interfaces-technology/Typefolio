"use client";

import { useMemo } from "react";

import { FontCard } from "@/components/fonts/font-card";
import { useLibrary } from "@/components/library/library-provider";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { formatCount } from "@/lib/format";

export default function FavoritesPage() {
  const { families } = useLibrary();
  const savedFonts = useMemo(
    () => families.filter((family) => family.favoritedAt),
    [families],
  );

  return (
    <div>
      <PageHeader title="Favorites" meta={formatCount(savedFonts.length, "saved font")} />
      {savedFonts.length === 0 ? (
        <EmptyState title="No saved fonts" body="Tap the heart on a typeface to keep it here." />
      ) : (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          {savedFonts.map((family) => (
            <FontCard key={family.id} family={family} />
          ))}
        </div>
      )}
    </div>
  );
}
