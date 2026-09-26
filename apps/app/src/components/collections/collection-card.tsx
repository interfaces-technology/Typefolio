import Link from "next/link";

import type { CollectionSummary } from "@typefolio/core/types";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CollectionCard({
  collection,
  dropActive,
}: {
  collection: CollectionSummary;
  dropActive?: boolean;
}) {
  return (
    <Link href={`/collections/${collection.slug}`} data-collection-slug={collection.slug}>
      <Card className={cn("min-h-44 transition-colors", dropActive && "ring-2 ring-ring")}>
        <CardHeader>
          <CardTitle>{collection.name}</CardTitle>
          <CardDescription>
            {collection.fontCount} fonts
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
