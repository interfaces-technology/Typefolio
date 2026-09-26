import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6">
      <Card>
        <CardHeader>
          <CardDescription>
            <Link href="/auth/sign-in" className="hover:underline">
              Typefolio
            </Link>
          </CardDescription>
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {children}
          {footer}
        </CardContent>
      </Card>
    </main>
  );
}
