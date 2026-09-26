"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { loadSpecimenFont, specimenStyle } from "@/lib/specimen";
import type { FontFamilyGroup, FontFile } from "@/lib/types";
import { cn } from "cn";

function useFontCover(libraryId: string, font: FontFile | undefined) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!font) {
      return;
    }
    let cancelled = false;
    loadSpecimenFont(libraryId, font)
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [libraryId, font]);

  return ready;
}

function FamilyCard({
  libraryId,
  family,
}: {
  libraryId: string;
  family: FontFamilyGroup;
}) {
  const cover = family.fonts[0];
  const ready = useFontCover(libraryId, cover);
  const styles = family.styleCount || family.fonts.length;
  const href = `/library/${libraryId}/specimen?family=${encodeURIComponent(family.familyName)}`;

  return (
    <Link
      href={href}
      className="group flex min-h-36 flex-col justify-between rounded-lg border border-border bg-card px-4 py-4 hover:border-foreground/25"
    >
      <p
        className={cn(
          "truncate text-[1.75rem] leading-none tracking-tight text-foreground",
          !ready && "font-sans",
        )}
        style={ready && cover ? specimenStyle(cover) : undefined}
      >
        {family.familyName}
      </p>
      <p className="mt-4 text-xs text-muted-foreground tabular-nums">
        {styles} {styles === 1 ? "style" : "styles"}
      </p>
    </Link>
  );
}

export function FamilyGrid({
  libraryId,
  families,
}: {
  libraryId: string;
  families: FontFamilyGroup[];
}) {
  if (families.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {families.map((family) => (
        <FamilyCard
          key={family.familyName}
          libraryId={libraryId}
          family={family}
        />
      ))}
    </div>
  );
}
