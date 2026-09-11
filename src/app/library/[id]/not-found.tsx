import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Fonts not found</h1>
        <p className="text-muted-foreground">These fonts do not exist.</p>
        <Link href="/" className={cn(buttonVariants())}>
          Back home
        </Link>
      </main>
    </div>
  );
}
