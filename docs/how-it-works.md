# How it works (plain English)

1. You write your CV data as a JSON string and store it as a secret setting in Azure — it never lives in this repo.
2. You deploy this app to Azure Static Web Apps (free tier). It hosts the website and the API together.
3. You generate a random secret token and store it in Azure too.
4. Your shareable link looks like `https://your-site.azurestaticapps.net/?t=YOUR_TOKEN`, where `YOUR_TOKEN` is the same 32-character hex string you stored as `CV_ACCESS_TOKEN` (see [security.md](security.md#access-token-format)). Optionally add `&lang=<locale>` (e.g. `&lang=de`) so the recipient opens the UI and CV content in that language — `lang` is only read when `t` is present.
5. The app exchanges that access code using `POST /api/auth` (JSON body) for a short-lived signed session token.
6. `/api/auth` also sets a secure `HttpOnly` cookie (`cv_session`) so revisits can stay unlocked until expiry.
7. The app loads CV data from `/api/cv` using the `cv_session` cookie (set by `/api/auth`). The cookie is `HttpOnly`, so the browser sends it automatically; JS never reads the session token.
