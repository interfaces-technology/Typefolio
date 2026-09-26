"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApiError, clientApi } from "@/lib/api";
import { API_ERROR_CODES, FONT_EXTENSIONS } from "@/lib/types";
import type { Library } from "@/lib/types";

interface UploadZoneProps {
  disabledReason?: string | null;
}

const acceptedTypes = FONT_EXTENSIONS.join(",");

export function UploadZone({ disabledReason }: UploadZoneProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const blocked = Boolean(disabledReason);

  async function handleFiles(fileList: FileList | null) {
    if (blocked || !fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList);
    setIsUploading(true);

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("fonts", file);
      }
      const result = await clientApi<{
        library: Library;
        added: number;
        updated: number;
        skipped: number;
        rejected: string[];
      }>("/api/fonts", { method: "POST", body: formData });

      if (result.added > 0) {
        toast.success(
          `Uploaded ${result.added} font${result.added === 1 ? "" : "s"}`,
        );
      } else if (result.updated > 0) {
        toast.success(
          `Updated ${result.updated} font${result.updated === 1 ? "" : "s"}`,
        );
      }

      if (result.rejected.length > 0) {
        toast.warning(`Skipped ${result.rejected.length} file(s)`, {
          description: result.rejected.join(", "),
        });
      }

      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.code === API_ERROR_CODES.storageLimit) {
        toast.error("That upload would pass your storage limit.", {
          description: "Remove a font or move to Pro.",
        });
      } else if (
        error instanceof ApiError &&
        error.code === API_ERROR_CODES.emailNotVerified
      ) {
        toast.error("Verify your email before uploading fonts.");
      } else {
        toast.error(error instanceof Error ? error.message : "Upload failed");
      }
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div
      className={`rounded-lg border border-dashed p-8 transition-colors ${
        isDragging && !blocked ? "border-primary bg-primary/5" : "border-border"
      } ${blocked ? "opacity-70" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        if (!blocked) {
          setIsDragging(true);
        }
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        void handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={acceptedTypes}
        multiple
        className="sr-only"
        disabled={blocked || isUploading}
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
        <p className="text-lg font-medium tracking-tight">
          {isUploading ? "Uploading fonts…" : "Drop font files"}
        </p>
        <p className="text-sm text-muted-foreground">
          {disabledReason ??
            "TTF, OTF, WOFF, and WOFF2. Up to 15 MB each."}
        </p>
        <Button
          type="button"
          disabled={blocked || isUploading}
          onClick={() => inputRef.current?.click()}
        >
          {isUploading ? "Uploading…" : "Choose files"}
        </Button>
      </div>
    </div>
  );
}
