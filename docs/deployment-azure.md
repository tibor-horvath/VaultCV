# Deployment (Azure Static Web Apps)

> **Cost:** Azure Static Web Apps has a **free tier** that is sufficient for this project. You only need a paid plan if you require custom authentication providers. A free Azure account includes enough credit to get started — sign up at [azure.microsoft.com/free](https://azure.microsoft.com/free).

## Prerequisites

Before deploying, make sure you have:

- **An Azure account** — [Create one free](https://azure.microsoft.com/free) if you don't have one. You'll need a credit card to verify identity, but you won't be charged for the free tier.
- **A GitHub account** — Azure SWA deploys from GitHub automatically via GitHub Actions (a built-in CI/CD pipeline). [Sign up free](https://github.com/join).
- **This repository on GitHub** — Either fork it or push your own copy. If you're new to this, see [GitHub's guide to creating a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template).
- **Azure CLI** *(optional)* — Only needed if you prefer the command-line approach (Option B below). [Install guide](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli).
- **Node.js 20.19+** *(local only; Node.js 22 recommended)* — The build runs in GitHub Actions in the cloud (Node.js 22), so you only need local Node if you want to test before pushing.

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

> **Using this template?** This repository does not include a pre-configured deployment workflow. When you link your new repository to an Azure SWA resource, Azure opens a pull request that adds a workflow file at `.github/workflows/azure-static-web-apps-<name>.yml` containing your app-specific secret name and resource identifier. Merge that pull request to activate deployments.

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

Profile photos are uploaded and managed directly through the **admin editor** — no manual blob or SAS configuration is required. Skip this step if you don't want a profile photo.

Once your site is deployed and you have admin access (see Step 5 and the [admin guide](admin.md)):

1. Open your site and sign in as an admin.
2. Go to `/admin/editor`.
3. In the **Basics** section, click **Upload photo** and select a JPEG or PNG image.
4. Use the crop tool to position and zoom the image, then click **Confirm**.
5. Toggle **Profile photo** to control whether the photo appears on the public landing page.
6. Click **Save** to persist the changes.

The photo is stored in the same Azure Blob Storage container as your profile JSON (configured in Step 4 via `CV_PROFILE_CONTAINER`). No separate storage account or SAS token setup is needed.

## Step 4 — Configure Application settings

Application settings are the secure, server-side environment variables Azure injects into your API at runtime. **These never appear in your code or git history.**

In the Azure Portal, open your Static Web App → **Settings** → **Environment variables**, and add:

| Setting | Value |
|---|---|
| `CV_ACCESS_TOKEN` | Must be **exactly 32 hexadecimal characters** (GUID without hyphens). Generate: `[guid]::NewGuid().ToString("N")` (PowerShell) or `openssl rand -hex 16` (bash — 16 bytes → 32 hex chars). Do **not** use `openssl rand -hex 32` (that yields 64 hex characters and will be rejected). See [security.md](security.md#access-token-format). |
| `CV_SESSION_SIGNING_KEY` | Required signing secret for short-lived session tokens. Use a different random value than `CV_ACCESS_TOKEN` (do not reuse). |
| `CV_SESSION_TTL_SECONDS` | Optional session token lifetime in seconds. Default: `3600` (1 hour). Allowed range: `60` to `86400`. |
| `SUPPORTED_LOCALES` | Optional comma-separated locale list exposed by `/api/locales` and used by the frontend selector (example: `en` or `en,hu,de`). Fallback: `en`. |
| `CV_PROFILE_SLUG` | Required slug used in blob filenames (for example `john-doe`). This is the **primary** identifier for your profile across the public site and the admin editor. |
| `CV_PROFILE_STORAGE_CONNECTION_STRING` | Required Azure Storage connection string (or use `AZURE_STORAGE_CONNECTION_STRING`). |
| `CV_PROFILE_CONTAINER` | Required container name that holds your profile JSON blobs. |
| `CV_ALLOWED_ORIGINS` | Optional comma-separated origin allowlist for admin mutations (used by CSRF guard). Recommended when you have multiple domains (e.g. apex + `www`). |
| `AZURE_STORAGE_CONNECTION_STRING` | Required for share links (Table Storage). Connection string to the storage account where the `sharelinks` table lives. |
| `CV_SHARELINKS_TABLE` | Optional Table Storage table name for share links. Default: `sharelinks`. |

> Profile JSON is stored in Blob Storage using these filenames:
>
> - `{CV_PROFILE_SLUG}-private-profile-{locale}.json`
> - `{CV_PROFILE_SLUG}-public-profile-{locale}.json`
>
> The admin editor endpoints (`/api/manage/profile/*`) also use `CV_PROFILE_SLUG`.
>
> You can set values via Azure CLI:
> ```bash
> az staticwebapp appsettings set \
>   --name <your-app-name> \
>   --resource-group <your-rg> \
>   --setting-names CV_ACCESS_TOKEN="<token>" CV_PROFILE_SLUG="john-doe" CV_PROFILE_CONTAINER="profiles"
> ```

### Blob security and operations guidance

- Minimum: private container + read-only SAS (`sp=r`) with explicit expiry and a rotation schedule.
- Preferred where supported: managed identity-based blob read access, so long-lived SAS secrets are avoided.
- Keep real secrets (`CV_ACCESS_TOKEN`, `CV_SESSION_SIGNING_KEY`) in app settings/Key Vault, not in blob JSON.

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
| Landing page shows no profile details | Missing public profile blob | Ensure `CV_PROFILE_SLUG`, `CV_PROFILE_STORAGE_CONNECTION_STRING` (or `AZURE_STORAGE_CONNECTION_STRING`), and `CV_PROFILE_CONTAINER` are set, and the `{slug}-public-profile-{locale}.json` blob exists. |
| Profile photo not loading | No image uploaded yet | Upload a photo via the admin editor: `/admin/editor` → Basics → **Upload photo**. |
| Site shows "page not found" for routes | Routing config missing | Ensure `staticwebapp.config.json` was deployed — it should be in the `web/public/` folder. |
