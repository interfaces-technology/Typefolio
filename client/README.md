# syncFont Desktop Client

macOS desktop client for **syncFont**. Connect with a library sync code, download fonts from the API, and auto-install them to `~/Library/Fonts`.

## Prerequisites

- [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS
- syncFont API running locally or deployed

## Run with the API

In the repo root:

```bash
npm install
npm run dev
```

In another terminal:

```bash
cd client
npm install
npm run tauri dev
```

Default API URL in the client UI: `http://127.0.0.1:43123`

## Usage

1. Create a library and upload fonts in the web app.
2. Copy the sync code (for example `FONT-ABCD-1234`).
3. Open the desktop client, paste the sync code, and click **Connect and install**.
4. The client registers this device, installs all library fonts, then polls every **30 seconds** for changes.

## Platform support

- **macOS:** auto-install to `~/Library/Fonts` (v1)
- **Windows/Linux:** connect + download works; OS install is macOS-only in v1

## Build

```bash
cd client
npm run tauri build
```

Built app bundles are written to `client/src-tauri/target/release/bundle/`.
