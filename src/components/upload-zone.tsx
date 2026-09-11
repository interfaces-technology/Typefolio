"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FONT_EXTENSIONS } from "@/lib/types";
import { uploadFonts } from "@/lib/api";
import type { Library } from "@/lib/types";

interface UploadZoneProps {
  onUploaded: (library: Library) => void;
}

const acceptedTypes = FONT_EXTENSIONS.join(",");

export function UploadZone({ onUploaded }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) {
      return;
    }

    const files = Array.from(fileList);
    setIsUploading(true);

    try {
      const result = await uploadFonts(files);
      onUploaded(result.library);

      if (result.added > 0) {
        toast.success(
          `Uploaded ${result.added} font${result.added === 1 ? "" : "s"}`,
        );
      }

      if (result.rejected.length > 0) {
        toast.warning(`Skipped ${result.rejected.length} file(s)`, {
          description: result.rejected.join(", "),
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload failed";
      toast.error(message);
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-6 transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/30"
      }`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
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
        className="hidden"
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          {isUploading ? (
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="size-5 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="font-medium">
            {isUploading ? "Uploading fonts…" : "Drop font files here"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Supports TTF, OTF, WOFF, and WOFF2 · up to 20 files, 15 MB each
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
        >
          Choose files
        </Button>
      </div>
    </div>
  );
}
