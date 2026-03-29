# Deployment (Azure Static Web Apps)

> **Cost:** Azure Static Web Apps has a **free tier** that is sufficient for this project. You only need a paid plan if you require custom authentication providers. A free Azure account includes enough credit to get started — sign up at [azure.microsoft.com/free](https://azure.microsoft.com/free).

## Prerequisites

Before deploying, make sure you have:

- **An Azure account** — [Create one free](https://azure.microsoft.com/free) if you don't have one. You'll need a credit card to verify identity, but you won't be charged for the free tier.
- **A GitHub account** — Azure SWA deploys from GitHub automatically via GitHub Actions (a built-in CI/CD pipeline). [Sign up free](https://github.com/join).
- **This repository on GitHub** — Either fork it or push your own copy. If you're new to this, see [GitHub's guide to creating a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template).
- **Azure CLI** *(optional)* — Only needed if you prefer the command-line approach (Option B below). [Install guide](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli).
- **Node.js 20+** *(local only)* — The build runs in GitHub Actions in the cloud, so you only need this if you want to test locally first.

## Step 1 — Fork or push the repo to GitHub

Azure Static Web Apps deploys directly from a GitHub repository. Every time you push a commit to your main branch, Azure automatically rebuilds and redeploys the site.

If you cloned this repo locally, push it to your own GitHub account before continuing. Azure deploys from the branch you select (often `main`); use that branch for production deploys unless you configure otherwise.

## Step 2 — Create the Static Web App resource

An **Azure Static Web App** is the cloud resource that hosts your website and API together. A **Resource Group** is just a folder in Azure to keep related resources organised.

### Option A — Azure Portal (recommended for beginners)

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

> **Forking this repo?** Delete the existing workflow under `.github/workflows/` whose name matches `azure-static-web-apps*.yml` (for example `azure-static-web-apps-calm-flower-0e7b1a603.yml`) before or after creating your SWA resource. Azure will add a replacement workflow (with your own secret name and app name) via that pull request.

### Option B — Azure CLI

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

## Step 3 — Upload a profile photo (optional)

The API can serve your photo from Azure Blob Storage without embedding image data in your profile JSON payloads. Skip this step if you don't want a profile photo.

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

7. **CORS (required for PDF export):** In the storage account, open **Settings** → **Resource sharing (CORS)** → **Blob service**. Add a rule that allows **GET** from your Static Web App origin (for example `https://your-app.azurestaticapps.net`). Allowed headers can be `*`; exposed headers can be empty. Without this, the photo may show in the browser but appear **missing in the generated PDF** (client-side canvas capture).

## Step 4 — Configure Application settings

Application settings are the secure, server-side environment variables Azure injects into your API at runtime. **These never appear in your code or git history.**

In the Azure Portal, open your Static Web App → **Settings** → **Environment variables**, and add:

| Setting | Value |
|---|---|
| `CV_ACCESS_TOKEN` | Must be **exactly 32 hexadecimal characters** (GUID without hyphens). Generate: `[guid]::NewGuid().ToString("N")` (PowerShell) or `openssl rand -hex 16` (bash — 16 bytes → 32 hex chars). Do **not** use `openssl rand -hex 32` (that yields 64 hex characters and will be rejected). See [security.md](security.md#access-token-format). |
| `CV_SESSION_SIGNING_KEY` | Required signing secret for short-lived session tokens. Use a different random value than `CV_ACCESS_TOKEN` (do not reuse). |
| `CV_SESSION_TTL_SECONDS` | Optional session token lifetime in seconds. Default: `3600` (1 hour). Allowed range: `60` to `86400`. |
| `SUPPORTED_LOCALES` | Optional comma-separated locale list exposed by `/api/locales` and used by the frontend selector (example: `en` or `en,hu,de`). Fallback: `en`. |
| `PROFILE_PAYLOAD_FETCH_TIMEOUT_MS` | Optional fetch timeout for URL payload mode. Default: `3000`. |
| `PROFILE_PAYLOAD_CACHE_TTL_MS` | Optional in-memory cache TTL for URL payload responses. Default: `60000`. |
| `PROFILE_PAYLOAD_ALLOWED_HOSTS` | Optional comma-separated host allowlist for payload URLs (example: `<account>.blob.core.windows.net`). |
| `PRIVATE_PROFILE_JSON_URL` | Required URL to private CV JSON blob. |
| `PUBLIC_PROFILE_JSON_URL` | Required URL to public profile JSON blob. |
| `PROFILE_PHOTO_URL` | Azure Blob URL of your profile photo (the part before `?` from Step 3). |
| `PROFILE_PHOTO_SAS_TOKEN` | SAS token string from Step 3 (starting with `?` or without — both work). |

> **Tip:** Azure Static Web Apps app settings have practical size limits (around 10 KB per setting). Store profile payloads in Blob and set `PRIVATE_PROFILE_JSON_URL` / `PUBLIC_PROFILE_JSON_URL`.
>
> Locale-specific URL variants are supported (for example `PRIVATE_PROFILE_JSON_URL_DE`, `PUBLIC_PROFILE_JSON_URL_HU`).
>
> You can set values via Azure CLI:
> ```bash
> az staticwebapp appsettings set \
>   --name <your-app-name> \
>   --resource-group <your-rg> \
>   --setting-names CV_ACCESS_TOKEN="<token>" PRIVATE_PROFILE_JSON_URL="https://<account>.blob.core.windows.net/<container>/private-profile.json?<sas>"
> ```

### Blob security and operations guidance

- Minimum: private container + read-only SAS (`sp=r`) with explicit expiry and a rotation schedule.
- Preferred where supported: managed identity-based blob read access, so long-lived SAS secrets are avoided.
- Keep real secrets (`CV_ACCESS_TOKEN`, `CV_SESSION_SIGNING_KEY`) in app settings/Key Vault, not in blob JSON.

### Canary rollout runbook for payload source migration

1. Add `PRIVATE_PROFILE_JSON_URL` / `PUBLIC_PROFILE_JSON_URL` (and locale-specific URL vars if needed) in non-production.
2. Validate:
   - `/api/cv` and `/api/public-profile` return expected payloads
   - locale fallback works (`exact -> base -> en`)
   - no sustained `Failed loading ... payload` logs
3. Apply the same settings in production during a canary window and monitor:
   - HTTP 5xx rate
   - API latency (median/p95)
   - loader failure reasons in logs (`http_non_2xx`, `fetch_timeout`, etc.)
4. Keep previous known-good blob URLs available so rollback is a fast settings update.

If `PUBLIC_PROFILE_JSON_URL` is not set, the UI can still fall back to `/public-profile.json` when that file is shipped with the web app.

## Step 5 — Verify the deployment

1. In the Azure Portal, open your Static Web App and copy the **URL** from the overview page (e.g. `https://nice-river-abc123.azurestaticapps.net`).
2. Open the URL in your browser — you should see the landing page with your name and title.
3. Open `https://<your-site>/?t=<CV_ACCESS_TOKEN>` to confirm the full CV unlocks correctly (paste the token or use the link; then open the CV from the landing page). Optionally try `?t=<CV_ACCESS_TOKEN>&lang=<locale>` to confirm the forced language.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| GitHub Actions workflow fails | Build error in the code | Check the **Actions** tab in your GitHub repo for the error message. |
| API returns 400 / auth says **Invalid token format** | `CV_ACCESS_TOKEN` or pasted code is not 32 hex chars | Regenerate the token (PowerShell GUID **N**, or `openssl rand -hex 16`). See [security.md](security.md#access-token-format). |
| API returns 401 for every request | Token mismatch or expired session | Double-check `CV_ACCESS_TOKEN` in Azure settings matches the `?t=` value in your shareable link (`/?t=...`) exactly, then retry to get a fresh session token. Increase `CV_SESSION_TTL_SECONDS` if your intended session window is longer. |
| API returns 401 and debug shows `signature_mismatch` while headers are present | Wrong token source selected (often a platform-injected `Authorization` bearer token) | Prefer the `cv_session` cookie over `Authorization` in API token resolution. |
| API returns "Server is not configured." | Missing required auth config | Ensure both `CV_ACCESS_TOKEN` and `CV_SESSION_SIGNING_KEY` are set in Azure app settings. |
| Landing page shows no profile details | Missing public profile config | Check that `PUBLIC_PROFILE_JSON_URL` (or locale variant) is set and reachable. |
| Profile photo not loading | Invalid URL or expired SAS token | Regenerate a SAS token in Azure Storage and update `PROFILE_PHOTO_SAS_TOKEN`. |
| Profile photo missing in **PDF** only | Blob CORS not allowing your site origin | In the storage account → **CORS** for Blob service, allow **GET** from your SWA URL. See [pdf-export.md](pdf-export.md). |
| Site shows "page not found" for routes | Routing config missing | Ensure `staticwebapp.config.json` was deployed — it should be in the `web/public/` folder. |
