# How it works (plain English)

1. You write your CV data as JSON and store it in Azure Blob Storage — it never lives in this repo.
2. You deploy this app to Azure Static Web Apps (free tier). It hosts the website and the API together.
3. You generate a random secret token and store it in Azure too.
4. Your shareable link looks like `https://your-site.azurestaticapps.net/?s=SHARE_ID`, where `SHARE_ID` is a random high-entropy id you create from the admin page. Share links can expire and can be revoked. Optionally add `&lang=<locale>` (e.g. `&lang=de`) so the recipient opens the UI and CV content in that language.
5. The app exchanges that access code using `POST /api/auth` (JSON body) for a short-lived signed session token.
6. `/api/auth` also sets a secure `HttpOnly` cookie (`cv_session`) so revisits can stay unlocked until expiry.
7. The app loads CV data from `/api/cv` using the `cv_session` cookie (set by `/api/auth`). The cookie is `HttpOnly`, so the browser sends it automatically; JS never reads the session token.

## Admin navigation

Admin features are split into focused routes:

- `/admin` - dashboard with two entry points:
  - Edit CV
  - Share CV
- `/admin/editor` - profile editor and public/private visibility controls
- `/admin/share` - share-link operations (create, filter, copy, revoke)

This split keeps information architecture simpler while keeping all admin APIs under `/api/manage/*`.

For detailed admin auth, role, and endpoint notes, see [admin.md](admin.md).
