# Public home page

The default route (`/`) intentionally shows only:

- Your **name** and **title** (configured via `web/.env.local` or your build pipeline)
- An **access code** input to unlock the full CV

These two values are the only things baked into the deployed website. Everything else — your full profile details, bio, links — is loaded at runtime from the API or a fallback file.

`VITE_*` variables are **build-time**: they are embedded when you run `npm run build` (or your CI build). Set them in `web/.env.local` locally or in your pipeline’s web build step.

Set these **public** (safe-to-ship) variables for the web app:

- `VITE_PUBLIC_NAME` — your display name (e.g. `Jane Smith`)
- `VITE_PUBLIC_TITLE` — your job title or headline (e.g. `Senior Software Engineer`)

For the rest of the public profile (location/focus/bio/links/tags), you can use either:

- `PUBLIC_PROFILE_JSON` (served by `/api/public-profile`, preferred in deployed environments)
- `web/public/public-profile.json` (fallback file, useful for web-only local dev — edit this file to customise the landing page when running locally)

At runtime, the landing page loads public profile data in this order:

1. `GET /api/public-profile`
2. If unavailable, `GET /public-profile.json`
