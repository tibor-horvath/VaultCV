# Repo structure

- `web/`: React + TypeScript SPA (Vite) — the website visitors see
- `api/`: Azure Functions (TypeScript) — the server-side API that guards your CV data
- `scripts/`: build helpers (for example `sync-swa-config.mjs`)
- `staticwebapp.config.json`: routing and security headers config

`staticwebapp.config.json` at the repo root is the canonical config. The `web` package `prebuild` script runs `scripts/sync-swa-config.mjs`, so `npm run build` in `web/` copies it to `web/staticwebapp.config.json` and `web/public/staticwebapp.config.json` and avoids config drift.
