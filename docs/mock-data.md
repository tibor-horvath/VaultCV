# Mock data for local UI testing (no API required)

If you want to see a fully populated CV UI locally without setting up Azure Functions, use the web mock mode. This is the easiest way to preview your CV design quickly.

- Copy `web/.env.example` to `web/.env.local`
- Set `VITE_USE_MOCK_CV=1` (only one value — do not duplicate the variable)
- Run `npm run dev` in `web/`

The mock data is defined in the web source and is only active when `VITE_USE_MOCK_CV=1` is set — it is never used in production.
