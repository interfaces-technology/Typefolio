# syncFont

Upload font files once. Sign in with the same account on any device to see them.

## Features

- Sign in and upload `.ttf`, `.otf`, `.woff`, and `.woff2` files
- Fonts stay with your account — no sync code to share
- Download individual fonts or the full set as a ZIP

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

Requires Neon (Postgres + Auth) and Vercel Blob environment variables in `.env.local`.

## How it works

1. **Sign in** on the web app.
2. **Upload** font files.
3. **Sign in** on another device with the same account to see the same fonts.

Font files are stored in Vercel Blob. Users and metadata live in Neon.

## API

The Next.js app is the first client of this API.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `POST` | `/api/auth/*` | — | Neon Auth (sign up, sign in, session) |
| `POST` | `/api/fonts` | Session | Upload fonts |
| `GET` | `/api/libraries/:id` | Session (owner) | Get the collection |
| `GET` | `/api/libraries/:id/fonts/:fontId` | Session (owner) | Download a font |
| `DELETE` | `/api/libraries/:id/fonts/:fontId` | Session (owner) | Delete a font |
| `GET` | `/api/libraries/:id/download` | Session (owner) | Download all fonts as ZIP |

## Tech stack

- **API / web:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Auth:** Neon Auth (Managed Better Auth)
- **Data:** Neon Postgres + Vercel Blob
