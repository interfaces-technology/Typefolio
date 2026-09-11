# syncFont

Upload font files once. Sign in with the same account on any device to see them.

## Features

- Sign in and upload `.ttf`, `.otf`, `.woff`, and `.woff2` files
- Fonts stay with your account — no sync code to share
- Download individual fonts or the full set as a ZIP
- Native macOS app auto-installs fonts to `~/Library/Fonts`
- Native iPad app scaffold — sign in works; sync coming later

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

To run the API and macOS app together (frees port 43123 first if needed):

```bash
npm run dev:all
```

Requires Neon (Postgres + Auth) and Vercel Blob environment variables in `.env.local`.

## Native app (macOS + iPad)

See [`apps/SyncFont/README.md`](apps/SyncFont/README.md).

```bash
cd apps/SyncFont
swift build
swift run SyncFont
```

Or open `apps/SyncFont/SyncFont.xcodeproj` in Xcode.

## How it works

1. **Sign in** on the web app or native app.
2. **Upload** font files on the web.
3. **macOS app** polls your library and installs new fonts locally.
4. **iPad app** (scaffold) can sign in; font sync on iPad is coming later.

Font files are stored in Vercel Blob. Users and metadata live in Neon.

## API

The Next.js app is the first client of this API. Native apps use the same endpoints with `Authorization: Bearer …`.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/auth/*` | — | Neon Auth (sign up, sign in, session, access token) |
| `GET` | `/api/me` | Session or Bearer | Current user + library metadata |
| `POST` | `/api/fonts` | Session or Bearer | Upload fonts |
| `GET` | `/api/libraries/:id` | Session or Bearer (owner) | Get the collection |
| `GET` | `/api/libraries/:id/manifest` | Session or Bearer (owner) | Font manifest + etag |
| `GET` | `/api/libraries/:id/fonts/:fontId` | Session or Bearer (owner) | Download a font |
| `DELETE` | `/api/libraries/:id/fonts/:fontId` | Session or Bearer (owner) | Delete a font |
| `GET` | `/api/libraries/:id/download` | Session or Bearer (owner) | Download all fonts as ZIP |
| `POST` | `/api/libraries/:id/devices` | Session or Bearer (owner) | Register a device |
| `PATCH` | `/api/libraries/:id/devices/:deviceId` | Session or Bearer (owner) | Report sync status |

## Tech stack

- **API / web:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Native:** SwiftUI (macOS complete, iPadOS scaffold)
- **Auth:** Neon Auth (Managed Better Auth)
- **Data:** Neon Postgres + Vercel Blob
