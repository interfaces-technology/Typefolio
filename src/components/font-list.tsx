"use client";

import { Download, FileType2 } from "lucide-react";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/font-validation";
import type { FontFile } from "@/lib/types";

interface FontListProps {
  libraryId: string;
  fonts: FontFile[];
  showDownloadAll?: boolean;
  libraryName?: string;
}

export function FontList({
  libraryId,
  fonts,
  showDownloadAll = true,
  libraryName,
}: FontListProps) {
  if (fonts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <FileType2 className="mx-auto mb-3 size-8 text-muted-foreground" />
        <p className="font-medium">No fonts yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload .ttf, .otf, .woff, or .woff2 files to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showDownloadAll && (
        <div className="flex justify-end">
          <a
            href={`/api/libraries/${libraryId}/download`}
            download
            className={cn(buttonVariants())}
          >
            <Download className="size-4" />
            Download all as ZIP
          </a>
        </div>
      )}

      <ul className="divide-y rounded-xl border bg-card">
        {fonts.map((font) => (
          <li
            key={font.id}
            className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{font.originalName}</p>
              <p className="text-sm text-muted-foreground">
                {font.extension.replace(".", "").toUpperCase()} ·{" "}
                {formatFileSize(font.size)}
              </p>
            </div>
            <a
              href={`/api/libraries/${libraryId}/fonts/${font.id}`}
              download={font.originalName}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
            >
              <Download className="size-4" />
              Download
            </a>
          </li>
        ))}
      </ul>

      {libraryName && (
        <p className="text-xs text-muted-foreground">
          {fonts.length} font{fonts.length === 1 ? "" : "s"} in {libraryName}
        </p>
      )}
    </div>
  );
}
