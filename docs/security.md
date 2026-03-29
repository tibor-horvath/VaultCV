# Security model (important)

This is **real server-side enforcement**: without a valid signed session token, the CV API returns 401 (access denied) and the website cannot load your CV data at all.

Session details:

- Session cookie name: `cv_session`
- Cookie flags: `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`
- Expiry: controlled by `CV_SESSION_TTL_SECONDS` (default `3600`)
- UX behavior: when the session expires, the app returns to the landing page (same origin, root URL)

## Access token format

The `CV_ACCESS_TOKEN` value is not an arbitrary string: both the value in Azure (`CV_ACCESS_TOKEN`) and the `code` sent to `POST /api/auth` must be exactly **32 hexadecimal characters** (no hyphens), matching a GUID in **"N"** form — for example PowerShell `[guid]::NewGuid().ToString("N")`. Other formats (including a 64-character hex string from `openssl rand -hex 32`) are rejected with **400 Invalid token format.**

The shared `?t=` access code still behaves like a bearer secret: anyone you share it with can forward it. If you need identity-based, non-shareable access later, consider Azure AD or Azure AD B2C instead of a shared link.
