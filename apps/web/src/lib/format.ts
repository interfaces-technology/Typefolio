export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 MB";
  }
  const mb = bytes / (1024 * 1024);
  if (mb < 0.1) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}

export function formatGbp(amount: number): string {
  if (amount === 0) {
    return "£0";
  }
  const hasFraction = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatWhen(iso: string | undefined): string {
  if (!iso) {
    return "Not yet";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Not yet";
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

const PLATFORM_LABELS = {
  macos: "Mac",
  windows: "Windows",
  linux: "Linux",
  ios: "iPad",
} as const;

export function platformLabel(platform: string): string {
  if (platform in PLATFORM_LABELS) {
    return PLATFORM_LABELS[platform as keyof typeof PLATFORM_LABELS];
  }
  return platform;
}
