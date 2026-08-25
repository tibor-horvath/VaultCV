# Mock data for local UI testing (no API required)

If you want to see a fully populated CV UI locally without setting up Azure Functions, use the web mock mode. This is the easiest way to preview your CV design quickly.

Running `npm run setup` from the repo root already enables it. To do it by hand:

- Copy `web/.env.local.example` to `web/.env.local`
- Set `VITE_USE_MOCK_CV=1` (only one value — do not duplicate the variable)
- Run `npm run dev` from the repo root (or in `web/`)

If you also want example public/branding values in local development, copy `web/.env.example` instead and keep `VITE_USE_MOCK_CV=1`.

While mock mode is on, the dev server's `/api` proxy is disabled — the UI never calls the backend, so there is nothing to forward. Set `VITE_USE_MOCK_CV=0` to switch to the real API.

The mock data is defined in the web source and is only active when `VITE_USE_MOCK_CV=1` is set — it is never used in production.

## Seeing loading states

The mock responds instantly, so loading states (the CV skeleton, the admin session spinner) are gone before you can look at them. Add an artificial delay to `web/.env.local`:

```
VITE_MOCK_LATENCY_MS=1500
```

Every mock API call then waits that many milliseconds, which holds the loading screens on-screen. Remove it (or set `0`) to go back to instant responses. This affects mock mode only.
