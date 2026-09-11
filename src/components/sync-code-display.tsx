"use client";

import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SyncCodeDisplayProps {
  syncCode: string;
}

export function SyncCodeDisplay({ syncCode }: SyncCodeDisplayProps) {
  const [copiedField, setCopiedField] = useState<"code" | "link" | null>(null);

  const syncUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/sync/${syncCode}`
      : `/sync/${syncCode}`;

  async function copy(value: string, field: "code" | "link") {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success(field === "code" ? "Sync code copied" : "Link copied");
      window.setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Could not copy to clipboard");
    }
  }

  return (
    <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Your sync code</p>
          <p className="text-xs text-muted-foreground">
            Share this code or link on another device to download these fonts.
          </p>
        </div>
        <Badge variant="secondary">Keep private</Badge>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <code className="rounded-lg bg-background px-4 py-3 text-center text-lg font-mono font-semibold tracking-widest sm:flex-1">
          {syncCode}
        </code>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => copy(syncCode, "code")}
          >
            {copiedField === "code" ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            Copy code
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => copy(syncUrl, "link")}
          >
            {copiedField === "link" ? (
              <Check className="size-4" />
            ) : (
              <Link2 className="size-4" />
            )}
            Copy link
          </Button>
        </div>
      </div>
    </div>
  );
}
