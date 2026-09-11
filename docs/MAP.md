# syncFont map

Cloud API + Next.js web client. Fonts live in Vercel Blob; users and metadata live in Neon.

## Areas

- **API:** [`src/app/api/`](src/app/api/) — auth, font upload, font download
- **Access:** [`src/lib/access.ts`](src/lib/access.ts) — signed-in session
- **Auth:** [`src/lib/auth/`](src/lib/auth/) — Neon Auth server + client
- **Storage:** [`src/lib/storage.ts`](src/lib/storage.ts) + [`src/lib/db/`](src/lib/db/) — Postgres + Blob
- **Web client:** [`src/app/page.tsx`](src/app/page.tsx), [`src/app/library/`](src/app/library/), [`src/app/auth/`](src/app/auth/)

## Auth

- Signed-in user uploads and sees their fonts. Same account on any device.
- Each user has one collection behind the scenes (`getOrCreateUserLibrary`).
- There is no public create-library or sync-code sharing.

## Where new things go

- Pages → `src/app/<path>/page.tsx`
- API → `src/app/api/<path>/route.ts`
- Data access → `src/lib/`
