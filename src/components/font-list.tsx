"use client";

import { Download, FileType2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { buttonVariants, Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/font-validation";
import { deleteFont, fontDownloadPath, libraryZipPath } from "@/lib/api";
import type { FontFile } from "@/lib/types";

interface FontListProps {
  libraryId: string;
  fonts: FontFile[];
  showDownloadAll?: boolean;
  canDelete?: boolean;
  onDeleted?: (fontId: string) => void;
}

export function FontList({
  libraryId,
  fonts,
  showDownloadAll = true,
  canDelete = false,
  onDeleted,
}: FontListProps) {
  async function handleDelete(font: FontFile) {
    const confirmed = window.confirm(`Delete ${font.originalName}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteFont(libraryId, font.id);
      toast.success(`Deleted ${font.originalName}`);
      onDeleted?.(font.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete font");
    }
  }

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
            href={libraryZipPath(libraryId)}
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
            <div className="flex shrink-0 gap-2">
              <a
                href={fontDownloadPath(libraryId, font.id)}
                download={font.originalName}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                <Download className="size-4" />
                Download
              </a>
              {canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => void handleDelete(font)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
