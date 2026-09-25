import Link from "next/link";
import { headers } from "next/headers";
import { Type } from "lucide-react";

import { SignOutButton } from "@/components/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { auth } from "@/lib/auth/server";
import { cn } from "@/lib/utils";

export async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Type className="size-4" />
          </span>
          <span>Typefolio</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {session?.user ? (
            <>
              <span className="hidden max-w-40 truncate text-sm text-muted-foreground sm:block">
                {session.user.name || session.user.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                Sign in
              </Link>
              <Link href="/auth/sign-up" className={cn(buttonVariants({ size: "sm" }))}>
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
