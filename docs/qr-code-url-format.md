# QR code URL format

The `t` query value must match `CV_ACCESS_TOKEN` — **32 hexadecimal characters**, no hyphens ([details](security.md#access-token-format)).

Your shareable access link should look like:

- `https://<your-site>/?t=<TOKEN>`
- Optional — fixed language for the recipient (must use the same link as the token): `https://<your-site>/?t=<TOKEN>&lang=<locale>` (example: `lang=de` for German UI and localized CV/public profile content when configured)

You can turn this into a QR code using any free QR generator (search "free QR code generator"). Print it on a business card or add it to your paper CV.

The SPA/API auth flow uses the code like this:

- `POST /api/auth` with body `{"code":"<TOKEN>"}` to obtain a short-lived signed session token
- `POST /api/auth` sets `Set-Cookie: cv_session=...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=<ttl>`
- `GET /api/cv` with the `cv_session` cookie (sent automatically by the browser) and an `Accept-Language` request header for locale selection (the React app sets this from the UI language picker)
- `GET /api/public-profile` uses the same `Accept-Language` pattern for localized public profile JSON
