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

## Profile slug (important)

The admin editor reads/writes profile JSON blobs using the server-side app setting **`CV_PROFILE_SLUG`** (the same slug used by the public `/api/public-profile` and `/api/cv` endpoints).

If `CV_PROFILE_SLUG` is missing, the admin profile endpoints return an error.

## Share links

The admin page creates links like:

- `/?s=<SHARE_ID>`

These links are stored in Azure Table Storage and support:

- expiry
- revoke
- optional admin-only metadata (`sharedWith`, `notes`) that is never returned by public endpoints

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

