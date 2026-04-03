import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/profileBlobStore', () => ({
  readProfileImage: vi.fn(async () => null),
  writeProfileImage: vi.fn(async () => undefined),
  deleteProfileImage: vi.fn(async () => undefined),
}))

vi.mock('../lib/swaAuth', () => ({
  requireAdmin: vi.fn(() => ({ ok: true, principal: { userId: 'admin-user', userRoles: ['admin'] } })),
}))

import { deleteProfileImage, readProfileImage, writeProfileImage } from '../lib/profileBlobStore'
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
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  resetEnv()
})

describe('/api/profile-image', () => {
  describe('auth guard', () => {
    it('returns 401 when admin auth fails', async () => {
      ;(requireAdmin as ReturnType<typeof vi.fn>).mockReturnValueOnce({ ok: false, status: 401, error: 'Unauthorized' })
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: {} })
      expect(context.res).toMatchObject({ status: 401 })
    })
  })

  describe('slug configuration', () => {
    it('returns 500 when CV_PROFILE_SLUG is not configured', async () => {
      delete process.env.CV_PROFILE_SLUG
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({ status: 500, body: { error: 'CV_PROFILE_SLUG is not configured.' } })
    })
  })

  describe('HEAD', () => {
    it('returns 404 when no image is stored', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      ;(readProfileImage as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
      const context: { res?: unknown } = {}
      await handler(context, { method: 'HEAD', headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({ status: 404 })
      expect((context.res as { body?: unknown })?.body).toBeUndefined()
    })

    it('returns 200 with headers but no body when image exists', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const fakeBuffer = Buffer.from('fake-jpeg-data')
      ;(readProfileImage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        buffer: fakeBuffer,
        contentType: 'image/jpeg',
      })
      const context: { res?: unknown } = {}
      await handler(context, { method: 'HEAD', headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({
        status: 200,
        headers: expect.objectContaining({ 'content-type': 'image/jpeg' }),
      })
      expect((context.res as { body?: unknown })?.body).toBeUndefined()
    })
  })

  describe('GET', () => {
    it('returns 404 when no image is stored', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      ;(readProfileImage as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({ status: 404 })
    })

    it('returns 200 with image buffer when image exists', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const fakeBuffer = Buffer.from('fake-jpeg-data')
      ;(readProfileImage as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        buffer: fakeBuffer,
        contentType: 'image/jpeg',
      })
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({
        status: 200,
        headers: expect.objectContaining({ 'content-type': 'image/jpeg' }),
        body: fakeBuffer,
      })
    })
  })

  describe('PUT', () => {
    it('returns 403 when Origin does not match host', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: { origin: 'https://evil.com', host: 'example.com', 'x-cv-admin': '1' },
        body: { mimeType: 'image/jpeg', data: Buffer.from('x').toString('base64') },
      })
      expect(context.res).toMatchObject({ status: 403 })
    })

    it('returns 400 when x-cv-admin header is missing', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: { origin: 'https://example.com', host: 'example.com' },
        body: { mimeType: 'image/jpeg', data: Buffer.from('x').toString('base64') },
      })
      expect(context.res).toMatchObject({ status: 400 })
    })

    it('returns 415 for unsupported mimeType', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        body: { mimeType: 'image/gif', data: Buffer.from('x').toString('base64') },
      })
      expect(context.res).toMatchObject({ status: 415 })
    })

    it('returns 400 when data field is missing', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        body: { mimeType: 'image/jpeg' },
      })
      expect(context.res).toMatchObject({ status: 400 })
    })

    it('returns 413 when image exceeds 2 MB', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const oversizedData = Buffer.alloc(2 * 1024 * 1024 + 1).toString('base64')
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        body: { mimeType: 'image/jpeg', data: oversizedData },
      })
      expect(context.res).toMatchObject({ status: 413 })
    })

    it('returns 200 on successful upload of JPEG', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const smallData = Buffer.from('fake-jpeg').toString('base64')
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        body: { mimeType: 'image/jpeg', data: smallData },
      })
      expect(writeProfileImage).toHaveBeenCalledWith('john-doe', expect.any(Buffer), 'image/jpeg')
      expect(context.res).toMatchObject({ status: 200, body: { ok: true } })
    })

    it('returns 200 on successful upload of PNG', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const smallData = Buffer.from('fake-png').toString('base64')
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'PUT',
        headers: makeAdminHeaders(),
        body: { mimeType: 'image/png', data: smallData },
      })
      expect(writeProfileImage).toHaveBeenCalledWith('john-doe', expect.any(Buffer), 'image/png')
      expect(context.res).toMatchObject({ status: 200, body: { ok: true } })
    })
  })

  describe('DELETE', () => {
    it('returns 403 when Origin does not match host', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, {
        method: 'DELETE',
        headers: { origin: 'https://evil.com', host: 'example.com', 'x-cv-admin': '1' },
      })
      expect(context.res).toMatchObject({ status: 403 })
    })

    it('returns 200 after successful deletion', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, { method: 'DELETE', headers: makeAdminHeaders() })
      expect(deleteProfileImage).toHaveBeenCalledWith('john-doe')
      expect(context.res).toMatchObject({ status: 200, body: { ok: true } })
    })
  })

  describe('unsupported methods', () => {
    it('returns 405 for POST', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      const context: { res?: unknown } = {}
      await handler(context, { method: 'POST', headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({ status: 405 })
    })
  })

  describe('error handling', () => {
    it('returns 500 when readProfileImage throws', async () => {
      process.env.CV_PROFILE_SLUG = 'john-doe'
      ;(readProfileImage as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('storage failure'))
      const context: { res?: unknown } = {}
      await handler(context, { method: 'GET', headers: makeAdminHeaders() })
      expect(context.res).toMatchObject({ status: 500, body: { error: 'storage failure' } })
    })
  })
})
