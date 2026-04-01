# Localization

VaultCV supports two localization layers:

- **UI localization**: labels, buttons, status/error text in the React app.
- **Content localization**: CV/public profile payloads selected by locale.

## Locale selection and fallback

- Active locale comes from this order: **share link** `?s=...&lang=...` (both query params together — forces that locale for the visit) → `localStorage` (remembered choice) → browser language. A standalone `?lang=` without `s` is ignored so ad‑hoc links cannot override locale. The chosen locale is sent to APIs via the HTTP `Accept-Language` header.
- Supported locales are configured by API runtime env var `SUPPORTED_LOCALES` (comma-separated, e.g. `en,hu,de`) and served by `GET /api/locales`.
- Locale fallback follows `exact -> base -> en` (example: `de-AT -> de -> en`).

## UI message catalogs

- Message catalogs live in `web/src/i18n/messages/` (`en.ts`, `hu.ts`, `de.ts`, ...).
- Locale governance is centralized in `web/src/i18n/localeRegistry.ts`.
- Startup validation ensures every configured locale has message coverage (direct or base locale), with `en` as required fallback.
- Admin UI copy (dashboard, editor, share page, save/status banners, and common controls) is localized through the same `t()` catalogs.

## Admin locale management

- The admin editor has two locale flows:
  - **Current locale selector**: switches which localized CV payload (`private/public`) you are editing.
  - **Add language**: explicitly enables a new content locale in the editor and switches to it.
- Available admin locales are loaded from `GET /api/locales` (backed by API env var `SUPPORTED_LOCALES`).
- If `/api/locales` is unavailable, admin falls back to `en`.
- UI language and CV content locale remain separate:
  - UI language comes from app locale settings.
  - CV content locale comes from the editor's selected locale.

## Localized content payloads (API)

Profile payload localization is done via **blob filenames**.

The API selects locale from the `Accept-Language` header (normalized by `api/lib/localeRegistry.ts`) and reads:

- `{CV_PROFILE_SLUG}-private-profile-{locale}.json`
- `{CV_PROFILE_SLUG}-public-profile-{locale}.json`

`CV_PROFILE_SLUG` is a server-side app setting.

## Add a new locale

1. Add the locale to `SUPPORTED_LOCALES` (Azure app settings).
2. Add a UI message catalog in `web/src/i18n/messages/`.
3. Upload localized profile JSON blobs using the naming convention:
   - `{slug}-private-profile-{locale}.json`
   - `{slug}-public-profile-{locale}.json`
4. It will automatically appear in admin locale-add flow when returned by `/api/locales`.

After changing Azure settings, redeploy or restart the API so new locale env vars take effect.
