import Link from "next/link";

import { CreateLibraryForm } from "@/components/create-library-form";
import { SyncCodeForm } from "@/components/sync-code-form";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { LibrarySummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SignedInHomeProps {
  libraries: LibrarySummary[];
}

export function SignedInHome({ libraries }: SignedInHomeProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your libraries</CardTitle>
            <CardDescription>
              Fonts you upload are stored in the cloud and available on any
              device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {libraries.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No libraries yet. Create one to start uploading fonts.
              </p>
            )}
            {libraries.length > 0 && (
              <ul className="divide-y rounded-xl border">
                {libraries.map((library) => (
                  <li key={library.id}>
                    <Link
                      href={`/library/${library.id}`}
                      className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{library.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {library.fontCount} font
                          {library.fontCount === 1 ? "" : "s"} · {library.syncCode}
                        </p>
                      </div>
                      <span className="text-sm text-muted-foreground">Open</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New font library</CardTitle>
            <CardDescription>
              Name your set — for example &quot;Work fonts&quot; or &quot;Brand
              A&quot; — then upload files on the next screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateLibraryForm />
          </CardContent>
        </Card>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Open a shared library</CardTitle>
          <CardDescription>
            Enter a sync code to view and download someone else&apos;s fonts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SyncCodeForm />
        </CardContent>
      </Card>
    </div>
  );
}

export function SignedOutHome() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Your libraries</CardTitle>
          <CardDescription>
            Sign in to create libraries and keep fonts in the cloud.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/auth/sign-up" className={cn(buttonVariants())}>
            Create account
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Have a sync code?</CardTitle>
          <CardDescription>
            You can still open a shared library without an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SyncCodeForm />
        </CardContent>
      </Card>
    </div>
  );
}
