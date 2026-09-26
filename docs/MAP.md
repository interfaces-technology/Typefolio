# Typefolio map

Turborepo: shared core + three Next.js apps + native clients. Fonts live in Vercel Blob; users and metadata live in Neon.

**Product strategy:** [`docs/PRODUCT.md`](PRODUCT.md)  
**Deploy split:** [`docs/DEPLOYMENT.md`](DEPLOYMENT.md)

## Layout

```
packages/core/          @typefolio/core — DB, auth, billing, storage, entitlements
apps/api/               @typefolio/api — /api/*, webhooks, Better Auth handler
apps/app/               @typefolio/app — signed-in product UI (design here)
apps/marketing/         @typefolio/marketing — landing & pricing shell
apps/typefolio-native/  SwiftUI macOS + iPadOS
apps/typefolio-desktop/ Electron (experimental)
```

## Local ports

| Package | Port |
|---------|------|
| API | 43123 |
| App | 43124 |
| Marketing | 43125 |

## Where new things go

| Change | Location |
|--------|----------|
| API route | `apps/api/src/app/api/.../route.ts` |
| Product page / component | `apps/app/src/app/`, `apps/app/src/components/` |
| Marketing page | `apps/marketing/src/app/` |
| Shared server logic | `packages/core/src/lib/` |
| Native SwiftUI | `apps/typefolio-native/Shared/`, `macOS/`, `iOS/` |

## Auth

- Better Auth runs on the **API** app (`BETTER_AUTH_URL` / `NEXT_PUBLIC_API_URL`).
- Product app uses session cookies via `/api` rewrites when `NEXT_PUBLIC_API_URL` is set.
- Native apps use bearer tokens from desktop auth flow.
