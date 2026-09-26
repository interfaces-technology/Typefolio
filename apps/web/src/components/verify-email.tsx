"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function VerifyEmail({ email }: { email: string }) {
  const [pending, setPending] = useState(false);

  async function resend() {
    setPending(true);
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: "/",
    });
    setPending(false);
    if (error) {
      toast.error(error.message || "Could not send the verification email.");
      return;
    }
    toast.success("Verification email sent.");
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="max-w-prose text-sm">
        Verify {email} before uploading. Check your inbox for the link.
      </p>
      <Button type="button" variant="outline" disabled={pending} onClick={() => void resend()}>
        {pending ? "Sending…" : "Resend email"}
      </Button>
    </div>
  );
}
