import { formatBytes } from "@/lib/format";

interface StorageMeterProps {
  usedBytes: number;
  limitBytes: number;
  plan: string;
}

export function StorageMeter({ usedBytes, limitBytes, plan }: StorageMeterProps) {
  const ratio = limitBytes > 0 ? Math.min(1, usedBytes / limitBytes) : 0;
  const full = usedBytes >= limitBytes && limitBytes > 0;

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <p className="tabular-nums">
          <span className="text-lg font-semibold tracking-tight">
            {formatBytes(usedBytes)}
          </span>
          <span className="text-muted-foreground"> of {formatBytes(limitBytes)}</span>
        </p>
        <p className="text-muted-foreground">
          {plan === "pro" ? "Pro" : "Free"}
          {full ? " · storage full" : ""}
        </p>
      </div>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-foreground/10"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={limitBytes}
        aria-valuenow={usedBytes}
        aria-label="Storage used"
      >
        <div
          className="h-full bg-primary"
          style={{ width: `${Math.max(ratio * 100, usedBytes > 0 ? 2 : 0)}%` }}
        />
      </div>
    </div>
  );
}
