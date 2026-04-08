import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/localeRegistry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/localeRegistry')>()
  return {
    ...actual,
    readDisabledLocalesFromBlob: vi.fn(async () => []),
    setLocaleDisabled: vi.fn(async () => undefined),
    invalidateLocalesCache: vi.fn(),
    readSupportedLocalesCached: vi.fn(async () => ['en', 'hu', 'de']),
  }
})

vi.mock('../lib/swaAuth', () => ({
  requireAdmin: vi.fn(() => ({ ok: true, principal: { userId: 'admin-user', userRoles: ['admin'] } })),
}))

import { readDisabledLocalesFromBlob, setLocaleDisabled, invalidateLocalesCache } from '../lib/localeRegistry'
import { requireAdmin } from '../lib/swaAuth'
import handler from './index'

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

function makeAdminHeaders() {
  return {
    origin: 'https://example.com',
    host: 'example.com',
    'x-cv-admin': '1',
    'content-type': 'application/json',
  }
}

afterEach(() => {
  vi.clearAllMocks()
  resetEnv()
})

describe('/api/manage/locale-visibility', () => {
  describe('auth guard', () => {
    it('returns 401 when admin auth fails', async () => {
      ;(requireAdmin as ReturnType<typeof vi.fn>).mockReturnValueOnce({ ok: false, status: 401, error: 'Unauthorized' })
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: {} })
      expect(context.res).toMatchObject({ status: 401 })
    })
  })

  describe('slug guard', () => {
    it('returns 500 when CV_PROFILE_SLUG is not configured', async () => {
      delete process.env.CV_PROFILE_SLUG
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: {} })
      expect(context.res).toMatchObject({ status: 500, body: { error: 'CV_PROFILE_SLUG is not configured.' } })
    })
  })

  describe('GET', () => {
    it('returns current disabled locales', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      ;(readDisabledLocalesFromBlob as ReturnType<typeof vi.fn>).mockResolvedValueOnce(['hu'])
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: {} })
      expect(context.res).toMatchObject({ status: 200, body: { disabledLocales: ['hu'] } })
    })

    it('returns empty array when no locales are disabled', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: {} })
      expect(context.res).toMatchObject({ status: 200, body: { disabledLocales: [] } })
    })
  })

  describe('PUT', () => {
    it('disables a locale', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        body: { locale: 'hu', disabled: true },
      })
      expect(setLocaleDisabled).toHaveBeenCalledWith('john-doe', 'hu', true)
      expect(invalidateLocalesCache).toHaveBeenCalledWith('john-doe')
      expect(context.res).toMatchObject({ status: 200, body: { ok: true } })
    })

    it('enables a locale', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        body: { locale: 'hu', disabled: false },
      })
      expect(setLocaleDisabled).toHaveBeenCalledWith('john-doe', 'hu', false)
      expect(context.res).toMatchObject({ status: 200, body: { ok: true } })
    })

    it('returns 400 when locale is missing', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        body: { disabled: true },
      })
      expect(context.res).toMatchObject({ status: 400, body: { error: 'locale is required.' } })
    })

    it('returns 400 for unsupported locale', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        body: { locale: 'xx', disabled: true },
      })
      expect(context.res).toMatchObject({ status: 400, body: { error: 'Unsupported locale.' } })
    })

    it('returns 400 for an invalid locale format', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        body: { locale: 'not-a-valid!!!locale', disabled: true },
      })
      expect(context.res).toMatchObject({ status: 400, body: { error: 'Invalid locale format.' } })
    })

    it('does not silently coerce an invalid locale to the fallback locale', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        body: { locale: '@@@', disabled: true },
      })
      // Must not accidentally disable 'en' (the fallback locale)
      expect(setLocaleDisabled).not.toHaveBeenCalled()
      expect((context.res as { status: number }).status).toBe(400)
    })

    it('returns 403 when x-cv-admin header is missing', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: { origin: 'https://example.com', host: 'example.com', 'content-type': 'application/json' },
        body: { locale: 'hu', disabled: true },
      })
      expect((context.res as { status: number }).status).toBeGreaterThanOrEqual(400)
    })

    it('returns 400 when disabled is missing', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        body: { locale: 'hu' },
      })
      expect(context.res).toMatchObject({ status: 400, body: { error: 'disabled must be a boolean.' } })
    })

    it('returns 400 when disabled is a string instead of boolean', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        body: { locale: 'hu', disabled: 'true' },
      })
      expect(context.res).toMatchObject({ status: 400, body: { error: 'disabled must be a boolean.' } })
    })
  })

  describe('unsupported methods', () => {
    it('returns 405 for DELETE', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, { method: 'DELETE', headers: {} })
      expect(context.res).toMatchObject({ status: 405 })
    })
  })
})
