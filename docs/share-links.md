# Share link management

Access to the CV is granted exclusively through **share links** created from the admin page (`/admin/share`). Each share link has its own expiry date and can be revoked individually.

## Creating a new share link

1. Go to `/admin/share` and sign in as an admin.
2. Fill in the **Create share link** form:
   - **Expiry** — quick-select chips: **7d / 14d / 30d / 90d**. Click **Custom…** to reveal a number field for any value between 1 and 365 days.
   - **Share language** — when more than one locale is available, controls the `lang` parameter appended to the generated URL (e.g. `/?s=<ID>&lang=de`). Leave on **Auto** to let the viewer's browser language decide.
   - **Notes (admin-only)** — freeform context (role, date, recipient) visible only in this panel; never returned by public endpoints.
3. Click **Create**. An inline panel appears immediately below the form with:
   - The full share URL (click to select all)
   - A **Copy** button
   - A **QR Code** button — opens a modal with a scannable QR code and a **Download PNG** option
   - A **×** dismiss button
4. Share the URL (email, QR code, printed CV, etc.).

## Link list actions

For each active link in the list:

- **Copy** — copies the share URL to the clipboard.
- **QR Code** — opens a modal with a scannable QR code and a **Download PNG** option. When more than one locale is available, a language selector inside the modal lets you switch the encoded language without closing the modal — the QR code and URL update immediately. The modal pre-selects the language already chosen in the **Share language** selector in the Create share link form. On devices that support the [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API) file sharing (iOS 12.1+, Android Chrome 61+), a **Share image** button also appears, letting you send the QR code PNG via the OS share sheet. See [qr-code-url-format.md](qr-code-url-format.md) for the full URL format.
- **Share** — on devices where `navigator.share` is available, opens the native OS share sheet with the link URL.
- **Revoke** — see below.

## Revoking a share link

Open `/admin/share`, find the link, and click **Revoke**. The share ID is immediately invalidated:
- New attempts to authenticate with that link will be rejected
- **Existing sessions** using that share link will be terminated on their next API request (no need to wait for token expiry)
- Anyone using an old link or QR code will get a 401

## Rotating access

When you want to cycle access (for example every 6 months):

1. Create a new share link with a fresh expiry.
2. Revoke the old share link(s) from `/admin/share`.
3. Update any printed CVs, emails, or QR codes with the new `?s=<NEW_SHARE_ID>` URL.

## Signing key rotation

`CV_SESSION_SIGNING_KEY` controls session token integrity and is independent of share links. Rotate it in **Settings → Environment variables** when needed. Rotating it immediately invalidates all active sessions (users will need to re-open their share link).
