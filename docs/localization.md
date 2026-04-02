# Localization

VaultCV supports two localization layers:

- **UI localization**: labels, buttons, status/error text in the React app.
- **Content localization**: CV/public profile payloads selected by locale.

## Locale selection and fallback

- Active locale comes from this order: **share link** `?s=...&lang=...` (both query params together — forces that locale for the visit) → `localStorage` (remembered choice) → browser language. A standalone `?lang=` without `s` is ignored so ad‑hoc links cannot override locale. The chosen locale is sent to APIs via the HTTP `Accept-Language` header.
- Supported locales are served by `GET /api/locales`, backed by the app's UI locale catalogs (`en`, `hu`, `de`).
- Public page selectors can request scoped locale availability:
  - `GET /api/locales?scope=public` returns only locales where `{slug}-public-profile-{locale}.json` exists and is non-empty.
  - `GET /api/locales?scope=private` returns only locales where `{slug}-private-profile-{locale}.json` exists and is non-empty.
- Route behavior:
  - `LandingRoute` language selector uses `scope=public`.
  - `CvRoute` language selector uses `scope=private`.
- Locale fallback follows `exact -> base -> en` (example: `de-AT -> de -> en`).

## UI message catalogs

- Message catalogs live in `web/src/i18n/messages/` (`en.ts`, `hu.ts`, `de.ts`, ...).
- Locale governance is centralized in `web/src/i18n/localeRegistry.ts`.
- Startup validation ensures every configured locale has message coverage (direct or base locale), with `en` as required fallback.
- Admin UI copy (dashboard, editor, share page, save/status banners, and common controls) is localized through the same `t()` catalogs.

## Admin locale management

- The admin editor has two locale flows:
  - **Current locale selector**: switches which localized CV payload (`private/public`) you are editing.
  - **Add language**: creates content for an additional locale and switches to it.
- Available admin locales come from app UI locale catalogs via `GET /api/locales`.
- Admin can only edit/create profiles for locales that exist in the app locale catalog set.
- UI language and CV content locale remain separate:
  - UI language comes from app UI locale catalog selection.
  - CV content locale comes from the editor's selected locale.

## Localized content payloads (API)

Profile payload localization is done via **blob filenames**.

The API selects locale from the `Accept-Language` header (normalized by `api/lib/localeRegistry.ts`) and reads:

- `{CV_PROFILE_SLUG}-private-profile-{locale}.json`
- `{CV_PROFILE_SLUG}-public-profile-{locale}.json`

`CV_PROFILE_SLUG` is a server-side app setting.

## Add a new locale

1. Add a UI message catalog in `web/src/i18n/messages/`.
2. Ensure the locale is part of the app-supported locale set used by `/api/locales`.
3. Upload localized profile JSON blobs using the naming convention:
   - `{slug}-private-profile-{locale}.json`
   - `{slug}-public-profile-{locale}.json`
4. It will automatically appear in admin locale-add flow and in route-scoped selectors where matching blobs exist.
