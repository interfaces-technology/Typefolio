"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Component, Scan, Settings2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { specimenStyle, loadSpecimenFont } from "@/lib/specimen";
import type { FontFamilyGroup, FontFile } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FamilyTilesProps {
  libraryId: string;
  families: FontFamilyGroup[];
}

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

function FamilyTile({
  libraryId,
  family,
}: {
  libraryId: string;
  family: FontFamilyGroup;
}) {
  const cover = family.fonts[0];
  const ready = useFontCover(libraryId, cover);
  const stale = family.fonts.filter((font) => font.weight !== undefined);
  const variants = family.fonts.length;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <Link
        href={`/library/${libraryId}/specimen?family=${encodeURIComponent(
          family.familyName,
        )}`}
        className="group border-b bg-slate-50 px-5 pb-6 pt-8 transition-colors hover:bg-slate-100"
      >
        <p
          aria-hidden
          className={cn(
            "select-none truncate text-4xl leading-tight text-slate-900",
            !ready && "font-sans",
          )}
          style={ready && cover ? specimenStyle(cover) : undefined}
        >
          Aa
        </p>
        <p
          className={cn(
            "mt-3 truncate text-sm text-slate-500",
            !ready && "font-sans",
          )}
          style={ready && cover ? specimenStyle(cover) : undefined}
        >
          {family.familyName}
        </p>
      </Link>

      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {stale.slice(0, 4).map((font) => (
            <span
              key={font.id}
              className="rounded-full border bg-background px-2 py-0.5 text-xs text-muted-foreground"
            >
              {font.weight}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/library/${libraryId}/specimen?family=${encodeURIComponent(
              family.familyName,
            )}`}
            className={cn(buttonVariants({ size: "sm" }), "flex-1")}
          >
            <Settings2 className="size-4" />
            Preview
          </Link>
          <Link
            href={`/library/${libraryId}/specimen?family=${encodeURIComponent(
              family.familyName,
            )}&tab=glyphs`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            aria-label={`Glyph map for ${family.familyName}`}
          >
            <Scan className="size-4" />
          </Link>
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Component className="size-3.5" />
            {variants} {variants === 1 ? "style" : "styles"}
          </span>
        </div>
      </div>
    </article>
  );
}

export function FamilyTiles({ libraryId, families }: FamilyTilesProps) {
  if (families.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {families.map((family) => (
        <FamilyTile key={family.familyName} libraryId={libraryId} family={family} />
      ))}
    </div>
  );
}