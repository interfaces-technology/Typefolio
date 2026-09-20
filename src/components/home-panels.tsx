"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Columns2 } from "lucide-react";

import { FamilyTiles } from "@/components/family-tiles";
import { FontList } from "@/components/font-list";
import { UploadZone } from "@/components/upload-zone";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { groupFontsByFamily } from "@/lib/font-families";
import type { Library } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SignedInHomeProps {
  library: Library;
}

export function SignedInHome({ library: initialLibrary }: SignedInHomeProps) {
  const [library, setLibrary] = useState(initialLibrary);
  const families = useMemo(() => groupFontsByFamily(library.fonts), [library.fonts]);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Upload fonts</h2>
        <UploadZone onUploaded={setLibrary} />
      </section>

      {families.length > 0 ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium">Font families</h2>
            <Link
              href={`/library/${library.id}/specimen`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <Columns2 className="size-4" />
              Specimen studio
            </Link>
          </div>
          <FamilyTiles libraryId={library.id} families={families} />
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-lg font-medium">All fonts</h2>
        <FontList
          libraryId={library.id}
          fonts={library.fonts}
          canDelete
          onDeleted={(fontId) =>
            setLibrary({
              ...library,
              fonts: library.fonts.filter((font) => font.id !== fontId),
            })
          }
        />
      </section>
    </div>
  );
}

export function SignedOutHome() {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Sign in to upload</CardTitle>
        <CardDescription>
          Your fonts stay with your account. Sign in on any device to see them.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Link href="/auth/sign-up" className={cn(buttonVariants())}>
          Create account
        </Link>
        <Link
          href="/auth/sign-in"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Sign in
        </Link>
      </CardContent>
    </Card>
  );
}
