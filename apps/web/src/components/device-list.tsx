"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError, clientApi } from "@/lib/api";
import { formatWhen, platformLabel } from "@/lib/format";
import { API_ERROR_CODES } from "@/lib/types";
import type { Device } from "@/lib/types";

interface DeviceListProps {
  libraryId: string;
  devices: Device[];
  syncEnabled: boolean;
  deviceCount: number;
  deviceLimit: number;
}

export function DeviceList({
  libraryId,
  devices,
  syncEnabled,
  deviceCount,
  deviceLimit,
}: DeviceListProps) {
  const router = useRouter();
  const [pending, setPending] = useState<Device | null>(null);
  const [removing, setRemoving] = useState(false);

  async function confirmRemove() {
    if (!pending) {
      return;
    }
    setRemoving(true);
    try {
      await clientApi(`/api/libraries/${libraryId}/devices/${pending.id}`, {
        method: "DELETE",
      });
      toast.success(`Removed ${pending.name}`);
      setPending(null);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.code === API_ERROR_CODES.deviceLimit) {
        toast.error(error.message);
      } else {
        toast.error(error instanceof Error ? error.message : "Could not remove device");
      }
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground tabular-nums">
        {deviceCount} of {deviceLimit} {deviceLimit === 1 ? "device" : "devices"}
      </p>

      {!syncEnabled ? (
        <div className="max-w-prose space-y-3">
          <p>
            Sync is off on this plan. Fonts stay in your library here until Pro
            is on.
          </p>
          <Link href="/plan" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
            See plans
          </Link>
        </div>
      ) : null}

      {devices.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-6 py-10">
          <p className="font-medium">No devices yet</p>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            Open the Typefolio app on your Mac. It will show up here after it
            signs in.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {devices.map((device) => (
            <li
              key={device.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{device.name}</p>
                <p className="text-sm text-muted-foreground">
                  {platformLabel(device.platform)} · last seen {formatWhen(device.lastSeenAt)}
                  {device.lastSyncAt
                    ? ` · synced ${formatWhen(device.lastSyncAt)}`
                    : " · not synced"}
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPending(device)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this device?</DialogTitle>
            <DialogDescription>
              {pending
                ? `${pending.name} will stop receiving this library. You can sign it in again later.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={removing}
              onClick={() => void confirmRemove()}
            >
              {removing ? "Removing…" : "Remove device"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
