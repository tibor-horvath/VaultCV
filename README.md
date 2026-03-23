# VaultCV 

A modern React CV SPA where **personal CV data is never bundled into the public site**.

**New to this? Start here:** VaultCV is a personal CV website you self-host on Azure. Your CV content stays private on the server — visitors only see your name and a prompt to enter an access code. You share a private link (or QR code) that contains the code, so only people you choose can read your full CV.

- The static site (`web/`) is a "locked by default" shell.
- The private CV JSON is returned by an API (`/api/cv`) **only** when a valid short-lived bearer token is provided.

## How it works (plain English)

1. You write your CV data as a JSON string and store it as a secret setting in Azure — it never lives in this repo.
2. You deploy this app to Azure Static Web Apps (free tier). It hosts the website and the API together.
3. You generate a random secret token and store it in Azure too.
4. Your shareable link looks like `https://your-site.azurestaticapps.net/cv?t=YOUR_TOKEN`.
5. The app exchanges that access code using `POST /api/auth` (JSON body) for a short-lived bearer token, then loads CV data from `/api/cv` using the `Authorization` header.

## Repo structure

- `web/`: React + TypeScript SPA (Vite) — the website visitors see
- `api/`: Azure Functions (TypeScript) — the server-side API that guards your CV data
- `staticwebapp.config.json`: routing and security headers config

`staticwebapp.config.json` at the repo root is the canonical config. Before web builds, `npm run build` in `web/` syncs this file into `web/staticwebapp.config.json` and `web/public/staticwebapp.config.json` to avoid config drift.

## Security model (important)

This is **real server-side enforcement**: without a valid bearer token, the CV API returns 401 (access denied) and the website cannot load your CV data at all.

The shared `?t=` access code still behaves like a bearer secret: anyone you share it with can forward it. If you need identity-based, non-shareable access later, switch to Azure AD / Azure AD B2C authentication.

## Public home page

The default route (`/`) intentionally shows only:

- Your **name** and **title** (configured via `web/.env.local` or your build pipeline)
- An **access code** input to unlock the full CV

These two values are the only things baked into the deployed website. Everything else — your full profile details, bio, links — is loaded at runtime from the API or a fallback file.

Set these **public** (safe-to-ship) variables for the web app:

- `VITE_PUBLIC_NAME` — your display name (e.g. `Jane Smith`)
- `VITE_PUBLIC_TITLE` — your job title or headline (e.g. `Senior Software Engineer`)

For the rest of the public profile (location/focus/bio/links/tags), you can use either:

- `PUBLIC_PROFILE_JSON` (served by `/api/public-profile`, preferred in deployed environments)
- `web/public/public-profile.json` (fallback file, useful for web-only local dev — edit this file to customise the landing page when running locally)

At runtime, the landing page loads public profile data in this order:
1. `GET /api/public-profile`
2. If unavailable, `GET /public-profile.json`

## Localization

VaultCV supports two localization layers:

- **UI localization**: labels, buttons, status/error text in the React app.
- **Content localization**: CV/public profile payloads selected by locale.

### Locale selection and fallback

- Active locale comes from this order: URL `lang` query -> `localStorage` -> browser language.
- Supported locales are configured by `VITE_SUPPORTED_LOCALES` (comma-separated, e.g. `en,hu,de`).
- Locale fallback follows `exact -> base -> en` (example: `de-AT -> de -> en`).

### UI message catalogs

- Message catalogs live in `web/src/i18n/messages/` (`en.ts`, `hu.ts`, `de.ts`, ...).
- Locale governance is centralized in `web/src/i18n/localeRegistry.ts`.
- Startup validation ensures every configured locale has message coverage (direct or base locale), with `en` as required fallback.

### Localized content payloads (API)

The API endpoints support locale-specific environment variables:

- CV endpoint (`/api/cv`)
  - `PRIVATE_PROFILE_JSON_<LOCALE>` (example: `PRIVATE_PROFILE_JSON_DE`, `PRIVATE_PROFILE_JSON_HU`)
  - fallback to `PRIVATE_PROFILE_JSON`
- Public profile endpoint (`/api/public-profile`)
  - `PUBLIC_PROFILE_JSON_<LOCALE>` (example: `PUBLIC_PROFILE_JSON_DE`)
  - fallback to `PUBLIC_PROFILE_JSON`

API locale resolution is centralized in `api/lib/localeRegistry.ts` and follows the same `exact -> base -> en` behavior.

### Localized fallback files (web-only dev)

When API/local env vars are not available, web can use static fallback files in `web/public/`:

- `public-profile.en.json`
- `public-profile.hu.json`
- `public-profile.de.json`
- and generic fallback `public-profile.json`

### Add a new locale

