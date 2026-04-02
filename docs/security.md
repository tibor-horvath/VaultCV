# Security model (important)

This is **real server-side enforcement**: without a valid signed session token, the CV API returns 401 (access denied) and the website cannot load your CV data at all.

Session details:

- Session cookie name: `cv_session`
- Cookie flags: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`
- Expiry: controlled by `CV_SESSION_TTL_SECONDS` (default `3600`)
- UX behavior: when the session expires, the app returns to the landing page (same origin, root URL)
- **Revocation**: session tokens are cryptographically bound to their originating share link ID. When you revoke a share link from the admin panel, all existing sessions using that link are immediately invalidated on the next API request, even if the token has not expired.

## Share link revocation & immediate session invalidation

When a share link is revoked via the admin panel:

1. The share link record is marked as revoked in Azure Table Storage
2. On the **next API request** from any holder of that share's session token, the server re-validates the share link status
3. If the link is no longer valid (revoked, expired, or deleted), the API returns 401 and the session ends
4. The user must re-authenticate with a new or different share link

This ensures that revoking a share link is effective and cannot be bypassed by holding a still-valid session token. The validation is synchronous and happens on every protected endpoint (`/api/cv`, `/api/private-profile/image`, etc.).

## Public vs private configuration

- **Public (`VITE_*`)**: embedded into the built web bundle. Only use for non-sensitive values like display name, title, and branding links.
- **Private (server-side app settings)**: never commit. This includes `CV_SESSION_SIGNING_KEY` and any deployment tokens.

Local-only files that should remain uncommitted:

- `web/.env.local`
- `api/local.settings.json`

