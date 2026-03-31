# AGENTS.md

## Cursor Cloud specific instructions

### Overview

VaultCV is a privacy-first CV/resume web app with two packages:
- `web/` — React 19 SPA (Vite 8, Tailwind CSS 3, TypeScript)
- `api/` — Azure Functions v4 backend (TypeScript, esbuild)

Both use **npm** as the package manager. Node.js 20.19+ is required (Node.js 22 is used in CI and recommended).

### Quick reference

| Task | Command |
|------|---------|
| Install deps | `npm install` in root, `web/`, and `api/` |
| Web dev server | `cd web && npm run dev` (localhost:5173) |
| Web lint | `cd web && npm run lint` |
| Web tests | `cd web && npm run test` |
| API tests | `cd api && npm run test` |
| All tests | `npm test` (from root) |
| Web build | `cd web && npm run build` |
| API build | `cd api && npm run build` |

### Mock mode for frontend development

To develop the web UI without the Azure Functions API or any Azure services, enable mock mode:

1. Create `web/.env.local` (gitignored) with `VITE_USE_MOCK_CV=1`
2. Run `cd web && npm run dev`

Mock mode provides hardcoded CV data so you can see the full CV view without any backend.

### API local development

The API requires Azure Functions Core Tools v4 (`func` CLI) to run locally. It also needs `api/local.settings.json` (gitignored) with secrets — copy from `api/local.settings.example.json`. The API depends on Azure Blob/Table Storage in production; for local dev without Azure, use mock mode on the web side instead.

### Gotchas

- ESLint has 6 pre-existing errors (mostly `@typescript-eslint/no-explicit-any`) in `AdminEditorRoute.tsx`, `AdminRoute.tsx`, and `downloadCvPdf.ts`. These are not introduced by new changes.
- The web app calls `/api/...` as same-origin relative URLs. Without SWA CLI or a proxy, the API won't be reachable from the Vite dev server — use mock mode for UI-only work.
- `web/.env.local` is gitignored and must be created manually in each new environment.
