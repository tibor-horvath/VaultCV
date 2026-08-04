# AGENTS.md

## Cursor Cloud-specific instructions

### Overview

VaultCV is a privacy-first CV/resume web app with two packages:
- `web/` — React 19 SPA (Vite 8, Tailwind CSS 3, TypeScript)
- `api/` — Azure Functions v4 backend (TypeScript, esbuild)

Both use **npm** as the package manager. Node.js **20.19+** is required locally; CI runs on Node.js **22** (recommended).

### Quick reference

All commands run from the repo root.

| Task | Command |
|------|---------|
| First-time setup (deps + local config files) | `npm run setup` |
| Web dev server | `npm run dev` (localhost:5173) |
| API dev server | `npm run dev:api` (localhost:7071, needs `func`) |
| Web lint | `npm run lint` |
| All tests | `npm test` |
| Web tests only | `npm run test --prefix web` |
| API tests only | `npm run test --prefix api` |
| Build both packages | `npm run build` |
| Sync SWA config manually | `npm run sync:swa-config` |

### Mock mode for frontend development

`npm run setup` enables mock mode by default. To do it manually: create `web/.env.local` (gitignored) with `VITE_USE_MOCK_CV=1`, then run `npm run dev`.

Mock mode provides hardcoded CV data so you can see the full CV view without any backend.

### API local development

The API requires Azure Functions Core Tools v4 (`func` CLI) to run locally. It also needs `api/local.settings.json` (gitignored) with secrets — `npm run setup` creates it from `api/local.settings.example.json` with a generated `CV_SESSION_SIGNING_KEY`; fill in the storage values yourself. The API depends on Azure Blob/Table Storage in production; for local dev without Azure, use mock mode on the web side instead.

### Gotchas

- The web lint output currently includes some pre-existing issues in admin-related routes. Treat those as baseline unless your change touches them.
- The web app calls `/api/...` as same-origin relative URLs. The Vite dev server proxies `/api` to `http://localhost:7071` (override with `VITE_API_PROXY_TARGET`), **except in mock mode**, where the proxy is off because the UI never calls the backend.
- `web/.env.local` is gitignored; `npm run setup` creates it from `web/.env.local.example` in each new environment.
