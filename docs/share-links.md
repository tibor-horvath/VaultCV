# Share link management

Access to the CV is granted exclusively through **share links** created from the admin page (`/admin/share`). Each share link has its own expiry date and can be revoked individually.

## Creating a new share link

1. Go to `/admin/share` and sign in as an admin.
2. Click **New share link** and set an expiry date.
3. Copy the generated `?s=<SHARE_ID>` URL and share it (email, QR code, printed CV, etc.).

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
