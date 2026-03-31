# Localization

VaultCV supports two localization layers:

- **UI localization**: labels, buttons, status/error text in the React app.
- **Content localization**: CV/public profile payloads selected by locale.

## Locale selection and fallback

- Active locale comes from this order: **share link** `?t=...&lang=...` (both query params together — forces that locale for the visit) → `localStorage` (remembered choice) → browser language. A standalone `?lang=` without `t` is ignored so ad‑hoc links cannot override locale. The chosen locale is sent to APIs via the HTTP `Accept-Language` header. After the access token is consumed on the CV screen, `t` and `lang` are removed from the address bar; the locale remains stored for the session.
- Supported locales are configured by API runtime env var `SUPPORTED_LOCALES` (comma-separated, e.g. `en,hu,de`) and served by `GET /api/locales`.
- Locale fallback follows `exact -> base -> en` (example: `de-AT -> de -> en`).

## UI message catalogs

- Message catalogs live in `web/src/i18n/messages/` (`en.ts`, `hu.ts`, `de.ts`, ...).
- Locale governance is centralized in `web/src/i18n/localeRegistry.ts`.
- Startup validation ensures every configured locale has message coverage (direct or base locale), with `en` as required fallback.

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

After changing Azure settings, redeploy or restart the API so new locale env vars take effect.
