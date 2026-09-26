# Typefolio

Your fonts, on every device.

Upload font files once. Sign in with the same account on web, Mac, or iPad to sync and install them.

Product strategy: [`docs/PRODUCT.md`](docs/PRODUCT.md) · Repo map: [`docs/MAP.md`](docs/MAP.md)

## Monorepo

| Workspace | Local URL | Purpose |
|-----------|-----------|---------|
| `@typefolio/api` | http://127.0.0.1:43123 | API, webhooks, Better Auth |
| `@typefolio/app` | http://127.0.0.1:43124 | **Product UI** (library, auth pages) |
| `@typefolio/marketing` | http://127.0.0.1:43125 | Marketing landing shell |
| `@typefolio/core` | — | Shared DB, billing, storage |

```bash
npm install
cp .env.example .env.local   # fill in Neon, Blob, Better Auth, Polar, Resend
npm run check:env
npm run dev                  # all web apps (Turborepo)
# or: npm run dev:api | dev:app | dev:marketing
npm run smoke                # hits API on :43123
npm test
```

## Native (macOS + iPad)

[`apps/typefolio-native/README.md`](apps/typefolio-native/README.md)

```bash
cd apps/typefolio-native
swift run Typefolio
```

API + Mac together:

```bash
npm run dev:native
```

## Tech stack

- **Web:** Next.js 16, Turborepo, Tailwind, shadcn/ui
- **Native:** SwiftUI (`apps/typefolio-native`)
- **Auth:** Better Auth + Resend
- **Billing:** Polar (web) + Apple webhooks (iPad)
- **Data:** Neon Postgres + Vercel Blob

https://github.com/interfaces-technology/Typefolio
