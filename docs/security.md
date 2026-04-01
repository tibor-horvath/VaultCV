# Security model (important)

This is **real server-side enforcement**: without a valid signed session token, the CV API returns 401 (access denied) and the website cannot load your CV data at all.

Session details:

- Session cookie name: `cv_session`
- Cookie flags: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`
- Expiry: controlled by `CV_SESSION_TTL_SECONDS` (default `3600`)
- UX behavior: when the session expires, the app returns to the landing page (same origin, root URL)

## Public vs private configuration

- **Public (`VITE_*`)**: embedded into the built web bundle. Only use for non-sensitive values like display name, title, and branding links.
- **Private (server-side app settings)**: never commit. This includes `CV_SESSION_SIGNING_KEY` and any deployment tokens.

Local-only files that should remain uncommitted:

- `web/.env.local`
- `api/local.settings.json`

