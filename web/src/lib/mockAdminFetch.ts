import type { Locale } from './i18n'
import { getMockCv } from './mockCv'
import { parseSiteBranding, readCachedBranding, type SiteBranding } from './siteBranding'

/**
 * Dev-only: in mock mode there is no API or SWA auth behind the Vite server, so the admin editor
 * would bounce to login. This patches `window.fetch` to answer `/.auth/me` with an admin principal
 * and serve the editor's `/api/locales` + `/api/manage/*` endpoints from an in-memory store seeded
 * with the mock CV. Saves last until the page reloads. Every other request goes to the real fetch.
 */

const MOCK_LOCALES = ['en', 'de', 'hu']

const mockPrincipal = {
  identityProvider: 'mock',
  userId: 'mock-admin',
  userDetails: 'admin@example.com',
  userRoles: ['anonymous', 'authenticated', 'admin'],
  claims: [{ typ: 'email', val: 'admin@example.com' }],
}

type ProfileKind = 'private' | 'public'

const profiles = new Map<string, string>()
const disabledLocales = new Set<string>()
// Seeded from the browser's branding cache, which a save also writes, so it survives reloads.
let branding: SiteBranding | null = null

function profileKey(kind: ProfileKind, locale: string) {
  return `${kind}:${locale}`
}

function readProfile(kind: ProfileKind, locale: string): string {
  const key = profileKey(kind, locale)
  if (!profiles.has(key)) {
    // Seed both blobs from the mock CV, so every field starts out filled in and public.
    profiles.set(key, MOCK_LOCALES.includes(locale) ? JSON.stringify(getMockCv(locale as Locale), null, 2) : '')
  }
  return profiles.get(key) ?? ''
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

async function readJsonBody<T>(init: RequestInit | undefined): Promise<T | null> {
  try {
    return typeof init?.body === 'string' ? (JSON.parse(init.body) as T) : null
  } catch {
    return null
  }
}

async function handle(url: URL, method: string, init: RequestInit | undefined): Promise<Response | null> {
  const path = url.pathname

  if (path === '/.auth/me') return json(200, { clientPrincipal: mockPrincipal })

  if (path === '/api/locales' && method === 'GET') return json(200, { locales: MOCK_LOCALES })

  const profileMatch = /^\/api\/manage\/profile\/(private|public)$/.exec(path)
  if (profileMatch) {
    const kind = profileMatch[1] as ProfileKind
    const locale = (url.searchParams.get('locale') ?? 'en').trim().toLowerCase() || 'en'
    if (method === 'GET') return json(200, { json: readProfile(kind, locale) })
    if (method === 'PUT') {
      const body = await readJsonBody<{ json?: unknown }>(init)
      if (typeof body?.json !== 'string') return json(400, { error: 'Missing json' })
      profiles.set(profileKey(kind, locale), body.json)
      return json(200, { ok: true })
    }
    if (method === 'DELETE') {
      profiles.set(profileKey(kind, locale), '')
      return json(200, { ok: true })
    }
  }

  if (path === '/api/manage/locale-visibility') {
    if (method === 'GET') return json(200, { disabledLocales: [...disabledLocales] })
    if (method === 'PUT') {
      const body = await readJsonBody<{ locale?: unknown; disabled?: unknown }>(init)
      if (typeof body?.locale !== 'string') return json(400, { error: 'Missing locale' })
      if (body.disabled === true) disabledLocales.add(body.locale)
      else disabledLocales.delete(body.locale)
      return json(200, { ok: true })
    }
  }

  if (path === '/api/branding' || path === '/api/manage/branding') {
    branding ??= readCachedBranding()
    if (method === 'GET') return json(200, branding)
    if (method === 'PUT' && path === '/api/manage/branding') {
      const body = await readJsonBody<unknown>(init)
      if (body === null) return json(400, { error: 'Invalid JSON' })
      branding = parseSiteBranding(body)
      return json(200, branding)
    }
  }

  // No mock profile photo; the editor treats 404 as "no image yet".
  if (path === '/api/manage/profile/image') {
    if (method === 'GET' || method === 'HEAD') return new Response(null, { status: 404 })
    return json(501, { error: 'Profile image upload is not available in mock mode' })
  }

  return null
}

let installed = false

export function installMockAdminFetch() {
  if (installed || typeof window === 'undefined') return
  installed = true
  const realFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : null
    const url = new URL(request ? request.url : String(input), window.location.origin)
    if (url.origin === window.location.origin) {
      const method = (init?.method ?? request?.method ?? 'GET').toUpperCase()
      const mocked = await handle(url, method, init)
      if (mocked) return mocked
    }
    return realFetch(input, init)
  }
}
