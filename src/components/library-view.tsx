"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { FontList } from "@/components/font-list";
import { SyncCodeDisplay } from "@/components/sync-code-display";
import { UploadZone } from "@/components/upload-zone";
import { Button } from "@/components/ui/button";
import { deleteLibrary } from "@/lib/api";
import type { Library } from "@/lib/types";

interface LibraryViewProps {
  library: Library;
}

export function LibraryView({ library: initialLibrary }: LibraryViewProps) {
  const router = useRouter();
  const [library, setLibrary] = useState(initialLibrary);

  async function handleDeleteLibrary() {
    const confirmed = window.confirm(
      `Delete “${library.name}” and all of its fonts?`,
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteLibrary(library.id);
      toast.success("Library deleted");
      router.push("/");
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete library",
      );
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => void handleDeleteLibrary()}
        >
          <Trash2 className="size-4" />
          Delete library
        </Button>
      </div>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {library.name}
        </h1>
        {library.description && (
          <p className="text-muted-foreground">{library.description}</p>
        )}
      </header>

      <SyncCodeDisplay syncCode={library.syncCode} />

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Upload fonts</h2>
        <UploadZone
          libraryId={library.id}
          onUploaded={(updated) => setLibrary(updated)}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Your fonts</h2>
        <FontList
          libraryId={library.id}
          fonts={library.fonts}
          libraryName={library.name}
          canDelete
          onDeleted={(fontId) =>
            setLibrary({
              ...library,
              fonts: library.fonts.filter((font) => font.id !== fontId),
            })
          }
        />
      </section>
    </>
  );
}
