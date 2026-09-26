"use client";

import Link from "next/link";
import { HeartIcon, MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import { toggleFamilyFavorite } from "@typefolio/core/api";
import type { FontFamilyGroup } from "@typefolio/core/types";

import { FontPreview } from "@/components/fonts/font-preview";
import { useLibrary } from "@/components/library/library-provider";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/format";

export function FontCard({
  family,
  selected,
  onSelect,
}: {
  family: FontFamilyGroup;
  selected?: boolean;
  onSelect?: (slug: string, additive: boolean) => void;
}) {
  const { library, refresh } = useLibrary();
  const slug = family.slug ?? family.familyName;
  const preview = family.fonts[0];

  return (
    <Card
      draggable
      onDragStart={(event) => {
        if (family.id) {
          event.dataTransfer.setData("text/family-id", family.id);
        }
      }}
      className={cn("overflow-hidden", selected && "ring-2 ring-ring")}
    >
      <CardHeader>
        <CardTitle className="text-xs font-normal text-muted-foreground">
          {family.version ?? "—"}
        </CardTitle>
        <CardAction className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={family.favoritedAt ? "Remove from favorites" : "Save"}
            onClick={async (event) => {
              event.preventDefault();
              if (!library || !family.slug) return;
              try {
                await toggleFamilyFavorite(library.id, family.slug);
                toast(family.favoritedAt ? "Removed" : "Saved");
                await refresh();
              } catch {
                toast.error("Could not save.");
              }
            }}
          >
            <HeartIcon className={family.favoritedAt ? "fill-current" : undefined} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Select font"
            onClick={(event) => {
              event.preventDefault();
              onSelect?.(slug, event.shiftKey);
            }}
          >
            <MoreHorizontalIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Link href={`/fonts/${slug}`}>
          <FontPreview
            libraryId={library?.id ?? ""}
            font={preview}
            text="AaBbCc"
            className="mb-6 text-5xl leading-none tracking-tight"
          />
          <h3 className="font-medium">{family.familyName}</h3>
        </Link>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        {family.foundry ?? "Unknown foundry"} · {family.styleCount} styles ·{" "}
        {formatBytes(family.totalSize ?? 0)}
      </CardFooter>
    </Card>
  );
}
