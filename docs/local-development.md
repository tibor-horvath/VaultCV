# Local development

> **What you need installed:** [Node.js 20.19+](https://nodejs.org/) (includes `npm`). CI runs on Node.js 22, which is also recommended locally — a `.nvmrc` is committed, so `nvm use` picks it up. Confirm with `node -v` in a terminal. You don't need Azure tools just to run the site locally.

## Quickstart

From the repo root:

```bash
npm run setup
```

That one command checks your Node version, installs `web/` and `api/` dependencies from their lockfiles, and creates the two gitignored local config files from their committed templates:

| Created | From | Notes |
|---|---|---|
| `web/.env.local` | `web/.env.local.example` | Enables mock CV mode |
| `api/local.settings.json` | `api/local.settings.example.json` | A random `CV_SESSION_SIGNING_KEY` is generated for you |

It never overwrites files that already exist, so it is safe to re-run after pulling.

Then:

```bash
npm run dev
```

The site is at http://localhost:5173 with a fully populated mock CV — no Azure account, no Functions host, no secrets required.

### Root scripts

| Command | What it does |
|---|---|
| `npm run setup` | Install dependencies and create local config files |
| `npm run dev` | Vite dev server for `web/` |
| `npm run dev:api` | Build `api/` and start the Azure Functions host |
| `npm run build` | Production build of `web/` and `api/` |
| `npm run lint` | ESLint over `web/` |
| `npm test` | Vitest suites for `web/` and `api/` |

## Web only

`npm run dev` starts the frontend on its own. It shows the landing page UI and, when the API is running, loads public profile data from `GET /api/public-profile`.

### Mock CV mode

Mock mode is what `npm run setup` turns on by default. It serves a built-in sample CV instead of calling the API, so you can work on the UI without any backend. See [mock data](mock-data.md).

- `VITE_USE_MOCK_CV=1` in `web/.env.local` enables it
- It only applies to the dev server — a production build never uses mock data
- Set it to `0` (or remove it) when you want the real API

`web/.env.example` lists every supported variable with comments; copy it to `web/.env.local` instead of the minimal template if you also want branding and public-text values pre-filled.

Without the API, the landing page can still show minimal text from `VITE_PUBLIC_NAME` and `VITE_PUBLIC_TITLE`.

## API only

Run this if you want to test the server-side token and CV data locally.

1. Install [Azure Functions Core Tools v4](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) (includes the `func` command).
2. Fill in the storage values in `api/local.settings.json` (`npm run setup` created it; it is gitignored and will not be committed). `CV_SESSION_SIGNING_KEY` is required and is generated for you.
3. Start the Functions host:

```bash
npm run dev:api
```

The API listens at `http://localhost:7071` by default (for example `POST http://localhost:7071/api/auth`).

If you did not run `npm run setup`, copy `api/local.settings.example.json` to `api/local.settings.json` by hand and set `CV_SESSION_SIGNING_KEY` to a long random secret (at least 32 characters), plus `CV_PROFILE_SLUG`, `CV_PROFILE_STORAGE_CONNECTION_STRING`, and `CV_PROFILE_CONTAINER`.

Minimal `Values` shape:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "CV_SESSION_SIGNING_KEY": "<random-secret-at-least-32-chars>",
    "CV_PROFILE_SLUG": "john-doe",
    "CV_PROFILE_STORAGE_CONNECTION_STRING": "<azure-storage-connection-string>",
    "CV_PROFILE_CONTAINER": "profiles"
  }
}
```

## Web + API together locally

The app calls `/api/...` as **same-origin** relative URLs, which is how it behaves once deployed to Static Web Apps. Locally the Functions host is a separate origin, so the Vite dev server proxies `/api` to it for you.

In two terminals:

```bash
npm run dev:api
```

```bash
npm run dev
```

Then set `VITE_USE_MOCK_CV=0` in `web/.env.local` so the frontend talks to the real API. The proxy is deliberately **disabled while mock mode is on** — otherwise every page load would log connection-refused errors for an API you are not running.

> Restart `npm run dev` after changing `VITE_USE_MOCK_CV`. The proxy is decided when the dev server reads its config at startup, so editing `.env.local` alone will not flip it.

Other details:

- Proxy target defaults to `http://localhost:7071`. Override it with `VITE_API_PROXY_TARGET` in `web/.env.local`.
- If the Functions host is not reachable, the proxy answers `503 {"error":"api_unavailable"}` instead of returning the SPA's HTML, which makes the failure obvious in the network tab.
- The `cv_session` cookie works across the proxy because cookies ignore the port.

Alternatives to the proxy:

- Use the [Azure Static Web Apps CLI](https://learn.microsoft.com/en-us/azure/static-web-apps/local-development) (`swa`) to run the frontend and API together on `http://localhost:4280` — set `VITE_API_PROXY_TARGET=http://localhost:4280` if you point the Vite dev server at it.
- Test against a deployed / staging SWA, where the site and API already share one origin.
