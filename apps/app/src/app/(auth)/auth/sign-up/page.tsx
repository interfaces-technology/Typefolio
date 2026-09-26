"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthCard } from "@/components/auth/auth-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <AuthCard title="Create account">
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          const result = await authClient.signUp.email({ email, password, name });
          if (result.error) {
            setError(result.error.message ?? "Could not create account.");
            return;
          }
          setError(null);
          setMessage("Check your email to verify your account.");
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>
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
        {message ? (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        <Button className="w-full" type="submit">
          Create account
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        <Link href="/auth/sign-in" className="underline">
          Already have an account
        </Link>
      </p>
    </AuthCard>
  );
}
