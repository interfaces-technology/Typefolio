"use client";

import { useEffect, useState } from "react";

import { useLibrary } from "@/components/library/library-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import type { ShareLink } from "@typefolio/core/types";

export default function SharedPage() {
  const { library } = useLibrary();
  const [shares, setShares] = useState<ShareLink[]>([]);

  useEffect(() => {
    if (!library) return;
    fetch(`/api/libraries/${library.id}/share`, { credentials: "include" })
      .then((response) => response.json())
      .then((data: { shares?: ShareLink[] }) => setShares(data.shares ?? []))
      .catch(() => setShares([]));
  }, [library]);

  return (
    <div>
      <PageHeader title="Shared" description="Links you have created." />
      {shares.length === 0 ? (
        <EmptyState title="Nothing shared" body="Create a link from a font detail page." />
      ) : (
        <Card>
          <CardContent className="divide-y">
            {shares.map((share) => (
              <div key={share.id} className="flex items-center justify-between py-4 text-sm">
                <span>
                  {share.resourceType} / {share.resourceId}
                </span>
                <Button variant="ghost" size="sm" asChild>
                  <a href={share.url}>Open</a>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
