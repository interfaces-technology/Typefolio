"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <AuthCard title="Reset password">
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          await fetch("/api/auth/forget-password", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              redirectTo: "/auth/reset-password",
            }),
          });
          setMessage("If that account exists, we sent a reset link.");
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        {message ? (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        <Button className="w-full" type="submit">
          Send link
        </Button>
      </form>
      <Link href="/auth/sign-in" className="text-sm underline">
        Back to sign in
      </Link>
    </AuthCard>
  );
}
