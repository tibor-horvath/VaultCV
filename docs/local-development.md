# Local development

> **What you need installed:** [Node.js 20+](https://nodejs.org/) (includes `npm`). Confirm with `node -v` in a terminal. You don't need Azure tools just to run the site locally.

## Web only

This is the fastest way to see the site running. It shows the landing page with data from `web/public/public-profile.json`.

### Mock CV mode (optional)

To develop the CV UI without calling the API, enable mock mode in a local-only env file (gitignored):

- Copy `web/.env.local.example` to `web/.env.local`
- Keep `VITE_USE_MOCK_CV=1`

```bash
cd web
npm install   # downloads dependencies (only needed once)
npm run dev   # starts a local dev server at http://localhost:5173
```

In `web-only` mode, the app can still show rich landing-page details from:

- `web/public/public-profile.json` (already included in this repo — edit this to customise the landing page), or
- `VITE_PUBLIC_NAME` and `VITE_PUBLIC_TITLE` as minimal fallback text.

## API only

Run this if you want to test the server-side token and CV data locally.

1. Install [Azure Functions Core Tools v4](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) (includes the `func` command).
2. Build and start the Functions host:

```bash
cd api
npm install
npm run build
func start
```

The API listens at `http://localhost:7071` by default (for example `POST http://localhost:7071/api/auth`).

To run the API locally with secrets, create `api/local.settings.json` (gitignored — it will not be committed). **`CV_ACCESS_TOKEN` must be exactly 32 hexadecimal characters** (see [security.md](security.md#access-token-format)); **`CV_SESSION_SIGNING_KEY`** is required and should be a long random secret (at least 32 characters).

You can copy the committed template and edit values:

- Copy `api/local.settings.example.json` to `api/local.settings.json`
- Set `CV_ACCESS_TOKEN`, `CV_SESSION_SIGNING_KEY`, `PRIVATE_PROFILE_JSON_URL`, and `PUBLIC_PROFILE_JSON_URL` (plus optional photo settings).

Minimal `Values` shape:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "CV_ACCESS_TOKEN": "0123456789abcdef0123456789abcdef",
    "CV_SESSION_SIGNING_KEY": "<random-secret-at-least-32-chars>",
    "PRIVATE_PROFILE_JSON_URL": "https://<account>.blob.core.windows.net/<container>/private-profile.json?<sas>",
    "PUBLIC_PROFILE_JSON_URL": "https://<account>.blob.core.windows.net/<container>/public-profile.json?<sas>",
    "PROFILE_PHOTO_URL": "https://<account>.blob.core.windows.net/<container>/<blob>",
    "PROFILE_PHOTO_SAS_TOKEN": "sp=...&st=...&se=...&spr=https&sv=...&sr=b&sig=..."
  }
}
```

## Web + API together locally

The Vite dev server (`npm run dev` in `web/`) calls `/api/...` as **same-origin** relative URLs. It does **not** proxy to `localhost:7071` by default, so the browser will not reach the local Functions host unless you use a combined dev setup. Options:

- Use the [Azure Static Web Apps CLI](https://learn.microsoft.com/en-us/azure/static-web-apps/local-development) (`swa`) to run the frontend and API together, or
- Rely on [mock mode](mock-data.md) for UI-only work, or
- Test deployed / staging SWA where the site and API share one origin.
