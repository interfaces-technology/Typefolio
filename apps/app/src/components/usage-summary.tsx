"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatFileSize } from "@typefolio/core/font-validation";
import type { Entitlement } from "@typefolio/core/types";

interface UsageSummaryProps {
  entitlement: Entitlement;
  showAccountLink?: boolean;
}

function meterWidth(used: number, limit: number): string {
  if (limit <= 0) {
    return "0%";
  }

  const percent = Math.min(100, Math.round((used / limit) * 100));
  return `${percent}%`;
}

export function UsageSummary({
  entitlement,
  showAccountLink = true,
}: UsageSummaryProps) {
  const planLabel = entitlement.plan === "pro" ? "Pro" : "Free";

  return (
    <section className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">Plan</h2>
          <Badge variant={entitlement.plan === "pro" ? "default" : "secondary"}>
            {planLabel}
          </Badge>
          {entitlement.isLaunchPricing ? (
            <Badge variant="outline">Launch pricing</Badge>
          ) : null}
        </div>
        {showAccountLink ? (
          <Link href="/account" className="text-sm font-medium text-primary hover:underline">
            Account
          </Link>
        ) : null}
      </div>

      {entitlement.features.sync ? (
        <p className="text-sm text-muted-foreground">
          Auto-sync is on for the Mac and iPad apps.
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          Auto-sync is a Pro feature.{" "}
          <Link href="/account" className="font-medium text-foreground hover:underline">
            View plans
          </Link>
        </p>
      )}

      <UsageMeter
        label="Storage"
        value={`${formatFileSize(entitlement.storageUsedBytes)} of ${formatFileSize(entitlement.storageLimitBytes)}`}
        width={meterWidth(entitlement.storageUsedBytes, entitlement.storageLimitBytes)}
      />
      <UsageMeter
        label="Devices"
        value={`${entitlement.deviceCount} of ${entitlement.deviceLimit}`}
        width={meterWidth(entitlement.deviceCount, entitlement.deviceLimit)}
      />
    </section>
  );
}

function UsageMeter({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  width: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width }} />
      </div>
    </div>
  );
}
