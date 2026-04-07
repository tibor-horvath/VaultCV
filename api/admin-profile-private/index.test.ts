import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/profileBlobStore', () => ({
  readProfileJsonV2: vi.fn(async () => '{"basics":{"name":"Test"}}'),
  writeProfileJsonV2: vi.fn(async () => undefined),
}))

vi.mock('../lib/swaAuth', () => ({
  requireAdmin: vi.fn(() => ({ ok: true, principal: { userId: 'admin-user', userRoles: ['admin'] } })),
}))

vi.mock('../lib/localeRegistry', () => ({
  normalizeLocale: vi.fn((v: string | undefined) => (v ?? '').split('-')[0]?.toLowerCase() || 'en'),
  readSupportedLocalesCached: vi.fn(async () => ['en', 'hu']),
}))

import { readProfileJsonV2, writeProfileJsonV2 } from '../lib/profileBlobStore'
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
  vi.restoreAllMocks()
  resetEnv()
})

describe('/api/admin-profile-private', () => {
  describe('auth guard', () => {
    it('returns 401 when admin auth fails', async () => {
      ;(requireAdmin as ReturnType<typeof vi.fn>).mockReturnValueOnce({ ok: false, status: 401, error: 'Unauthorized' })
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: {}, query: { locale: 'en' } })
      expect(context.res).toMatchObject({ status: 401 })
    })
  })

  describe('slug configuration', () => {
    it('returns 500 when CV_PROFILE_SLUG is not configured', async () => {
      delete process.env.CV_PROFILE_SLUG
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: {}, query: { locale: 'en' } })
      expect(context.res).toMatchObject({ status: 500, body: { error: 'CV_PROFILE_SLUG is not configured.' } })
    })
  })

  describe('locale validation', () => {
    it('returns 400 for unsupported locale', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: {}, query: { locale: 'zz' } })
      expect(context.res).toMatchObject({ status: 400, body: { error: 'Unsupported locale.' } })
    })
  })

  describe('GET', () => {
    it('returns 200 with profile JSON', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: {}, query: { locale: 'en' } })
      expect(readProfileJsonV2).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'private', locale: 'en', slugFromName: 'john-doe' }),
      )
      expect(context.res).toMatchObject({ status: 200, body: { json: '{"basics":{"name":"Test"}}' } })
    })
  })

  describe('PUT', () => {
    it('returns 403 when Origin does not match host', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: { origin: 'https://evil.com', host: 'example.com', 'x-cv-admin': '1', 'content-type': 'application/json' },
        query: { locale: 'en' },
        body: { json: '{"basics":{}}' },
      })
      expect(context.res).toMatchObject({ status: 403 })
    })

    it('returns 400 when x-cv-admin header is missing', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: { origin: 'https://example.com', host: 'example.com', 'content-type': 'application/json' },
        query: { locale: 'en' },
        body: { json: '{"basics":{}}' },
      })
      expect(context.res).toMatchObject({ status: 400 })
    })

    it('returns 415 when content-type is not JSON', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: { origin: 'https://example.com', host: 'example.com', 'x-cv-admin': '1', 'content-type': 'text/plain' },
        query: { locale: 'en' },
        body: { json: '{"basics":{}}' },
      })
      expect(context.res).toMatchObject({ status: 415 })
    })

    it('returns 400 for invalid JSON in body', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        query: { locale: 'en' },
        body: { json: 'not-valid-json' },
      })
      expect(context.res).toMatchObject({ status: 400, body: { error: 'Invalid JSON.' } })
    })

    it('returns 413 when JSON payload exceeds 256 KB', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const bigJson = JSON.stringify({ data: 'x'.repeat(256 * 1024 + 1) })
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        query: { locale: 'en' },
        body: { json: bigJson },
      })
      expect(context.res).toMatchObject({ status: 413 })
    })

    it('returns 200 on successful save', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        query: { locale: 'en' },
        body: { json: '{"basics":{"name":"Jane"}}' },
      })
      expect(writeProfileJsonV2).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'private', locale: 'en', slugFromName: 'john-doe', jsonText: '{"basics":{"name":"Jane"}}' }),
      )
      expect(context.res).toMatchObject({ status: 200, body: { ok: true } })
    })
  })

  describe('unsupported methods', () => {
    it('returns 405 for PATCH', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, { method: 'PATCH', headers: {}, query: { locale: 'en' } })
      expect(context.res).toMatchObject({ status: 405 })
    })

    it('returns 405 for DELETE', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'DELETE',
        headers: { origin: 'https://example.com', host: 'example.com', 'x-cv-admin': '1' },
        query: { locale: 'en' },
      })
      expect(context.res).toMatchObject({ status: 405 })
    })
  })

  describe('error handling', () => {
    it('returns 500 when readProfileJsonV2 throws', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      ;(readProfileJsonV2 as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('blob error'))
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: {}, query: { locale: 'en' } })
      expect(context.res).toMatchObject({ status: 500, body: { error: 'blob error' } })
    })
  })
})
