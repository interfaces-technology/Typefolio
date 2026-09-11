import Link from "next/link";
import { Type } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="border-b bg-card/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Type className="size-4" />
          </span>
          <span>syncFont</span>
        </Link>
        <p className="hidden text-sm text-muted-foreground sm:block">
          Sync fonts across your devices
        </p>
      </div>
    </header>
  );
}