1. Add the locale to `VITE_SUPPORTED_LOCALES` (web env).
2. Add a UI message catalog in `web/src/i18n/messages/`.
3. Add localized content payloads:
   - `PRIVATE_PROFILE_JSON_<LOCALE>`
   - `PUBLIC_PROFILE_JSON_<LOCALE>`
4. Optionally add `web/public/public-profile.<locale>.json` for web-only fallback/local testing.

## CV JSON schema (overview)

You control the CV content via the `PRIVATE_PROFILE_JSON` environment variable (server-side). This is a JSON string you write once and store as a secret in Azure — it never goes into this repo.

> **Not familiar with JSON?** JSON is a plain-text data format that looks like `{"key": "value"}`. You can write it in any text editor. Use [jsonlint.com](https://jsonlint.com) to check your JSON for errors before pasting it into Azure.

Key fields:

- `basics`: `{ name, headline, email?, location?, summary?, photoAlt? }`
  - `photoAlt` is optional and used as the `alt` attribute for the profile image (defaults to `{name} profile photo`).
  - Keep photo bytes out of `PRIVATE_PROFILE_JSON`. Configure `PROFILE_PHOTO_URL` (+ optional `PROFILE_PHOTO_SAS_TOKEN`) so the API injects `basics.photoUrl` at request time.
- `links`: only **GitHub** and **LinkedIn** are rendered in the header right now
- `credentials`: array of `{ issuer, label, url, dateEarned?, dateExpires? }` where `issuer` is one of `microsoft | aws | google | language | other`
- `languages`: string array, shown as chips
- `experience`: supports `companyUrl?` to link the company name, `companyLinkedInUrl?` to show a LinkedIn icon link, and `skills?` to show per-job skill chips
- `projects`: array of `{ name, description, links?, tags? }`. In each `links` entry, `label` + `url`:
  - Labels **`github`** and **`web`** (case-insensitive) render as a **GitHub** or **globe** icon next to the project name (icon links to `url`).
  - Any other label is shown as a text link under the project (with tags).

The local settings example file (`api/local.settings.example.json`) contains a complete sample `PRIVATE_PROFILE_JSON` value you can start from.

## Local development

> **What you need installed:** [Node.js 20+](https://nodejs.org/) (includes `npm`). Confirm with `node -v` in a terminal. You don't need Azure tools just to run the site locally.

### Web only

This is the fastest way to see the site running. It shows the landing page with data from `web/public/public-profile.json`.

```bash
cd web
npm install   # downloads dependencies (only needed once)
npm run dev   # starts a local dev server at http://localhost:5173
```

In `web-only` mode, the app can still show rich landing-page details from:
- `web/public/public-profile.json` (already included in this repo — edit this to customise the landing page), or
- `VITE_PUBLIC_NAME` and `VITE_PUBLIC_TITLE` as minimal fallback text.

### API only

Run this if you want to test the server-side token and CV data locally:

```bash
cd api
npm install
npm run build
```

To run the API locally with secrets, create `api/local.settings.json` (this repo ignores it — it will never be committed) and add:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "CV_ACCESS_TOKEN": "CHANGE_ME_TO_A_LONG_RANDOM_STRING",
    "PRIVATE_PROFILE_JSON": "{\"basics\":{\"name\":\"Your Name\",\"headline\":\"Your Headline\",\"email\":\"you@example.com\"},\"links\":[{\"label\":\"GitHub\",\"url\":\"https://github.com/your-handle\"},{\"label\":\"LinkedIn\",\"url\":\"https://www.linkedin.com/in/your-handle/\"}],\"credentials\":[{\"issuer\":\"microsoft\",\"label\":\"Microsoft Learn profile\",\"url\":\"https://learn.microsoft.com/\",\"dateEarned\":\"2024-01\"}],\"languages\":[\"English\"],\"experience\":[{\"company\":\"Example Co.\",\"companyUrl\":\"https://example.com\",\"companyLinkedInUrl\":\"https://www.linkedin.com/company/example-co/\",\"skills\":[\"React\",\"TypeScript\",\"Azure\"],\"role\":\"Software Engineer\",\"start\":\"2023\",\"end\":\"2026\",\"location\":\"Remote\",\"highlights\":[\"Did a thing.\"]}]}",
    "PROFILE_PHOTO_URL": "https://<account>.blob.core.windows.net/<container>/<blob>",
    "PROFILE_PHOTO_SAS_TOKEN": "sp=...&st=...&se=...&spr=https&sv=...&sr=b&sig=..."
  }
}
```

You can also start from the committed example file:
- Copy `api/local.settings.example.json` to `api/local.settings.json`
- Edit `CV_ACCESS_TOKEN` and `PRIVATE_PROFILE_JSON`

## Deployment (Azure Static Web Apps)

> **Cost:** Azure Static Web Apps has a **free tier** that is sufficient for this project. You only need a paid plan if you require custom authentication providers. A free Azure account includes enough credit to get started — sign up at [azure.microsoft.com/free](https://azure.microsoft.com/free).

### Prerequisites

Before deploying, make sure you have:

- **An Azure account** — [Create one free](https://azure.microsoft.com/free) if you don't have one. You'll need a credit card to verify identity, but you won't be charged for the free tier.
- **A GitHub account** — Azure SWA deploys from GitHub automatically via GitHub Actions (a built-in CI/CD pipeline). [Sign up free](https://github.com/join).
- **This repository on GitHub** — Either fork it or push your own copy. If you're new to this, see [GitHub's guide to creating a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template).
- **Azure CLI** *(optional)* — Only needed if you prefer the command-line approach (Option B below). [Install guide](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli).
- **Node.js 20+** *(local only)* — The build runs in GitHub Actions in the cloud, so you only need this if you want to test locally first.

### Step 1 — Fork or push the repo to GitHub

Azure Static Web Apps deploys directly from a GitHub repository. Every time you push a commit to your main branch, Azure automatically rebuilds and redeploys the site.

If you cloned this repo locally, push it to your own GitHub account before continuing.

### Step 2 — Create the Static Web App resource

An **Azure Static Web App** is the cloud resource that hosts your website and API together. A **Resource Group** is just a folder in Azure to keep related resources organised.

#### Option A — Azure Portal (recommended for beginners)

1. Go to the [Azure Portal](https://portal.azure.com) and sign in.
2. In the search bar at the top, type **Static Web Apps** and select it.
3. Click **+ Create**.
4. Fill in the form:
   - **Subscription**: select your subscription (usually just one)
   - **Resource Group**: click **Create new** and give it a name like `cv-rg`
   - **Name**: any unique name, e.g. `my-cv` (this becomes part of your URL)
   - **Plan type**: select **Free**
   - **Region**: choose a region near you (e.g. `West Europe`)
5. Under **Deployment details**, choose **GitHub** as the source and click **Sign in with GitHub** to authorize Azure.
6. Select your **Organization**, **Repository**, and **Branch** (e.g. `main`).
7. Under **Build Details**, set:
   - **Build preset**: `Custom`
   - **App location**: `web`
   - **Api location**: `api`
   - **Output location**: `dist`
8. Click **Review + create**, then **Create**.

Azure will open a pull request against your GitHub repo adding a workflow file at `.github/workflows/azure-static-web-apps-<name>.yml`. **Merge that pull request** to trigger your first deployment. You can watch the progress under the **Actions** tab in your GitHub repo.

> **Forking this repo?** Delete the existing `.github/workflows/azure-static-web-apps.yml` file before or after creating your SWA resource. Azure will create a correctly configured replacement workflow file (with your own secret name and app name) via that pull request.

#### Option B — Azure CLI

```bash
az staticwebapp create \
  --name <your-app-name> \
  --resource-group <your-rg> \
  --location "westeurope" \
  --source https://github.com/<you>/<repo> \
  --branch main \
  --app-location "web" \
  --api-location "api" \
  --output-location "dist" \
  --login-with-github
