# Share link / QR code URL format

VaultCV supports URL-based unlock via share links:

- **Share links:** `s=<SHARE_ID>` (revocable + expiring, created from the admin page)

## Share links

- `https://<your-site>/?s=<SHARE_ID>`
- Optional — fixed language for the recipient: `https://<your-site>/?s=<SHARE_ID>&lang=<locale>` (example: `lang=de`)

You can turn the URL into a QR code using any free QR generator (search "free QR code generator"). Print it on a business card or add it to your paper CV.

The SPA/API auth flow uses the code like this:

- `POST /api/auth` with body `{"shareId":"<SHARE_ID>"}` to obtain a short-lived signed session token
- `POST /api/auth` sets `Set-Cookie: cv_session=...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=<ttl>`
- `GET /api/cv` with the `cv_session` cookie (sent automatically by the browser) and an `Accept-Language` request header for locale selection (the React app sets this from the UI language picker)
- `GET /api/public-profile` uses the same `Accept-Language` pattern for localized public profile JSON
