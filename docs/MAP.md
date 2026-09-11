# syncFont map

Cloud API + Next.js web client + native SwiftUI apps. Fonts live in Vercel Blob; users and metadata live in Neon.

**Product strategy:** see [`docs/PRODUCT.md`](PRODUCT.md) (Typefolio naming, pricing, billing, launch scope).

## Areas

- **API:** [`src/app/api/`](src/app/api/) — auth, font upload, font download, manifest, devices
- **Access:** [`src/lib/access.ts`](src/lib/access.ts) — session + bearer token auth
- **Auth:** [`src/lib/auth/`](src/lib/auth/) — Neon Auth server + client
- **Storage:** [`src/lib/storage.ts`](src/lib/storage.ts) + [`src/lib/db/`](src/lib/db/) — Postgres + Blob
- **Web client:** [`src/app/page.tsx`](src/app/page.tsx), [`src/app/library/`](src/app/library/), [`src/app/auth/`](src/app/auth/)
- **Marketplace:** [`src/app/marketplace/`](src/app/marketplace/), [`src/lib/marketplace/`](src/lib/marketplace/), [`src/lib/entitlements.ts`](src/lib/entitlements.ts)
- **Foundry portal:** [`src/app/foundry/`](src/app/foundry/), [`src/lib/foundry.ts`](src/lib/foundry.ts), [`src/lib/stripe/`](src/lib/stripe/)
- **Native apps:** [`apps/SyncFont/`](apps/SyncFont/) — SwiftUI macOS and iPadOS (sync + install)

## Auth

- Signed-in user uploads and sees their fonts. Same account on any device.
- Each user has one collection behind the scenes (`getOrCreateUserLibrary`).
- Native apps authenticate with email/password, store a bearer token in Keychain, and call `GET /api/me`.
- There is no public create-library or sync-code sharing.

## Where new things go

- Pages → `src/app/<path>/page.tsx`
- API → `src/app/api/<path>/route.ts`
- Data access → `src/lib/`
- Native SwiftUI → `apps/SyncFont/Shared/` (shared), `apps/SyncFont/macOS/`, `apps/SyncFont/iOS/`
