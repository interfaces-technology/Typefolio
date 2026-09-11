# syncFont

Sync font files across your devices. Upload fonts in the web app, share a sync code, and keep every device in sync.

## Features

- Sign in and own named font libraries (for example "Work fonts", "Brand A")
- Upload `.ttf`, `.otf`, `.woff`, and `.woff2` files
- Share a human-friendly sync code (`FONT-ABCD-1234`) or link
- Download individual fonts or the full library as a ZIP

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

Requires Neon (Postgres + Auth) and Vercel Blob environment variables in `.env.local`.

## How it works

1. **Sign in** on the web app.
2. **Create** a library.
3. **Upload** font files.
4. **Share** the sync code with another device or person.
5. Open the sync link and download fonts.

Font files are stored in Vercel Blob. Users, libraries, and metadata live in Neon.

## API

The Next.js app is the first client of this API. Future native clients should use the same routes.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/auth/*` | — | Neon Auth (sign up, sign in, session) |
| `GET` | `/api/libraries` | Session | List the signed-in user's libraries |
| `POST` | `/api/libraries` | Session | Create a library |
| `GET` | `/api/libraries/:id` | Session or `X-Sync-Code` | Get a library |
| `PATCH` | `/api/libraries/:id` | Session (owner) | Update a library |
| `DELETE` | `/api/libraries/:id` | Session (owner) | Delete a library |
| `GET` | `/api/libraries/by-code/:code` | None | Resolve library by sync code |
| `GET` | `/api/libraries/:id/manifest` | Session or `X-Sync-Code` | Font manifest with SHA-256 + etag |
| `POST` | `/api/libraries/:id/fonts` | Session (owner) | Upload fonts |
| `GET` | `/api/libraries/:id/fonts/:fontId` | Session or `X-Sync-Code` | Download a font |
| `DELETE` | `/api/libraries/:id/fonts/:fontId` | Session (owner) | Delete a font |
| `GET` | `/api/libraries/:id/download` | Session or `X-Sync-Code` | Download all fonts as ZIP |
| `GET`/`POST` | `/api/libraries/:id/devices` | Session or `X-Sync-Code` | List / register devices |
| `PATCH` | `/api/libraries/:id/devices/:deviceId` | Session or `X-Sync-Code` | Report sync status |

## Tech stack

- **API / web:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Auth:** Neon Auth (Managed Better Auth)
- **Data:** Neon Postgres + Vercel Blob
