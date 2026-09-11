# SyncFont native app

Multiplatform SwiftUI client for syncFont.

## Platforms

| Platform | Status |
|----------|--------|
| macOS | Complete — sign in, sync, auto-install to `~/Library/Fonts` |
| iPadOS | Complete — browser/email sign-in, sync, system font install |

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

## Build (iPadOS)

Open `Package.swift` in Xcode, select an **iPad simulator**, and run.

Or from the command line:

```bash
cd apps/SyncFont
swift build \
  --sdk "$(xcrun --sdk iphonesimulator --show-sdk-path)" \
  --triple arm64-apple-ios17.0-simulator
```

## Auth flow (macOS)

1. Click **Sign in with browser** in the app.
2. Your default browser opens the syncFont sign-in page.
3. Sign in with email/password or Google (same account as the web app).
4. The browser redirects back to the app with your session; the app stores it in Keychain.

## Auth flow (iPadOS)

1. Click **Sign in with browser** (recommended) or expand **Sign in with email**.
2. Browser sign-in uses `ASWebAuthenticationSession` and returns via `syncfont://auth/callback`.
3. Email sign-in calls the API directly — useful for local dev against `http://127.0.0.1:43123`.

## After sign-in

1. App stores a bearer token in Keychain.
2. The app registers this device, polls the manifest every 30 seconds while open, and schedules background refresh when backgrounded.
3. New fonts are downloaded, SHA-256 verified, and installed:
   - **macOS:** `~/Library/Fonts`
   - **iPadOS:** system font install prompt via Core Text (`.ttf` / `.otf` only; `.woff` / `.woff2` are skipped)

## API endpoints used

- `GET /auth/desktop` (browser sign-in)
- `GET /api/me`
- `GET /api/libraries/:id/manifest`
- `GET /api/libraries/:id/fonts/:fontId`
- `POST /api/libraries/:id/devices`
- `PATCH /api/libraries/:id/devices/:deviceId`
