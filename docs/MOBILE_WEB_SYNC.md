# Syncing web and mobile (WorthIQ)

## Shared package: `@worthiq/core`

Pure TypeScript lives in **`packages/worthiq-core/`**. Both apps depend on it via:

```json
"@worthiq/core": "file:../packages/worthiq-core"
```

- **Web:** `frontend/package.json` — Next transpiles it via `transpilePackages` in `next.config.ts`.
- **Mobile:** `mobile/package.json` — Metro watches the repo root in `mobile/metro.config.js` so the symlinked package resolves.

### What to put in `@worthiq/core`

- Net-worth rules, money formatting, bucket math, validation — anything **UI-agnostic**.
- Keep **React / Next / RN / Recharts** out of this package.

### Workflow when you change business logic

1. Edit **`packages/worthiq-core/src/*.ts`**.
2. **Web:** `cd frontend && npm run dev` (hot reload picks up changes).
3. **Mobile:** reload the app; if Metro caches aggressively, restart with `npx expo start --clear`.

### Workflow when you add a new export

1. Export from `packages/worthiq-core/src/index.ts`.
2. Run **`npm install`** in `frontend/` and `mobile/` if you changed `package.json` (usually not needed for TS-only edits).

### Deploy notes

- Vercel must include `packages/worthiq-core` in the repo (it does if committed). The `file:` dependency is resolved at install time.
- EAS Build installs from `mobile/package.json`; the `file:` path is valid because the monorepo layout is the same in CI.

### What stays separate

- Layout, navigation, charts (Recharts vs RN chart lib), Plaid Link UI, animations — **per platform** or a future thin **design-system** package.
