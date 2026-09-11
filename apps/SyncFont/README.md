# SyncFont native app

Multiplatform SwiftUI client for syncFont.

## Platforms

| Platform | Status |
|----------|--------|
| macOS | Complete — sign in, sync, auto-install to `~/Library/Fonts` |
| iPadOS | Scaffold — sign in works; font sync/install coming later |

## Requirements

- Xcode 15+ / Swift 5.9+
- syncFont API running (default `http://127.0.0.1:43123`)

## Build (macOS)

```bash
cd apps/SyncFont
swift build
swift run SyncFont
```

Or open `Package.swift` in Xcode, select **My Mac**, and run.

## Build (iPadOS scaffold)

Open `Package.swift` in Xcode, select an **iPad simulator**, and run. You can sign in and see your library metadata; sync/install is disabled with a coming-soon message.

## Auth flow (macOS)

1. Click **Sign in with browser** in the app.
2. Your default browser opens the syncFont sign-in page.
3. Sign in with email/password or Google (same account as the web app).
4. The browser redirects back to the app with your session; the app stores it in Keychain.

The app no longer asks for email/password directly on macOS — everything goes through the browser.

## Auth flow (iPadOS)

Browser sign-in is coming soon. The scaffold still compiles but sync/install is disabled.

## After sign-in (macOS)

1. App stores a bearer token in Keychain.
2. macOS registers this device, polls the manifest every 30 seconds, downloads new fonts, verifies SHA-256, and installs to `~/Library/Fonts`.

## API endpoints used

- `GET /auth/desktop` (browser sign-in for macOS)
- `GET /api/me`
- `GET /api/libraries/:id/manifest`
- `GET /api/libraries/:id/fonts/:fontId`
- `POST /api/libraries/:id/devices`
- `PATCH /api/libraries/:id/devices/:deviceId`