```

### Step 3 — Upload a profile photo (optional)

The API can serve your photo from Azure Blob Storage without embedding it in `PRIVATE_PROFILE_JSON`. Skip this step if you don't want a profile photo.

> **What is Azure Blob Storage?** It's a file hosting service — like a private folder in the cloud. A **SAS token** (Shared Access Signature) is a special string you attach to a file URL that proves you have permission to access it, without needing a password.

1. In the [Azure Portal](https://portal.azure.com), search for **Storage accounts** and click **+ Create**.
2. Choose the same Resource Group you created earlier, give the account a name, and click **Review + create**.
3. Once created, go to the storage account → **Containers** → **+ Container**. Give it a name (e.g. `photos`) and set access to **Private**.
4. Open the container and click **Upload** to upload your photo.
5. Click on the uploaded file, then click **Generate SAS**. Set:
   - **Permissions**: Read
   - **Expiry**: set a date a year or more away (you can regenerate it later)
   - Click **Generate SAS token and URL**
6. Copy the **Blob SAS URL** — split it at the `?`: the part before is `PROFILE_PHOTO_URL`, the part from `?` onward (including the `?`) is `PROFILE_PHOTO_SAS_TOKEN`.

### Step 4 — Configure Application settings

Application settings are the secure, server-side environment variables Azure injects into your API at runtime. **These never appear in your code or git history.**

In the Azure Portal, open your Static Web App → **Settings** → **Environment variables**, and add:

| Setting | Value |
|---|---|
| `CV_ACCESS_TOKEN` | A long random secret — the code in your shareable link. Generate one: `[guid]::NewGuid().ToString("N")` (PowerShell) or `openssl rand -hex 32` (bash). |
| `CV_SESSION_SIGNING_KEY` | Required signing secret for short-lived session tokens. Use a different random value than `CV_ACCESS_TOKEN` (do not reuse). |
| `CV_SESSION_TTL_SECONDS` | Optional session token lifetime in seconds. Default: `3600` (1 hour). Allowed range: `60` to `86400`. |
| `PRIVATE_PROFILE_JSON` | Your full private CV as a JSON string. Use the example in `api/local.settings.example.json` as a starting point. Validate your JSON at [jsonlint.com](https://jsonlint.com) before pasting. |
| `PUBLIC_PROFILE_JSON` | Your public profile JSON string (shown on the landing page). |
| `PROFILE_PHOTO_URL` | Azure Blob URL of your profile photo (the part before `?` from Step 3). |
| `PROFILE_PHOTO_SAS_TOKEN` | SAS token string from Step 3 (starting with `?` or without — both work). |

> **Tip:** `PRIVATE_PROFILE_JSON` and `PUBLIC_PROFILE_JSON` are long strings. You can paste them directly into the value field in the portal. Alternatively, use the Azure CLI:
> ```bash
> az staticwebapp appsettings set \
>   --name <your-app-name> \
>   --resource-group <your-rg> \
>   --setting-names CV_ACCESS_TOKEN="<token>" PRIVATE_PROFILE_JSON='<json>'
> ```

If `PUBLIC_PROFILE_JSON` is not set, the UI can still fall back to `/public-profile.json` when that file is shipped with the web app.

### Step 5 — Verify the deployment

1. In the Azure Portal, open your Static Web App and copy the **URL** from the overview page (e.g. `https://nice-river-abc123.azurestaticapps.net`).
2. Open the URL in your browser — you should see the landing page with your name and title.
3. Open `https://<your-site>/cv?t=<CV_ACCESS_TOKEN>` to confirm the full CV unlocks correctly.

### Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| GitHub Actions workflow fails | Build error in the code | Check the **Actions** tab in your GitHub repo for the error message. |
| API returns 401 for every request | Token mismatch or expired session | Double-check `CV_ACCESS_TOKEN` in Azure settings matches the `?t=` value in your `/cv?t=...` URL exactly, then retry to get a fresh session token. Increase `CV_SESSION_TTL_SECONDS` if your intended session window is longer. |
| API returns "Server is not configured." | Missing required auth config | Ensure both `CV_ACCESS_TOKEN` and `CV_SESSION_SIGNING_KEY` are set in Azure app settings. |
| Landing page shows no profile details | Missing public profile | Check that `PUBLIC_PROFILE_JSON` is set in Azure settings, or that `web/public/public-profile.json` is present. |
| Profile photo not loading | Invalid URL or expired SAS token | Regenerate a SAS token in Azure Storage and update `PROFILE_PHOTO_SAS_TOKEN`. |
| Site shows "page not found" for routes | Routing config missing | Ensure `staticwebapp.config.json` was deployed — it should be in the `web/public/` folder. |

## QR code URL format

Your shareable access link should look like:

- `https://<your-site>/cv?t=<TOKEN>`

You can turn this into a QR code using any free QR generator (search "free QR code generator"). Print it on a business card or add it to your paper CV.

The SPA uses the code like this:

- `POST /api/auth` with body `{"code":"<TOKEN>"}` to obtain a short-lived bearer token
- `GET /api/cv?lang=<locale>` with `Authorization: Bearer <accessToken>`

## 6‑month access code rotation (manual)

This repo uses a single server-side token (`CV_ACCESS_TOKEN`). To make the access code expire every ~6 months, rotate it twice a year. This is optional but recommended if you want to limit how long a shared link stays valid.

- **1) Generate a new token** (use a long random string)
  - PowerShell:

```powershell
[guid]::NewGuid().ToString("N")
```

  - Bash / macOS Terminal:

```bash
openssl rand -hex 32
```

- **2) Update `CV_ACCESS_TOKEN`** in your Azure Static Web App's **Settings → Environment variables**.
- **3) Update your shareable link** — your old `/cv?t=<OLD_TOKEN>` links will stop working. Update any printed CVs, emails, or QR codes with the new `/cv?t=<NEW_TOKEN>` value.
- **4) Keep `CV_SESSION_SIGNING_KEY` separate** from `CV_ACCESS_TOKEN`; rotate it independently if needed.
- **5) Optional:** set `CV_SESSION_TTL_SECONDS` (default `3600`) to tune session duration.

## Mock data for local UI testing (no API required)

If you want to see a fully populated CV UI locally without setting up Azure Functions, use the web mock mode. This is the easiest way to preview your CV design quickly.

- Copy `web/.env.example` to `web/.env.local`
- Ensure it contains `VITE_USE_MOCK_CV=1`
- Run `npm run dev` in `web/`

The mock data is defined in the web source and is only active when `VITE_USE_MOCK_CV=1` is set — it is never used in production.
