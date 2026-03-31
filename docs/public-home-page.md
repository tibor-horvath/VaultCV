# Public home page

The default route (`/`) intentionally shows a public-safe subset of your CV:

- Basics, links, and other sections that are explicitly marked public in the admin editor
- An **access code** input to unlock the full private CV

No private CV payload is bundled into the static site. Public content is loaded at runtime from `GET /api/public-profile`; full CV access still requires token/session flow via `/api/cv`.

`VITE_*` variables are **build-time**: they are embedded when you run `npm run build` (or your CI build). Set them in `web/.env.local` locally or in your pipeline’s web build step.

Set these **public** (safe-to-ship) variables for the web app:

- `VITE_PUBLIC_NAME` — your display name (e.g. `Jane Smith`)
- `VITE_PUBLIC_TITLE` — your job title or headline (e.g. `Senior Software Engineer`)

Optional branding variables (used in the site footer and PDF footer):

- `VITE_BRAND_NAME`
- `VITE_BRAND_REPO_URL`
- `VITE_BRAND_LINKEDIN_URL`
- `VITE_BRAND_COPYRIGHT_NAME`

Public content is served from your public profile blob via `GET /api/public-profile`.

At runtime, the landing page loads public profile data in this order:

1. `GET /api/public-profile`

Even in public mode, some fields are intentionally always private and are not rendered on landing:

- `email`, `mobile`
- credential dates (`dateEarned`, `dateExpires`)
- education-sensitive metadata (for example GPA/honors/thesis/advisor)
