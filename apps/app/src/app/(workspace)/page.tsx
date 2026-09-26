"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CollectionCard } from "@/components/collections/collection-card";
import { FontCard } from "@/components/fonts/font-card";
import { useLibrary } from "@/components/library/library-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, ErrorState, SkeletonBlock } from "@/components/ui/feedback";
import { formatCount, greeting, relativeTime } from "@/lib/format";

export default function HomePage() {
  const { status, error, refresh, families, collections, devices } = useLibrary();
  const [hello, setHello] = useState("Welcome");

  useEffect(() => {
    setHello(greeting());
  }, []);

  if (status === "loading") {
    return (
      <div className="grid gap-6">
        <SkeletonBlock className="h-24" />
        <SkeletonBlock className="h-64" />
      </div>
    );
  }

  if (status === "error") {
    return <ErrorState body={error ?? "We couldn't load your library."} onRetry={() => void refresh()} />;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">{hello}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Your type library</h1>
        <p className="text-sm text-muted-foreground">
          {formatCount(families.length, "font")} · {formatCount(collections.length, "collection")} ·{" "}
          {formatCount(devices.length, "device")}
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-medium">Recently added</h2>
        {families.length === 0 ? (
          <EmptyState
            title="No fonts yet"
            body="Your library is waiting for its first typeface."
            action={{ label: "Add font", onClick: () => (window.location.href = "/fonts") }}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {families.slice(0, 6).map((family) => (
              <FontCard key={family.id ?? family.familyName} family={family} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Collections</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/collections">View all</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {collections.slice(0, 4).map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </div>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Sync</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              {devices.length === 0
                ? "No devices yet"
                : devices.every((device) => device.lastSyncAt)
                  ? "All devices synced"
                  : "Waiting for a device"}
            </p>
            <ul className="space-y-2 text-sm">
              {devices.map((device) => (
                <li key={device.id}>
                  <p>{device.name}</p>
                  <p className="text-muted-foreground">{relativeTime(device.lastSyncAt)}</p>
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" asChild>
              <Link href="/devices">View devices</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
