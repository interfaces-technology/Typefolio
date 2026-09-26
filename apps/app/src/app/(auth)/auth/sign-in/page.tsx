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

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const result = await authClient.signIn.email({ email, password });
        if (result.error) {
          setError(result.error.message ?? "Could not sign in.");
          return;
        }
        router.push(params.get("next") || "/");
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@studio.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
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
        Sign in
      </Button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <AuthCard title="Sign in">
      <Suspense>
        <SignInForm />
      </Suspense>
      <p className="text-sm text-muted-foreground">
        <Link href="/auth/forgot-password" className="underline">
          Forgot password
        </Link>
        {" · "}
        <Link href="/auth/sign-up" className="underline">
          Create an account
        </Link>
      </p>
    </AuthCard>
  );
}
