# syncFont

Sync font files across your devices. Upload fonts on one machine, share a sync code, and keep every device in sync — with optional **auto-install** via the macOS desktop client.

## Features

- Create named font libraries (for example "Work fonts", "Brand A")
- Upload `.ttf`, `.otf`, `.woff`, and `.woff2` files
- Share a human-friendly sync code (`FONT-ABCD-1234`) or link
- Download individual fonts or the full library as a ZIP (web UI)
- **Desktop client (macOS):** connect with sync code → download + auto-install → poll for changes every 30s

## Run locally

### API + web UI

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43123](http://127.0.0.1:43123).

### Desktop client (macOS auto-install)

Requires [Tauri prerequisites](https://tauri.app/start/prerequisites/).

```bash
# Terminal 1 — API
npm run dev

# Terminal 2 — client
cd client
npm install
npm run tauri dev
```

In the client, enter your sync code and the API URL (`http://127.0.0.1:43123` by default). Fonts are copied to `~/Library/Fonts` and the client polls the manifest every 30 seconds.

See [`client/README.md`](client/README.md) for build instructions.

## How it works

1. **Create** a library in the web app.
2. **Upload** font files on the library page.
3. **Share** the sync code with another device.
4. **Web path:** open the sync link and download fonts manually.
5. **Client path:** install the desktop app, enter the sync code, and fonts auto-install on macOS.

Font files are stored on the server filesystem under `.data/` by default. Set `SYNCFONT_DATA_DIR` to use a different directory.

## API endpoints (client)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| `GET` | `/api/libraries/by-code/:code` | None | Resolve library by sync code |
| `GET` | `/api/libraries/:id/manifest` | `X-Sync-Code` | Font manifest with SHA-256 + etag |
| `GET` | `/api/libraries/:id/fonts/:fontId` | None | Download single font |
| `POST` | `/api/libraries/:id/devices` | `X-Sync-Code` | Register device |
| `PATCH` | `/api/libraries/:id/devices/:deviceId` | `X-Sync-Code` | Report sync status |

Architecture details: see the project plan docs for API + client design.

## Security notes

- **No user accounts in v1.** Anyone with the sync code can access and download that library. Treat codes like passwords.
- Client routes validate `X-Sync-Code` against the library id.
- Basic in-memory rate limiting applies to library creation and uploads (resets on server restart).
- For production, use HTTPS, persistent storage, and consider expiring or rotating sync codes.

## Tech stack

- **API / web:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Desktop client:** Tauri v2, Rust, React

## Cloud storage (future)

v1 uses local disk storage. For production deployments on Vercel or similar, replace the filesystem layer in `src/lib/storage.ts` with S3, R2, or another object store and keep library metadata in a database.
