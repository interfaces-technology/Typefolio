"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeSyncCode } from "@/lib/sync-code";

export function SyncCodeForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeSyncCode(code);

    if (!normalized) {
      toast.error("Enter a sync code");
      return;
    }

    setIsSubmitting(true);
    router.push(`/sync/${normalized}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="sync-code">Sync code</Label>
        <Input
          id="sync-code"
          placeholder="FONT-ABCD-1234"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          className="font-mono tracking-wider"
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs text-muted-foreground">
          Paste the code from your other device, or open the shared link directly.
        </p>
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Opening…
          </>
        ) : (
          <>
            Open library
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>
    </form>
  );
}
