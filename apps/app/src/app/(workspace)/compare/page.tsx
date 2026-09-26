"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { FontPreview } from "@/components/fonts/font-preview";
import { useLibrary } from "@/components/library/library-provider";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";

function CompareInner() {
  const params = useSearchParams();
  const { families, library } = useLibrary();
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean).slice(0, 4);
  const selected = ids
    .map((slug) => families.find((family) => family.slug === slug))
    .filter(Boolean);

  if (selected.length < 2) {
    return (
      <EmptyState
        title="Select fonts to compare"
        body="Choose two to four typefaces from the library."
      />
    );
  }

  return (
    <div>
      <PageHeader title="Compare" meta={`${selected.length} typefaces`} />
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selected.length}, minmax(0, 1fr))` }}>
        {selected.map((family) =>
          family ? (
            <Card key={family.id}>
              <CardHeader>
                <Badge variant="outline">{family.classification ?? "Typeface"}</Badge>
                <CardTitle>{family.familyName}</CardTitle>
              </CardHeader>
              <CardContent>
                <FontPreview
                  libraryId={library?.id ?? ""}
                  font={family.fonts[0]}
                  text="AaBbCc"
                  className="text-5xl leading-none"
                />
                <p className="mt-6 text-sm leading-6">
                  The quick brown fox jumps over the lazy dog.
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  {family.styleCount} styles · {family.foundry ?? "Unknown foundry"}
                </p>
              </CardContent>
            </Card>
          ) : null,
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense>
      <CompareInner />
    </Suspense>
  );
}
