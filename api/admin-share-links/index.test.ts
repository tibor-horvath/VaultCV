import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/shareLinksTable', () => ({
  createShareLink: vi.fn(async (input: { notes?: string; expiresAtEpoch: number }) => ({
    id: 'new-share-id-123',
    entity: { partitionKey: 'links', rowKey: 'new-share-id-123', ...input, createdAtEpoch: 1000, viewCount: 0 },
  })),
  listShareLinks: vi.fn(async () => []),
}))

vi.mock('../lib/swaAuth', () => ({
  requireAdmin: vi.fn(() => ({ ok: true, principal: { userId: 'admin-user', userRoles: ['admin'] } })),
}))

import { createShareLink, listShareLinks } from '../lib/shareLinksTable'
import { requireAdmin } from '../lib/swaAuth'
import handler from './index'

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
})

describe('/api/admin-share-links', () => {
  describe('auth guard', () => {
    it('returns 401 when requireAdmin fails with 401', async () => {
      ;(requireAdmin as ReturnType<typeof vi.fn>).mockReturnValueOnce({ ok: false, status: 401, error: 'Unauthorized' })
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: {} })
      expect(context.res).toMatchObject({ status: 401 })
    })

    it('returns 403 when requireAdmin fails with 403', async () => {
      ;(requireAdmin as ReturnType<typeof vi.fn>).mockReturnValueOnce({ ok: false, status: 403, error: 'Forbidden' })
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: {} })
      expect(context.res).toMatchObject({ status: 403 })
    })
  })

  describe('GET', () => {
    it('returns 200 with links array', async () => {
      const mockLinks = [{ partitionKey: 'links', rowKey: 'id1', createdAtEpoch: 1000, expiresAtEpoch: 9999 }]
      ;(listShareLinks as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockLinks)
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({ status: 200, body: { links: mockLinks } })
    })

    it('calls listShareLinks with limit 200', async () => {
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: makeAdminHeaders() })
      expect(listShareLinks).toHaveBeenCalledWith(200)
    })
  })

  describe('POST', () => {
    it('returns 403 when Origin does not match host', async () => {
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'POST',
        headers: {
          origin: 'https://evil.com',
          host: 'example.com',
          'x-cv-admin': '1',
          'content-type': 'application/json',
        },
        body: { expiresAtEpoch: Math.floor(Date.now() / 1000) + 86400 },
      })
      expect(context.res).toMatchObject({ status: 403 })
    })

    it('returns 400 when x-cv-admin header is missing', async () => {
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'POST',
        headers: {
          origin: 'https://example.com',
          host: 'example.com',
          'content-type': 'application/json',
        },
        body: { expiresAtEpoch: Math.floor(Date.now() / 1000) + 86400 },
      })
      expect(context.res).toMatchObject({ status: 400 })
    })

    it('returns 415 when content-type is not JSON', async () => {
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'POST',
        headers: {
          origin: 'https://example.com',
          host: 'example.com',
          'x-cv-admin': '1',
          'content-type': 'text/plain',
        },
        body: { expiresAtEpoch: Math.floor(Date.now() / 1000) + 86400 },
      })
      expect(context.res).toMatchObject({ status: 415 })
    })

    it('returns 400 when expiresAtEpoch is missing', async () => {
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'POST',
        headers: makeAdminHeaders(),
        body: { notes: 'test' },
      })
      expect(context.res).toMatchObject({ status: 400 })
    })

    it('returns 400 when expiresAtEpoch is in the past', async () => {
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'POST',
        headers: makeAdminHeaders(),
        body: { expiresAtEpoch: Math.floor(Date.now() / 1000) - 1 },
      })
      expect(context.res).toMatchObject({ status: 400 })
    })

    it('returns 400 when expiresAtEpoch is more than 365 days out', async () => {
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'POST',
        headers: makeAdminHeaders(),
        body: { expiresAtEpoch: Math.floor(Date.now() / 1000) + 366 * 24 * 60 * 60 },
      })
      expect(context.res).toMatchObject({ status: 400 })
    })

    it('returns 201 with id on successful creation using expiresAtEpoch', async () => {
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'POST',
        headers: makeAdminHeaders(),
        body: { expiresAtEpoch: Math.floor(Date.now() / 1000) + 86400, notes: 'test share' },
      })
      expect(context.res).toMatchObject({ status: 201, body: { id: 'new-share-id-123' } })
    })

    it('returns 201 when using expiresInDays instead of expiresAtEpoch', async () => {
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'POST',
        headers: makeAdminHeaders(),
        body: { expiresInDays: 30 },
      })
      expect(context.res).toMatchObject({ status: 201 })
      expect(createShareLink).toHaveBeenCalledWith(
        expect.objectContaining({ expiresAtEpoch: expect.any(Number) }),
      )
    })

    it('clamps expiresInDays to 1–365 range', async () => {
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'POST',
        headers: makeAdminHeaders(),
        body: { expiresInDays: 9999 },
      })
      expect(context.res).toMatchObject({ status: 201 })
      const call = (createShareLink as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const now = Math.floor(Date.now() / 1000)
      expect(call.expiresAtEpoch).toBeLessThanOrEqual(now + 365 * 24 * 60 * 60 + 5)
    })
  })

  describe('unsupported methods', () => {
    it('returns 405 for DELETE', async () => {
      const context: { res?: unknown } = {}
      await handler(context, { method: 'DELETE', headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({ status: 405 })
    })

    it('returns 405 for PATCH', async () => {
      const context: { res?: unknown } = {}
      await handler(context, { method: 'PATCH', headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({ status: 405 })
    })
  })
})
