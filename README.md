# Typefolio

Your fonts, on every device.

Upload font files once. Sign in with the same account on Mac or iPad to sync and install them.

Product strategy: [`docs/PRODUCT.md`](docs/PRODUCT.md) · Repo map: [`docs/MAP.md`](docs/MAP.md)

## Monorepo

| Workspace | Local URL | Purpose |
|-----------|-----------|---------|
| `@typefolio/api` | http://127.0.0.1:43123 | API, webhooks, Better Auth, native browser sign-in |
| `@typefolio/marketing` | http://127.0.0.1:43125 | Marketing landing shell |
| `@typefolio/core` | — | Shared DB, billing, storage |

The **product web app** (`apps/app`) was removed while the UI is rebuilt in Figma. Auth for native clients lives on the API at `/auth/desktop` and `/auth/sign-up`.

```bash
npm install
cp .env.example .env.local   # fill in Neon, Blob, Better Auth, Polar, Resend
npm run check:env
npm run dev                  # API + marketing (Turborepo)
# or: npm run dev:api | dev:marketing
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

- **Web:** Next.js 16, Turborepo (API + marketing)
- **Native:** SwiftUI (`apps/typefolio-native`)
- **Auth:** Better Auth + Resend
- **Billing:** Polar (web) + Apple webhooks (iPad)
- **Data:** Neon Postgres + Vercel Blob

https://github.com/interfaces-technology/Typefolio
