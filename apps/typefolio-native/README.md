# Typefolio native app

SwiftUI client for Typefolio (macOS + iPad).

## Platforms

| Platform | Status |
|----------|--------|
| macOS | Sign in, sync, auto-install to `~/Library/Fonts` |
| iPadOS | Browser/email sign-in, sync, system font install |

## Requirements

- Xcode 15+ / Swift 5.9+
- Typefolio API running (`npm run dev:api` — default `http://127.0.0.1:43123`)

## Build (macOS)

```bash
cd apps/typefolio-native
swift run Typefolio
```

Or open `Typefolio.xcodeproj` in Xcode.

## Build (iPadOS)

Open `Typefolio.xcodeproj` in Xcode, select an **iPad simulator**, and run.

## Auth flow (macOS)

1. Click **Sign in with browser** in the app.
2. Browser opens the Typefolio sign-in page on the **app** host (`NEXT_PUBLIC_APP_URL`).
3. After sign-in, the app stores a bearer token in Keychain.

## API endpoints used

- `GET /auth/desktop` (browser sign-in — app host)
- `GET /api/me`
- `GET /api/libraries/:id/manifest`
- `GET /api/libraries/:id/fonts/:fontId`
- `POST` / `DELETE` `/api/libraries/:id/devices/...`
