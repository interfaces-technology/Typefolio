"use client";

import { useLibrary } from "@/components/library/library-provider";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { formatClock } from "@/lib/format";

export default function ActivityPage() {
  const { status, error, refresh, activity } = useLibrary();

  if (status === "error") {
    return <ErrorState body={error ?? "We couldn't load activity."} onRetry={() => void refresh()} />;
  }

  return (
    <div>
      <PageHeader title="Activity" meta="Sync timeline" />
      {activity.length === 0 ? (
        <EmptyState title="No activity yet" body="Uploads and syncs will appear here." />
      ) : (
        <Card>
          <CardContent className="divide-y">
            {activity.map((event) => (
              <div key={event.id} className="flex gap-8 py-4 text-sm">
                <span className="w-24 text-muted-foreground">
                  {formatClock(event.occurredAt)}
                </span>
                <span>
                  {event.itemName} {event.action}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
