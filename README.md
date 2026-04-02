# VaultCV

A modern React CV SPA where **personal CV data is never bundled into the public site**.

**New to this?** VaultCV is a personal CV website you self-host on Azure. Your full CV content stays private on the server. Visitors can see a configurable public subset on the landing page, and use an access code link (or QR code) to unlock the full CV.

- The static site (`web/`) is a "locked by default" shell.
- The private CV JSON is returned by an API (`/api/cv`) **only** when a valid short-lived signed session token is provided.

## Documentation

Suggested order if you are setting up from scratch: [How it works](docs/how-it-works.md) → [Local development](docs/local-development.md) (optional) → [Deployment](docs/deployment-azure.md). Use the index below for everything else.

| Topic | Doc |
|--------|-----|
| How it works | [docs/how-it-works.md](docs/how-it-works.md) |
| Repo structure | [docs/repo-structure.md](docs/repo-structure.md) |
| Security model | [docs/security.md](docs/security.md) |
| Public home page & env vars | [docs/public-home-page.md](docs/public-home-page.md) |
| Localization | [docs/localization.md](docs/localization.md) |
| CV JSON schema | [docs/cv-json-schema.md](docs/cv-json-schema.md) |
| Local development | [docs/local-development.md](docs/local-development.md) |
| Deployment (Azure Static Web Apps) | [docs/deployment-azure.md](docs/deployment-azure.md) |
| Admin mode (Entra roles, profile management) | [docs/admin.md](docs/admin.md) |
| Shareable links, QR, API auth flow | [docs/qr-code-url-format.md](docs/qr-code-url-format.md) |
| Share link management & rotation | [docs/share-links.md](docs/share-links.md) |
| Mock CV for local UI testing | [docs/mock-data.md](docs/mock-data.md) |
| Syncing with the upstream template | [docs/template-sync.md](docs/template-sync.md) |
| PDF export (basics card; html2canvas + jsPDF) | [docs/pdf-export.md](docs/pdf-export.md) |
| Contributing guide | [CONTRIBUTING.md](CONTRIBUTING.md) |
| License | [LICENSE](LICENSE) |

## Developer quickstart

Node.js **20.19+** is required locally (Node.js 22 is recommended and used in CI).

```bash
# from repo root
npm ci
cd web && npm ci
cd ../api && npm ci
```

```bash
# run web UI (mock mode optional)
cd web
cp .env.local.example .env.local
npm run dev
```

```bash
# tests
npm test            # from repo root (web + api)
cd web && npm run lint
```

For UI-only work without Azure/Functions, set `VITE_USE_MOCK_CV=1` in `web/.env.local`.

## Customize branding (optional)

The site footer (and the generated PDF footer) can be customized via public Vite environment variables:

- `VITE_BRAND_NAME`
- `VITE_BRAND_REPO_URL`
- `VITE_BRAND_LINKEDIN_URL`
- `VITE_BRAND_COPYRIGHT_NAME`

For local dev, set these in `web/.env.local` (gitignored). For Azure Static Web Apps, set them as application settings / environment variables for the Static Web App.

## Acknowledgments

Parts of this repository were developed using [Cursor](https://cursor.com) (AI-assisted editing).

