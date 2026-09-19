# Typefolio map

Cloud API + Next.js web client + native SwiftUI apps. Neon owns the database, authentication and API compute. Fonts remain in Vercel Blob.

**Product strategy:** see [`docs/PRODUCT.md`](PRODUCT.md).

## Areas

- **API:** `functions/api.ts` — Neon Function for font upload/download, manifest, devices and library access
- **Access:** `functions/auth.ts` — validates Neon Auth sessions/bearer tokens for the Neon API
- **Auth UI:** `src/lib/auth/` — Neon Auth server + client for the web authentication experience
- **Data:** `src/lib/db/` — Neon Postgres schema and connection
- **Storage:** `src/lib/storage.ts` — font binaries remain in Vercel Blob
- **Web client:** `src/app/`
- **Native apps:** `apps/SyncFont/` — SwiftUI macOS and iPadOS

## Runtime boundary

The Next.js app remains the frontend host. Its `/api/*` paths are proxied to the Neon Function using `NEON_API_URL`; `/api/auth/*` stays on the Next.js/Neon Auth handler because it serves the browser auth surface.

Native clients continue using the Typefolio base URL; they do not need to know the Neon Function URL.

## Local development

Leave `NEON_API_URL` unset to use the existing local Next.js API routes. Set it to a deployed Neon Function URL when testing the Neon backend end-to-end.
