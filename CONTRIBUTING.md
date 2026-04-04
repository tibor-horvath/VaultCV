# Contributing to VaultCV

Thanks for contributing.

## Prerequisites

- Node.js **20.19+** (Node.js 22 recommended; CI uses 22)
- npm
- Azure Functions Core Tools v4 (`func`) only if you plan to run the API locally

## Local setup

Install dependencies with lockfile-based installs:

```bash
npm ci
cd web && npm ci
cd ../api && npm ci
```

Common commands:

```bash
# web
cd web && npm run dev
cd web && npm run lint
cd web && npm run test

# api
cd api && npm run build
cd api && npm run test

# all tests from root
npm test
```

For UI-only work, enable mock mode:

- Copy `web/.env.local.example` to `web/.env.local`
- Keep `VITE_USE_MOCK_CV=1`

## Quality expectations

- Keep changes focused and scoped to the issue.
- Run relevant tests before opening a PR (`npm test` at minimum for cross-package changes).
- Run `cd web && npm run lint` for frontend changes.
- Update docs when behavior, setup, or environment requirements change.

## Commit conventions

VaultCV uses [Conventional Commits](https://www.conventionalcommits.org/) in the upstream template repository so `release-please` can generate version bumps and release notes automatically.

Examples:

- `feat: add public profile QR download`
- `fix: prevent duplicate share-link creation`
- `feat!: change public profile URL format`
- `docs: clarify local development`

As a rule of thumb:

- `feat:` -> minor release
- `fix:` -> patch release
- `!` or `BREAKING CHANGE:` -> breaking release

## Release automation

The upstream VaultCV template repository uses `release-please` to open release PRs and maintain `CHANGELOG.md`, GitHub tags, and GitHub Releases from changes merged into `main`.

If you create a repository from this template, this automation is **optional**. You may keep, modify, or remove `.github/workflows/release-please.yml` to match your own release process.

## Pull requests

- Use a descriptive title and explain the motivation (why), not only file changes (what).
- Include a short test plan with exact commands run.
- Link related issues when available.
- Avoid mixing unrelated refactors with functional changes.

## Documentation map

- Architecture and flow: `docs/how-it-works.md`
- Security model: `docs/security.md`
- Local setup: `docs/local-development.md`
- Deployment: `docs/deployment-azure.md`
- Release process: `docs/release-process.md`
- Admin flows: `docs/admin.md`

## Security notes

- Never commit secrets (`.env.local`, `api/local.settings.json`, tokens, connection strings).
- Keep access credentials in Azure app settings/Key Vault, not in source control.
