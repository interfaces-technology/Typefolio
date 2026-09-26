function appUrl(path: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:43124";
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
          href={appUrl("/auth/sign-up")}
          className="inline-flex items-center justify-center rounded-lg bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Get started
        </a>
        <a
          href={appUrl("/auth/sign-in")}
          className="inline-flex items-center justify-center rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium hover:bg-neutral-50"
        >
          Sign in
        </a>
      </div>

      <p className="text-sm text-neutral-500">
        Product UI lives at{" "}
        <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
          apps/app
        </code>{" "}
        — this site is the marketing shell (
        <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">
          apps/marketing
        </code>
        ).
      </p>
    </div>
  );
}
