# VaultCV

A modern React CV SPA where **personal CV data is never bundled into the public site**.

**New to this?** VaultCV is a personal CV website you self-host on Azure. Your CV content stays private on the server — visitors only see your name and a prompt to enter an access code. You share a private link (or QR code) that contains the code, so only people you choose can read your full CV.

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
| Shareable links, QR, API auth flow | [docs/qr-code-url-format.md](docs/qr-code-url-format.md) |
| Access code rotation (~6 months) | [docs/access-code-rotation.md](docs/access-code-rotation.md) |
| Mock CV for local UI testing | [docs/mock-data.md](docs/mock-data.md) |
| PDF export (basics card; html2canvas + jsPDF) | [docs/pdf-export.md](docs/pdf-export.md) |

