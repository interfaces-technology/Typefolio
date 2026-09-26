"use client";

import Link from "next/link";
import { MonitorIcon, SmartphoneIcon, TabletIcon } from "lucide-react";

import { useLibrary } from "@/components/library/library-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/ui/feedback";
import { PageHeader } from "@/components/ui/page-header";
import { formatClock, formatCount, relativeTime } from "@/lib/format";

function iconFor(platform: string) {
  if (platform === "ios") return SmartphoneIcon;
  if (platform === "macos") return TabletIcon;
  return MonitorIcon;
}

function deviceState(lastSyncAt?: string, lastSeenAt?: string) {
  if (!lastSeenAt) return "Needs attention";
  const seen = Date.now() - new Date(lastSeenAt).getTime();
  if (seen > 1000 * 60 * 60 * 24 * 7) return "Offline";
  if (!lastSyncAt) return "Syncing";
  return "Connected";
}

export default function DevicesPage() {
  const { status, error, refresh, devices, families, activity } = useLibrary();

  if (status === "error") {
    return <ErrorState body={error ?? "We couldn't load devices."} onRetry={() => void refresh()} />;
  }

  return (
    <div>
      <PageHeader
        title="Devices"
        meta={formatCount(devices.length, "device")}
        description="Where Typefolio is installed and synchronised."
      />
      {devices.length === 0 ? (
        <EmptyState
          title="No devices yet"
          body="Install Typefolio on a Mac or iPad to start syncing."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {devices.map((device) => {
            const Icon = iconFor(device.platform);
            const state = deviceState(device.lastSyncAt, device.lastSeenAt);
            return (
              <Card key={device.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icon className="size-4" />
                    {device.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant={state === "Connected" ? "secondary" : "outline"}>{state}</Badge>
                  <p className="text-sm text-muted-foreground">
                    {formatCount(families.length, "font")} · Last synced {relativeTime(device.lastSyncAt)}
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/fonts">View fonts</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <section className="mt-10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Sync activity</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/activity">View all</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="divide-y pt-0">
            {activity.slice(0, 8).map((event) => (
              <div key={event.id} className="flex gap-6 py-3 text-sm">
                <span className="w-16 text-muted-foreground">
                  {formatClock(event.occurredAt)}
                </span>
                <span>
                  {event.itemName} {event.action}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
