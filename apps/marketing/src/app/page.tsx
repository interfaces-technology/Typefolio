function apiUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:43123";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export default function MarketingHomePage() {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center gap-10 px-6 py-20">
      <header className="space-y-4">
        <p className="text-sm font-medium tracking-wide text-neutral-500 uppercase">
          Typefolio
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Your fonts, on every device.
        </h1>
        <p className="text-lg text-neutral-600">
          Personal cloud storage for your typefaces. Upload once, sync to Mac and
          iPad — no marketplace, no zip bundles.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <a
          href={apiUrl("/auth/sign-up")}
          className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Create account
        </a>
        <a
          href={apiUrl("/auth/desktop")}
          className="inline-flex items-center justify-center rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50"
        >
          Sign in (Mac / iPad)
        </a>
      </div>

      <p className="text-sm text-neutral-500">
        The signed-in web library is being redesigned in Figma. Use the{" "}
        <strong className="font-medium text-neutral-700">macOS app</strong> to sync
        fonts after you create an account.
      </p>
    </div>
  );
}
