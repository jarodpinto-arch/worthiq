# WorthIQ Desktop

Native desktop app for macOS and Windows, built with [Tauri 2](https://tauri.app) wrapping the existing Next.js frontend.

## Prerequisites

- [Rust](https://rustup.rs/) (stable toolchain)
- [Node.js](https://nodejs.org/) 18+
- macOS: Xcode Command Line Tools
- Windows: Microsoft C++ Build Tools + WebView2

## Development

```bash
# From this directory
npm install
npm run dev
```

This starts the Next.js dev server (port 3000) and opens the Tauri window pointing at it.

## Building

```bash
npm run build
```

Produces a signed `.dmg` (macOS) and `.msi` / `.exe` (Windows) in `src-tauri/target/release/bundle/`.

## Code signing (for distribution)

- **macOS**: Set `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` environment variables.
- **Windows**: Set `TAURI_PRIVATE_KEY` and `TAURI_KEY_PASSWORD`.

## Architecture

The desktop app is a thin Tauri shell around the Next.js frontend. All business logic, API calls, and UI live in `../frontend`. The Tauri layer only adds:

- Native window chrome (title bar, traffic lights on macOS)
- `titleBarStyle: "Overlay"` for a clean look
- Deep link handling via `worthiq://` URL scheme (future)
- Auto-updater (future)
