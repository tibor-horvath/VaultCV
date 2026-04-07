import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/profileBlobStore', () => ({
  readProfileJsonV2: vi.fn(async () => '{"basics":{"name":"Public Test"}}'),
  writeProfileJsonV2: vi.fn(async () => undefined),
  deleteProfileJsonV2: vi.fn(async () => undefined),
}))

vi.mock('../lib/swaAuth', () => ({
  requireAdmin: vi.fn(() => ({ ok: true, principal: { userId: 'admin-user', userRoles: ['admin'] } })),
}))

vi.mock('../lib/localeRegistry', () => ({
  normalizeLocale: vi.fn((v: string | undefined) => (v ?? '').split('-')[0]?.toLowerCase() || 'en'),
  readSupportedLocalesCached: vi.fn(async () => ['en', 'hu']),
  invalidateLocalesCache: vi.fn(),
}))

import { readProfileJsonV2, writeProfileJsonV2, deleteProfileJsonV2 } from '../lib/profileBlobStore'
import { requireAdmin } from '../lib/swaAuth'
import { invalidateLocalesCache } from '../lib/localeRegistry'
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

describe('/api/admin-profile-public', () => {
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
    it('returns 200 with public profile JSON', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: {}, query: { locale: 'en' } })
      expect(readProfileJsonV2).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'public', locale: 'en', slugFromName: 'john-doe' }),
      )
      expect(context.res).toMatchObject({ status: 200, body: { json: '{"basics":{"name":"Public Test"}}' } })
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

    it('returns 400 when JSON body is invalid', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        query: { locale: 'en' },
        body: { json: '{bad json}' },
      })
      expect(context.res).toMatchObject({ status: 400, body: { error: 'Invalid JSON.' } })
    })

    it('returns 200 on successful save with kind=public', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        query: { locale: 'en' },
        body: { json: '{"basics":{"name":"Public"}}' },
      })
      expect(writeProfileJsonV2).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'public', locale: 'en', slugFromName: 'john-doe', jsonText: '{"basics":{"name":"Public"}}' }),
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
  })

  describe('DELETE', () => {
    it('returns 403 when Origin does not match host', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'DELETE',
        headers: { origin: 'https://evil.com', host: 'example.com', 'x-cv-admin': '1' },
        query: { locale: 'en' },
      })
      expect(context.res).toMatchObject({ status: 403 })
    })

    it('returns 400 when x-cv-admin header is missing', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'DELETE',
        headers: { origin: 'https://example.com', host: 'example.com' },
        query: { locale: 'en' },
      })
      expect(context.res).toMatchObject({ status: 400 })
    })

    it('deletes public profile blob and invalidates cache', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'DELETE',
        headers: { origin: 'https://example.com', host: 'example.com', 'x-cv-admin': '1' },
        query: { locale: 'en' },
      })
      expect(deleteProfileJsonV2).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'public', locale: 'en', slugFromName: 'john-doe' }),
      )
      expect(invalidateLocalesCache).toHaveBeenCalledWith('john-doe')
      expect(context.res).toMatchObject({ status: 200, body: { ok: true } })
    })

    it('returns 500 when deleteProfileJsonV2 throws', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      ;(deleteProfileJsonV2 as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('delete failed'))
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'DELETE',
        headers: { origin: 'https://example.com', host: 'example.com', 'x-cv-admin': '1' },
        query: { locale: 'en' },
      })
      expect(context.res).toMatchObject({ status: 500, body: { error: 'delete failed' } })
    })
  })

  describe('error handling', () => {
    it('returns 500 when writeProfileJsonV2 throws', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      ;(writeProfileJsonV2 as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('write failed'))
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        query: { locale: 'en' },
        body: { json: '{"basics":{}}' },
      })
      expect(context.res).toMatchObject({ status: 500, body: { error: 'write failed' } })
    })
  })
})
