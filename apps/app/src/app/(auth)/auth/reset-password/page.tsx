"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const token = params.get("token") ?? "";

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await authClient.resetPassword({
          newPassword: password,
          token,
        });
        if (result.error) {
          setError(result.error.message ?? "Could not reset password.");
          return;
        }
        router.push("/auth/sign-in");
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <Button className="w-full" type="submit">
        Save password
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="New password">
      <Suspense>
        <ResetForm />
      </Suspense>
      <Link href="/auth/sign-in" className="text-sm underline">
        Back to sign in
      </Link>
    </AuthCard>
  );
}
