# Typefolio map

Turborepo: shared core + API + marketing + native clients. Fonts live in Vercel Blob; users and metadata live in Neon.

**Product strategy:** [`docs/PRODUCT.md`](docs/PRODUCT.md)  
**Deploy split:** [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## Layout

```
packages/core/          @typefolio/core — DB, auth, billing, storage, entitlements
apps/api/               @typefolio/api — /api/*, webhooks, Better Auth, /auth/desktop
apps/app/               @typefolio/app — signed-in product web UI
apps/marketing/         @typefolio/marketing — landing & pricing shell
apps/typefolio-native/  SwiftUI macOS + iPadOS
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
| Native browser sign-in | `apps/api/src/app/auth/desktop/` |
| Marketing page | `apps/marketing/src/app/` |
| Shared server logic | `packages/core/src/lib/` |
| Native SwiftUI | `apps/typefolio-native/Shared/`, `macOS/`, `iOS/` |
| Product web UI | `apps/app/src/` |

## Auth

- Better Auth runs on the **API** app (`BETTER_AUTH_URL` / `NEXT_PUBLIC_API_URL`).
- macOS / iPad open **`{API}/auth/desktop`** in the browser, then receive a bearer token via localhost or `typefolio://` callback.
- Native apps use bearer tokens from the desktop auth flow.
