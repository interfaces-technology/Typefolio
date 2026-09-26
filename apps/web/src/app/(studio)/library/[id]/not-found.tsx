import Link from "next/link";

export default function LibraryNotFound() {
  return (
    <main className="space-y-3">
      <h1 className="text-[1.75rem] font-semibold">Library not found</h1>
      <p className="text-sm text-muted-foreground">
        This account only opens its own library.
      </p>
      <Link href="/" className="text-sm font-medium underline-offset-4 hover:underline">
        Back to your library
      </Link>
    </main>
  );
}
