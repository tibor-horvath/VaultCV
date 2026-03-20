# VaultCV 

A modern React CV SPA where **personal CV data is never bundled into the public site**.

- The static site (`web/`) is a “locked by default” shell.
- The private CV JSON is returned by an API (`/api/cv`) **only** when a valid token is provided (typically via your QR code URL).

## Repo structure

- `web/`: React + TypeScript SPA (Vite)
- `api/`: Azure Functions (TypeScript) for token-gated CV JSON
- `staticwebapp.config.json`: SPA routing + security headers

## Security model (important)

This is **real server-side enforcement**: without the token, the API returns 401 and the SPA cannot access your CV JSON.

However, **anyone you share the tokenized URL with can share it onward**. If you need identity-based, non-shareable access later, switch to Azure AD / Azure AD B2C authentication.

## Public home page

The default route (`/`) intentionally shows only:

- Your **name** and **title** (configured via `web/.env.local` or your build pipeline)
- An **access code** input to unlock the full CV

Set these **public** (safe-to-ship) variables for the web app:

- `VITE_PUBLIC_NAME`
- `VITE_PUBLIC_TITLE`

For the rest of the public profile (location/focus/bio/links/tags), you can use either:

- `PUBLIC_PROFILE_JSON` (served by `/api/public-profile`, preferred in deployed environments)
- `web/public/public-profile.json` (fallback file, useful for web-only local dev)

At runtime, the landing page loads public profile data in this order:
1. `GET /api/public-profile`
2. If unavailable, `GET /public-profile.json`

## CV JSON schema (overview)

You control the CV content via the `CV_JSON` environment variable (server-side). Key fields:

- `basics`: `{ name, headline, email?, location?, summary?, photoAlt? }`
  - `photoAlt` is optional and used as the `alt` attribute for the profile image (defaults to `{name} profile photo`).
  - Keep photo bytes out of `CV_JSON`. The API injects `basics.photoBase64` (and `basics.photoMimeType`) from `PROFILE_PHOTO_BASE64` at request time.
- `links`: only **GitHub** and **LinkedIn** are rendered in the header right now
- `credentials`: array of `{ issuer, label, url }` where `issuer` is one of `microsoft | aws | google | other`
- `languages`: string array, shown as chips
- `experience`: supports `companyUrl?` to link the company name, `companyLinkedInUrl?` to show a LinkedIn icon link, and `skills?` to show per-job skill chips
- `projects`: project grid

## Local development

### Web only

```bash
cd web
npm install
npm run dev
```

In `web-only` mode, the app can still show rich landing-page details from:
- `web/public/public-profile.json` (already included in this repo), or
- `VITE_PUBLIC_NAME` and `VITE_PUBLIC_TITLE` as minimal fallback text.

### API only

```bash
cd api
npm install
npm run build
```

To run the API locally with secrets, create `api/local.settings.json` (this repo ignores it) and add:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "CV_ACCESS_TOKEN": "CHANGE_ME_TO_A_LONG_RANDOM_STRING",
    "CV_JSON": "{\"basics\":{\"name\":\"Your Name\",\"headline\":\"Your Headline\",\"email\":\"you@example.com\"},\"links\":[{\"label\":\"GitHub\",\"url\":\"https://github.com/your-handle\"},{\"label\":\"LinkedIn\",\"url\":\"https://www.linkedin.com/in/your-handle/\"}],\"credentials\":[{\"issuer\":\"microsoft\",\"label\":\"Microsoft Learn profile\",\"url\":\"https://learn.microsoft.com/\"}],\"languages\":[\"English\"],\"experience\":[{\"company\":\"Example Co.\",\"companyUrl\":\"https://example.com\",\"companyLinkedInUrl\":\"https://www.linkedin.com/company/example-co/\",\"skills\":[\"React\",\"TypeScript\",\"Azure\"],\"role\":\"Software Engineer\",\"start\":\"2023\",\"end\":\"2026\",\"location\":\"Remote\",\"highlights\":[\"Did a thing.\"]}]}",
    "PROFILE_PHOTO_BASE64": "REPLACE_ME_BASE64"
  }
}
```

You can also start from the committed example file:
- Copy `api/local.settings.example.json` to `api/local.settings.json`
- Edit `CV_ACCESS_TOKEN` and `CV_JSON`

## Deployment (Azure Static Web Apps)

Create an Azure Static Web App and set:

- **App location**: `web`
- **Api location**: `api`
- **Output location**: `dist`

Then configure **Application settings** (in the SWA resource):

- `CV_ACCESS_TOKEN`: a long random secret (this is what your QR carries)
- `CV_JSON`: your private CV JSON payload (keep it out of git)
- `PROFILE_PHOTO_BASE64`: base64 content of your profile photo (the API turns it into a `data:image/jpeg;base64,...` URL; if you need a different mime type, set `PROFILE_PHOTO_MIME_TYPE`)
- `PUBLIC_PROFILE_JSON`: your public profile JSON payload (used for `/api/public-profile`)

If `PUBLIC_PROFILE_JSON` is not set, the UI can still fall back to `/public-profile.json` when that file is shipped with the web app.

## QR code URL format

Your access link should be:

- `https://<your-site>/?t=<TOKEN>`

The SPA forwards the token to:

- `/api/cv?t=<TOKEN>`

## 6‑month access code rotation (manual)

This repo uses a single server-side token (`CV_ACCESS_TOKEN`). To make the access code expire every ~6 months, rotate it twice a year.

- **1) Generate a new token** (use a long random string)
  - Example (PowerShell):

```powershell
[guid]::NewGuid().ToString("N")
```

- **2) Update your Azure Static Web App Application setting** `CV_ACCESS_TOKEN` to the new value.
- **3) Update your printed/digital CV** with the new `/?t=<NEW_TOKEN>` link (and QR, if you generate one externally).

## Mock data for local UI testing (no API required)

If you want to see a filled CV UI locally without running the Functions API, use the web mock mode:

- Copy `web/.env.example` to `web/.env.local`
- Ensure it contains `VITE_USE_MOCK_CV=1`
- Run `npm run dev` in `web/`
