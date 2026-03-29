# 6‑month access code rotation (manual)

This repo uses a single server-side token (`CV_ACCESS_TOKEN`). To make the access code expire every ~6 months, rotate it twice a year. This is optional but recommended if you want to limit how long a shared link stays valid.

- **1) Generate a new token** — it must be **exactly 32 hexadecimal characters** (same rules as [security.md](security.md#access-token-format)).
  - PowerShell:

```powershell
[guid]::NewGuid().ToString("N")
```

  - Bash / macOS Terminal (16 random bytes → 32 hex digits):

```bash
openssl rand -hex 16
```

- **2) Update `CV_ACCESS_TOKEN`** in your Azure Static Web App's **Settings → Environment variables**.
- **3) Update your shareable link** — your old `/?t=<OLD_TOKEN>` links will stop working. Update any printed CVs, emails, or QR codes with the new `/?t=<NEW_TOKEN>` value.
- **4) Keep `CV_SESSION_SIGNING_KEY` separate** from `CV_ACCESS_TOKEN`; rotate it independently if needed.
- **5) Optional:** set `CV_SESSION_TTL_SECONDS` (default `3600`) to tune session duration.
