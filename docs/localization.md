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

The API endpoints support locale-specific environment variables:

- CV endpoint (`/api/cv`)
  - `PRIVATE_PROFILE_JSON_URL_<LOCALE>` (example: `PRIVATE_PROFILE_JSON_URL_DE`, `PRIVATE_PROFILE_JSON_URL_HU`)
  - fallback to `PRIVATE_PROFILE_JSON_URL`
- Public profile endpoint (`/api/public-profile`)
  - `PUBLIC_PROFILE_JSON_URL_<LOCALE>` (example: `PUBLIC_PROFILE_JSON_URL_DE`)
  - fallback to `PUBLIC_PROFILE_JSON_URL`

API locale resolution is centralized in `api/lib/localeRegistry.ts` and follows the same `exact -> base -> en` behavior.

## Localized fallback files (web-only dev)

When API/local env vars are not available, web can use static fallback files in `web/public/`:

- `public-profile.en.json`
- `public-profile.hu.json`
- `public-profile.de.json`
- and generic fallback `public-profile.json`

## Add a new locale

1. Add the locale to `SUPPORTED_LOCALES` (Azure app settings).
2. Add a UI message catalog in `web/src/i18n/messages/`.
3. Add localized content payloads:
   - `PRIVATE_PROFILE_JSON_URL_<LOCALE>`
   - `PUBLIC_PROFILE_JSON_URL_<LOCALE>`
4. Optionally add `web/public/public-profile.<locale>.json` for web-only fallback/local testing.

After changing Azure settings, redeploy or restart the API so new locale env vars take effect.
