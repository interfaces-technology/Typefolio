# syncFont map

Cloud API + Next.js web client. Fonts live in Vercel Blob; users, libraries, and metadata live in Neon.

## Areas

- **API:** [`src/app/api/`](src/app/api/) — auth, libraries, fonts, manifest, devices
- **Access:** [`src/lib/access.ts`](src/lib/access.ts) — session vs sync-code
- **Auth:** [`src/lib/auth/`](src/lib/auth/) — Neon Auth server + client
- **Storage:** [`src/lib/storage.ts`](src/lib/storage.ts) + [`src/lib/db/`](src/lib/db/) — Postgres + Blob
- **Web client:** [`src/app/page.tsx`](src/app/page.tsx), [`src/app/library/`](src/app/library/), [`src/app/sync/`](src/app/sync/), [`src/app/auth/`](src/app/auth/)

## Auth

- Signed-in user owns libraries (create / upload / delete).
- Sync code (`X-Sync-Code` or `?syncCode=`) can read/download a library.
