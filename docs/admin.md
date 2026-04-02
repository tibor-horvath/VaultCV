# Admin pages

VaultCV includes admin-only routes for dashboard, profile editing, and share-link management.

## Access

- Admin dashboard: `/admin`
- Admin editor: `/admin/editor`
- Admin share tools: `/admin/share`
- Admin settings: `/admin/settings`
- Sign in (Entra ID): `/.auth/login/aad`
- Verify identity: `/.auth/me`
- Sign out: `/.auth/logout`

## Roles

The admin UI and admin APIs are protected using the Static Web Apps `admin` role:

- UI routes: `/admin/*`
- API routes: `/api/manage/*`

Primary admin API endpoints:

- `GET /api/manage/links`
- `POST /api/manage/links`
- `POST /api/manage/links/{id}/revoke`
- `GET /api/manage/settings`
- `PUT /api/manage/settings`
- `GET /api/manage/profile/private`
- `PUT /api/manage/profile/private`
- `GET /api/manage/profile/public`
- `PUT /api/manage/profile/public`
- `GET /api/manage/profile/image`
- `PUT /api/manage/profile/image`
- `DELETE /api/manage/profile/image`

Public (unauthenticated) image endpoint:

- `GET /api/public-profile/image`

In the Azure Portal, open your Static Web App resource → **Role assignments** and assign yourself the `admin` role.

## Profile slug (important)

The admin editor reads/writes profile JSON blobs using the server-side app setting **`CV_PROFILE_SLUG`** (the same slug used by the public `/api/public-profile` and `/api/cv` endpoints).

If `CV_PROFILE_SLUG` is missing, the admin profile endpoints return an error.

## Localization in admin

- Admin surfaces (`/admin`, `/admin/editor`, `/admin/share`) use shared i18n catalogs (`en`, `de`, `hu`) for UI labels, actions, confirmations, and status/error messages.
- The editor locale selector controls which localized CV payload is being edited (`private/public` per locale), independent from current UI language.
- The editor includes an explicit **Add language** action.
  - Available locales are loaded from `/api/locales` (backed by `/api/manage/settings`).
  - If locale loading fails, the editor falls back to `en`.
  - When adding a locale, the editor switches to that locale immediately so content can be created.

- The admin settings page (`/admin/settings`) manages supported locales in Blob Storage:
  - Blob name: `{CV_PROFILE_SLUG}-settings.json`
  - JSON shape: `{ "supportedLocales": ["en", "de", "hu", ...] }`
  - On first run (no settings blob yet), it pre-selects locales that have UI message catalogs and prompts save.

## Share links

The share page (`/admin/share`) creates links like:

- `/?s=<SHARE_ID>`

These links are stored in Azure Table Storage and support:

- expiry
- revoke
- optional admin-only metadata (`sharedWith`, `notes`) that is never returned by public endpoints

For each active link, click the **QR Code** button to open a modal with a scannable QR code and a **Download PNG** option. When more than one locale is enabled in admin settings, a language selector inside the modal lets you switch the encoded language without closing the modal — the QR code and URL update immediately. The modal pre-selects the language already chosen in the page-level language selector. On devices that support the [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Share_API) file sharing (iOS 12.1+, Android Chrome 61+), a **Share image** button also appears, letting you send the QR code PNG directly via the OS share sheet. See [qr-code-url-format.md](qr-code-url-format.md) for the full URL format.

Each share link row has a **Share** button (next to **Copy**) on devices where `navigator.share` is available. Tapping it opens the native OS share sheet with the link URL.

## Public visibility model

The editor (`/admin/editor`) supports per-field visibility controls for fields that can be shown on the public landing page.

Always-private fields are never exposed publicly:

- contact details: `email`, `mobile`
- credential dates: `dateEarned`, `dateExpires`
- education-sensitive metadata (for example GPA/honors/thesis/advisor)
- share-link notes and metadata

The **Profile photo** section lets you:

- Upload and crop a JPEG or PNG image (stored in Blob Storage as `{slug}-profile-image`).
- Toggle whether the photo appears on the public landing page. When the toggle is off the photo is still stored and visible in the editor, but `basics.photoUrl` is omitted from the public profile payload.
- Delete the photo entirely.

## Security notes (important)

### Trust boundary for admin APIs

All admin Functions use `authLevel: anonymous` and rely on Azure Static Web Apps authentication/authorization.

- The Functions enforce the `admin` role based on SWA-provided identity headers.
- The Static Web Apps config must also restrict `/api/manage/*` to the `admin` role to reduce exposure and prevent accidental misconfiguration.

### Direct reachability / header spoofing risk

Do **not** deploy these Functions as a separately reachable public Function App. If a client can reach the Functions host directly and inject SWA identity headers, they could bypass authz.

Use one of these deployment patterns:

- Preferred: SWA managed Functions (SWA front door is the only ingress)
- If using a separate Function App: restrict ingress (private endpoint / IP restrictions / front it with a trusted reverse proxy that strips identity headers and enforces auth)

