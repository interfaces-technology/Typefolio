"use client";

import { useState } from "react";
import { toast } from "sonner";

import { removeDevice } from "@/app/account/actions";
import { Button } from "@/components/ui/button";
import type { Device, DevicePlatform } from "@typefolio/core/types";

const platformLabels: Record<DevicePlatform, string> = {
  macos: "Mac",
  ios: "iPad",
  windows: "Windows",
  linux: "Linux",
};

interface DeviceListProps {
  libraryId: string;
  devices: Device[];
}

export function DeviceList({ libraryId, devices }: DeviceListProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleRemove(device: Device) {
    const confirmed = window.confirm(`Remove ${device.name} from this account?`);
    if (!confirmed) {
      return;
    }

    setPendingId(device.id);
    const formData = new FormData();
    formData.set("libraryId", libraryId);
    formData.set("deviceId", device.id);

    try {
      const result = await removeDevice(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Removed ${device.name}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove device");
    } finally {
      setPendingId(null);
    }
  }

  if (devices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
        No devices yet. The Mac and iPad apps register themselves when you sign
        in. This website does not use a device seat.
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-xl border bg-card">
      {devices.map((device) => (
        <li
          key={device.id}
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="truncate font-medium">{device.name}</p>
            <p className="text-sm text-muted-foreground">
              {platformLabels[device.platform]} · Last seen{" "}
              {new Date(device.lastSeenAt).toLocaleString()}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pendingId === device.id}
            onClick={() => void handleRemove(device)}
          >
            {pendingId === device.id ? "Removing…" : "Remove"}
          </Button>
        </li>
      ))}
    </ul>
  );
}
