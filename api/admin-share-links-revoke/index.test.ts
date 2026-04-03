import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/shareLinksTable', () => ({
  revokeShareLink: vi.fn(async () => true),
}))

vi.mock('../lib/swaAuth', () => ({
  requireAdmin: vi.fn(() => ({ ok: true, principal: { userId: 'admin-user', userRoles: ['admin'] } })),
}))

import { revokeShareLink } from '../lib/shareLinksTable'
import { requireAdmin } from '../lib/swaAuth'
import handler from './index'

function makeAdminHeaders() {
  return {
    origin: 'https://example.com',
    host: 'example.com',
    'x-cv-admin': '1',
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('/api/admin-share-links-revoke', () => {
  describe('auth guard', () => {
    it('returns 401 when admin auth fails', async () => {
      ;(requireAdmin as ReturnType<typeof vi.fn>).mockReturnValueOnce({ ok: false, status: 401, error: 'Unauthorized' })
      const context: { res?: unknown } = {}
      await handler(context, { params: { id: 'validid1234567890' }, headers: {} })
      expect(context.res).toMatchObject({ status: 401 })
    })
  })

  describe('origin guard', () => {
    it('returns 403 when Origin does not match host', async () => {
      const context: { res?: unknown } = {}
      await handler(context, {
        params: { id: 'validid1234567890' },
        headers: { origin: 'https://evil.com', host: 'example.com', 'x-cv-admin': '1' },
      })
      expect(context.res).toMatchObject({ status: 403 })
    })
  })

  describe('admin mutation header guard', () => {
    it('returns 400 when x-cv-admin header is missing', async () => {
      const context: { res?: unknown } = {}
      await handler(context, {
        params: { id: 'validid1234567890' },
        headers: { origin: 'https://example.com', host: 'example.com' },
      })
      expect(context.res).toMatchObject({ status: 400 })
    })
  })

  describe('id validation', () => {
    it('returns 400 when id param is missing', async () => {
      const context: { res?: unknown } = {}
      await handler(context, { params: {}, headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({ status: 400, body: { error: 'Missing id.' } })
    })

    it('returns 400 when id is empty string', async () => {
      const context: { res?: unknown } = {}
      await handler(context, { params: { id: '' }, headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({ status: 400 })
    })

    it('returns 400 when id exceeds 128 characters', async () => {
      const context: { res?: unknown } = {}
      await handler(context, { params: { id: 'a'.repeat(129) }, headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({ status: 400, body: { error: 'Invalid id.' } })
    })

    it('returns 400 when id contains invalid characters', async () => {
      const context: { res?: unknown } = {}
      await handler(context, { params: { id: 'id with spaces!' }, headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({ status: 400, body: { error: 'Invalid id.' } })
    })
  })

  describe('revocation', () => {
    it('returns 404 when share link does not exist', async () => {
      ;(revokeShareLink as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false)
      const context: { res?: unknown } = {}
      await handler(context, { params: { id: 'validid1234567890' }, headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({ status: 404, body: { error: 'Not found.' } })
    })

    it('returns 200 when share link is successfully revoked', async () => {
      const context: { res?: unknown } = {}
      await handler(context, { params: { id: 'validid1234567890' }, headers: makeAdminHeaders() })
      expect(revokeShareLink).toHaveBeenCalledWith('validid1234567890')
      expect(context.res).toMatchObject({ status: 200, body: { ok: true } })
    })

    it('accepts valid base64url share ids', async () => {
      const context: { res?: unknown } = {}
      await handler(context, { params: { id: 'abc-def_123XYZ' }, headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({ status: 200 })
    })
  })
})
