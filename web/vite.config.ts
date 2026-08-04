/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // The app calls /api/... as same-origin relative URLs, which is how it works
  // once deployed to Static Web Apps. Locally the Functions host is a separate
  // origin, so the dev server proxies /api to it. Override the target with
  // VITE_API_PROXY_TARGET (e.g. http://localhost:4280 when using the SWA CLI).
  //
  // Mock mode never talks to the API, so the proxy stays off there — otherwise
  // every page load would fill the terminal with connection-refused errors.
  const useMock = env.VITE_USE_MOCK_CV === '1'
  const apiProxyTarget = env.VITE_API_PROXY_TARGET?.trim() || 'http://localhost:7071'

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
    },
    server: {
      proxy: useMock
        ? undefined
        : {
            '/api': {
              target: apiProxyTarget,
              changeOrigin: true,
              configure: (proxy) => {
                proxy.on('error', (err, _req, res) => {
                  // Answer with JSON the app can parse, not an HTML error page.
                  if ('writeHead' in res && !res.headersSent) {
                    res.writeHead(503, { 'content-type': 'application/json' })
                    res.end(
                      JSON.stringify({
                        error: 'api_unavailable',
                        target: apiProxyTarget,
                        hint: 'Start the Functions host with `npm run dev:api`.',
                        detail: err.message,
                      }),
                    )
                  }
                })
              },
            },
          },
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{ts,tsx}', 'tests/**/*.{test,spec}.{ts,tsx}'],
    },
  }
})
