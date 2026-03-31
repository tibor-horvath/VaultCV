# Admin page

VaultCV includes an admin-only page for managing expiring, revocable share links.

## Access

- Admin UI: `/admin`
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
- `GET /api/manage/profile/private`
- `PUT /api/manage/profile/private`
- `GET /api/manage/profile/public`
- `PUT /api/manage/profile/public`

In the Azure Portal, open your Static Web App resource → **Role assignments** and assign yourself the `admin` role.

## Share links

The admin page creates links like:

- `/?s=<SHARE_ID>`

These links are stored in Azure Table Storage and support:

- expiry
- revoke
- optional admin-only metadata (`sharedWith`, `notes`) that is never returned by public endpoints

