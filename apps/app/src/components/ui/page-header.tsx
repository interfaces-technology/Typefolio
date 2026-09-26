import { Separator } from "@/components/ui/separator";

export function PageHeader({
  title,
  meta,
  description,
  action,
}: {
  title: string;
  meta?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-8 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {meta ? <p className="text-sm text-muted-foreground">{meta}</p> : null}
          {description ? (
            <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <Separator />
    </header>
  );
}
