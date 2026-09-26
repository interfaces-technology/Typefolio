"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { clientApi } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import type { FontFile } from "@/lib/types";

export function FontFiles({
  libraryId,
  fonts,
}: {
  libraryId: string;
  fonts: FontFile[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState<FontFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!pending) {
      return;
    }
    setDeleting(true);
    try {
      await clientApi(`/api/libraries/${libraryId}/fonts/${pending.id}`, {
        method: "DELETE",
      });
      toast.success(`Deleted ${pending.originalName}`);
      setPending(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete font");
    } finally {
      setDeleting(false);
    }
  }

  if (fonts.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-base font-medium">Files</h2>
      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {fonts.map((font) => (
          <li
            key={font.id}
            className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{font.originalName}</p>
              <p className="text-sm text-muted-foreground tabular-nums">
                {font.familyName}
                {font.styleName ? ` · ${font.styleName}` : ""} ·{" "}
                {font.extension.replace(".", "").toUpperCase()} · {formatBytes(font.size)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <a
                href={`/api/libraries/${libraryId}/fonts/${font.id}`}
                download={font.originalName}
                className="inline-flex h-11 items-center rounded-md px-3 text-sm text-foreground hover:bg-muted"
              >
                Download
              </a>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPending(font)}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this font?</DialogTitle>
            <DialogDescription>
              {pending
                ? `${pending.originalName} will leave this library and any device that synced it.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void confirmDelete()}
            >
              {deleting ? "Deleting…" : "Delete font"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
