"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/client";
import { signInWithEmail } from "./actions";

export default function SignInPage() {
  const [state, formAction, isPending] = useActionState(signInWithEmail, null);

  async function handleGoogle() {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10 sm:px-6">
        <Card>
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>
              Access your font libraries from any device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={formAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@studio.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <div className="relative py-1 text-center text-xs text-muted-foreground">
              <span className="bg-card px-2">or</span>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void handleGoogle()}
            >
              Continue with Google
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link href="/auth/sign-up" className="font-medium text-foreground underline-offset-4 hover:underline">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
