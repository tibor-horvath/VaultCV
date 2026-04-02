import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './index'
import { invalidateLocalesCache } from '../lib/localeRegistry'

vi.mock('../lib/profileBlobStore', () => {
  return {
    readSettingsJson: vi.fn(async () => ''),
    writeSettingsJson: vi.fn(async () => {}),
  }
})

import { readSettingsJson, writeSettingsJson } from '../lib/profileBlobStore'

const originalEnv = { ...process.env }

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key]
  }
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
}

/** Base64-encode a client principal with the admin role for the x-ms-client-principal header. */
function adminPrincipalHeader() {
  const principal = { userRoles: ['admin'] }
  return Buffer.from(JSON.stringify(principal)).toString('base64')
}

function nonAdminPrincipalHeader() {
  const principal = { userRoles: ['authenticated'] }
  return Buffer.from(JSON.stringify(principal)).toString('base64')
}

/** Headers shared by all "admin GET" test requests. */
function adminGetHeaders(): Record<string, string> {
  return { 'x-ms-client-principal': adminPrincipalHeader() }
}

/** Minimal headers for a valid admin PUT request (same-origin via x-forwarded-host). */
function adminPutHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'x-ms-client-principal': adminPrincipalHeader(),
    origin: 'https://example.azurestaticapps.net',
    host: 'example.azurestaticapps.net',
    'x-cv-admin': '1',
    'content-type': 'application/json',
    ...extra,
  }
}

type Context = { res?: { status: number; headers?: Record<string, string>; body?: unknown } }

afterEach(() => {
  vi.restoreAllMocks()
  resetEnv()
  invalidateLocalesCache()
})

describe('/api/manage/settings', () => {
  // ---- auth / config guard ----

  it('returns 401 when x-ms-client-principal header is missing', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const context: Context = {}
    await handler(context, { method: 'GET', headers: {} })
    expect(context.res).toMatchObject({ status: 401, body: { error: 'Unauthorized' } })
  })

  it('returns 403 when principal is present but user lacks admin role', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const context: Context = {}
    await handler(context, {
      method: 'GET',
      headers: { 'x-ms-client-principal': nonAdminPrincipalHeader() },
    })
    expect(context.res).toMatchObject({ status: 403, body: { error: 'Unauthorized' } })
  })

  it('returns 500 when CV_PROFILE_SLUG is not configured', async () => {
    process.env.CV_PROFILE_SLUG = ''
    const context: Context = {}
    await handler(context, { method: 'GET', headers: adminGetHeaders() })
    expect(context.res).toMatchObject({ status: 500, body: { error: 'CV_PROFILE_SLUG is not configured.' } })
  })

  // ---- GET ----

  it('GET returns empty supportedLocales when settings blob is missing', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('')

    const context: Context = {}
    await handler(context, { method: 'GET', headers: adminGetHeaders() })

    expect(context.res).toMatchObject({ status: 200, body: { supportedLocales: [] } })
  })

  it('GET returns supportedLocales from settings blob', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      JSON.stringify({ supportedLocales: ['en', 'de'] }),
    )

    const context: Context = {}
    await handler(context, { method: 'GET', headers: adminGetHeaders() })

    expect(context.res).toMatchObject({ status: 200, body: { supportedLocales: ['en', 'de'] } })
  })

  // ---- PUT – header validation ----

  it('PUT returns 403 when Origin header is missing', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const context: Context = {}
    const headers = adminPutHeaders()
    delete (headers as Record<string, string | undefined>).origin

    await handler(context, { method: 'PUT', headers, body: { supportedLocales: ['en'] } })

    expect(context.res).toMatchObject({ status: 403 })
  })

  it('PUT returns 400 when x-cv-admin header is missing', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const context: Context = {}
    const headers = adminPutHeaders()
    delete (headers as Record<string, string | undefined>)['x-cv-admin']

    await handler(context, { method: 'PUT', headers, body: { supportedLocales: ['en'] } })

    expect(context.res).toMatchObject({ status: 400 })
  })

  it('PUT returns 415 when content-type is not application/json', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const context: Context = {}

    await handler(context, {
      method: 'PUT',
      headers: adminPutHeaders({ 'content-type': 'text/plain' }),
      body: { supportedLocales: ['en'] },
    })

    expect(context.res).toMatchObject({ status: 415 })
  })

  // ---- PUT – payload validation ----

  it('PUT returns 400 when supportedLocales is not an array', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const context: Context = {}

    await handler(context, {
      method: 'PUT',
      headers: adminPutHeaders(),
      body: { supportedLocales: 'en' },
    })

    expect(context.res).toMatchObject({ status: 400, body: { error: 'supportedLocales must be an array.' } })
  })

  it('PUT returns 400 when supportedLocales array has no valid entries', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const context: Context = {}

    await handler(context, {
      method: 'PUT',
      headers: adminPutHeaders(),
      body: { supportedLocales: ['!!invalid!!'] },
    })

    expect(context.res).toMatchObject({ status: 400 })
  })

  it('PUT returns 400 when fallback locale "en" is not included', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const context: Context = {}

    await handler(context, {
      method: 'PUT',
      headers: adminPutHeaders(),
      body: { supportedLocales: ['de', 'hu'] },
    })

    expect(context.res).toMatchObject({ status: 400, body: { error: 'en must be included in supported locales.' } })
  })

  // ---- PUT – success and cache invalidation ----

  it('PUT writes settings blob and invalidates locale cache on success', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const context: Context = {}

    await handler(context, {
      method: 'PUT',
      headers: adminPutHeaders(),
      body: { supportedLocales: ['en', 'de'] },
    })

    expect(writeSettingsJson).toHaveBeenCalledWith({
      slugFromName: 'john-doe',
      jsonText: JSON.stringify({ supportedLocales: ['en', 'de'] }),
    })
    expect(context.res).toMatchObject({ status: 200 })
  })

  // ---- unsupported method ----

  it('returns 405 for unsupported methods', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const context: Context = {}

    await handler(context, { method: 'DELETE', headers: adminGetHeaders() })

    expect(context.res).toMatchObject({ status: 405 })
  })
})
