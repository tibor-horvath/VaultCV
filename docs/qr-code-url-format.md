# Share link / QR code URL format

VaultCV supports URL-based unlock via share links:

- **Share links:** `s=<SHARE_ID>` (revocable + expiring, created from the admin page)

## Share links

- `https://<your-site>/?s=<SHARE_ID>`
- Optional — fixed language for the recipient: `https://<your-site>/?s=<SHARE_ID>&lang=<locale>` (example: `lang=de`)

You can turn the URL into a QR code using the built-in generator on the admin share page (`/admin/share`): click the **QR Code** button next to any active link to see the QR code and download it as a PNG. When more than one locale is enabled in admin settings, a language selector inside the modal lets you switch the encoded language on the fly — the QR code and URL update immediately. On devices that support file sharing via the [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API) (iOS 12.1+, Android Chrome 61+), a **Share image** button appears in the modal to send the QR code PNG directly through the OS share sheet. Print it on a business card or add it to your paper CV.

Each share link row also exposes a **Share** button (visible only where `navigator.share` is available) that opens the OS share sheet with the link URL directly — without needing to open the QR modal.

The SPA/API auth flow uses the code like this:

- `POST /api/auth` with body `{"shareId":"<SHARE_ID>"}` to obtain a short-lived signed session token
- `POST /api/auth` sets `Set-Cookie: cv_session=...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=<ttl>`
- `GET /api/cv` with the `cv_session` cookie (sent automatically by the browser) and an `Accept-Language` request header for locale selection (the React app sets this from the UI language picker)
- `GET /api/public-profile` uses the same `Accept-Language` pattern for localized public profile JSON
