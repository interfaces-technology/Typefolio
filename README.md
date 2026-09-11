# syncFont

Sync font files across your devices. Upload `.ttf`, `.otf`, `.woff`, and `.woff2` files on one machine, share a short sync code, and download the same library on another — no account required.

## Features (v1)

- Create named font libraries (e.g. "Work fonts", "Brand A")
- Upload multiple font files per library
- Get a human-friendly sync code (`FONT-ABCD-1234`) and shareable link
- Open a library on another device via code or link
- Download individual fonts or the full set as a ZIP

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43123](http://localhost:43123).

## How it works

1. **Create** a library with a name (and optional description).
2. **Upload** your font files on the library page.
3. **Copy** the sync code or link and open it on another device.
4. **Download** fonts individually or as a ZIP.

Font files are stored on the server filesystem under `.data/` by default. Set `SYNCFONT_DATA_DIR` to use a different directory (required for ephemeral hosts like serverless unless you add cloud storage).

## Security notes

- **No authentication in v1.** Anyone with the sync code can access and download that library. Treat codes like passwords.
- Basic in-memory rate limiting applies to library creation and uploads (resets on server restart).
- For production, use HTTPS, persistent storage, and consider expiring or rotating sync codes in a future release.

## Cloud storage (future)

v1 uses local disk storage. For production deployments on Vercel or similar, replace the filesystem layer in `src/lib/storage.ts` with S3, R2, or another object store and keep library metadata in a database or object metadata.

## Tech stack

- Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
