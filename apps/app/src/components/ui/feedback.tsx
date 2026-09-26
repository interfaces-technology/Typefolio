import { AlertCircleIcon, WifiOffIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{body}</CardDescription>
      </CardHeader>
      {action ? (
        <CardContent>
          <Button onClick={action.onClick}>{action.label}</Button>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function ErrorState({
  title = "Something went wrong",
  body,
  onRetry,
}: {
  title?: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <p>{body}</p>
        {onRetry ? (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <Skeleton className={cn("h-24 w-full", className)} />;
}

export function OfflineBanner() {
  return (
    <Alert className="rounded-none border-x-0 border-t-0">
      <WifiOffIcon />
      <AlertTitle>You are offline</AlertTitle>
      <AlertDescription>Changes will sync when the connection returns.</AlertDescription>
    </Alert>
  );
}
