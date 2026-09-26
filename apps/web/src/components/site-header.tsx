"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "@/components/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

const LINKS = [
  { href: "/", label: "Library" },
  { href: "/devices", label: "Devices" },
  { href: "/plan", label: "Plan" },
] as const;

interface SiteHeaderProps {
  email?: string | null;
  plan?: string | null;
}

export function SiteHeader({ email, plan }: SiteHeaderProps) {
  const pathname = usePathname();
  const signedIn = Boolean(email);

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight text-foreground">
          Typefolio
        </Link>

        {signedIn ? (
          <nav className="flex items-center gap-1" aria-label="Library">
            {LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/" || pathname.startsWith("/library")
                  : pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-11 items-center rounded-md px-3 text-sm",
                    active
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          {signedIn ? (
            <>
              <Link
                href="/account"
                className="hidden h-11 max-w-48 items-center truncate text-sm text-muted-foreground hover:text-foreground sm:inline-flex"
              >
                {email}
                {plan === "pro" ? (
                  <span className="ml-2 text-xs font-medium text-primary">Pro</span>
                ) : null}
              </Link>
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
