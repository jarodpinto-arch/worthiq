# EAS build and TestFlight

## One-time setup

1. Install the EAS CLI globally: `npm install -g eas-cli`.
2. Log in: `eas login` (Expo account).
3. From `mobile/`, link the project: `eas init`. This creates or attaches an EAS project and writes the real `projectId` into Expo config. Either let `eas init` update `app.config.ts` `extra.eas.projectId`, or set `EAS_PROJECT_ID` in your shell / EAS secrets and keep the config reading it.
4. Apple Developer Program ($99/year): create an **App ID** matching `io.worthiq.app` and an **App Store Connect** app named WorthIQ.
5. In EAS, register credentials when prompted the first time you build iOS (`eas credentials`), or use `eas build` and follow the interactive flow.

## Environment variables (Railway / backend)

For native Plaid Link, set on the API:

- `PLAID_ANDROID_PACKAGE_NAME=io.worthiq.app` (must match Plaid Dashboard → Allowed Android package names).
- For iOS OAuth with major banks in production, add `PLAID_IOS_REDIRECT_URI` (https) and configure Universal Links; see [Plaid iOS Link](https://plaid.com/docs/link/ios/).

## Commands (run from `mobile/`)

| Goal | Command |
|------|---------|
| Dev client (Simulator) | `eas build --profile development --platform ios` |
| Internal device build (Ad Hoc / internal) | `eas build --profile preview --platform ios` |
| App Store binary | `eas build --profile production --platform ios` |
| Submit latest production build to App Store Connect | `eas submit --platform ios --latest` |

After `eas submit`, open **App Store Connect → TestFlight**, complete compliance if asked, add internal testers, then promote to external beta when ready.

## Local development with native Plaid

Expo Go does not include the Plaid native module. Use a **development build**:

1. `eas build --profile development --platform ios` (or Android APK from the same profile).
2. Install the build on device; then `npx expo start --dev-client` and open the project from the dev client.

## Android

Register `io.worthiq.app` under Plaid **Allowed Android package names**. Build with `eas build --profile production --platform android` when you are ready for Play internal testing.
