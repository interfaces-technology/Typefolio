"use client";

import { useState } from "react";
import { toast } from "sonner";

import { signOut } from "@/app/auth/sign-out/actions";
import { Button } from "@/components/ui/button";
import { deleteAccount } from "@typefolio/core/api";

export function DeleteAccountButton() {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "Delete your account? Your fonts and devices will be removed. This cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete account");
      setIsDeleting(false);
      return;
    }

    try {
      await signOut();
    } catch {
      window.location.assign("/");
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      disabled={isDeleting}
      onClick={() => void handleDelete()}
    >
      {isDeleting ? "Deleting account…" : "Delete account"}
    </Button>
  );
}
