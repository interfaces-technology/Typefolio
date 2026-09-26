export default function StudioLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <div className="h-8 w-40 rounded-md bg-foreground/10" />
        <div className="h-4 w-64 rounded-md bg-foreground/10" />
        <div className="h-1.5 w-full max-w-sm rounded-full bg-foreground/10" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-36 rounded-lg border border-border bg-card"
          />
        ))}
      </div>
    </div>
  );
}
