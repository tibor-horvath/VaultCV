import crypto from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearProfilePayloadCache } from '../lib/profilePayloadSource'
import handler from './index'

vi.mock('../lib/profileBlobStore', () => {
  return {
    readProfileJsonV2: vi.fn(async () => ''),
  }
})

vi.mock('../lib/shareLinksTable', () => {
  return {
    validateShareLink: vi.fn(async () => ({ ok: true, entity: {} })),
  }
})

import { readProfileJsonV2 } from '../lib/profileBlobStore'
import { validateShareLink } from '../lib/shareLinksTable'

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

function signToken(exp: number, signingSecret: string, shareId: string = 'test-share-id') {
  const payload = Buffer.from(JSON.stringify({ exp, shareId })).toString('base64url')
  const signature = crypto.createHmac('sha256', signingSecret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

afterEach(() => {
  vi.restoreAllMocks()
  clearProfilePayloadCache()
  resetEnv()
})

describe('/api/cv', () => {
  it('returns blob V2 payload when configured and auth is valid', async () => {
    const signingSecret = 'test-signing-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.CV_PROFILE_SLUG = 'john-doe'
    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('{"basics":{"name":"Jane"}}')
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret)
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { authorization: `Bearer ${token}`, 'accept-language': 'en' } })

    expect(readProfileJsonV2).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'private', locale: 'en', slugFromName: 'john-doe', legacyFallback: false }),
    )
    expect(context.res).toMatchObject({
      status: 200,
      body: { basics: { name: 'Jane' }, locale: 'en' },
    })
    expect(context.log).toHaveBeenCalledWith(
      'Loaded PRIVATE_PROFILE payload',
      expect.objectContaining({ payloadSource: 'blob_v2' }),
    )
  })

  it('rewrites legacy admin photo URL to private endpoint', async () => {
    const signingSecret = 'test-signing-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.CV_PROFILE_SLUG = 'john-doe'
    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      '{"basics":{"name":"Jane","photoUrl":"/api/manage/profile/image"}}',
    )
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret)
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { authorization: `Bearer ${token}`, 'accept-language': 'en' } })

    expect(context.res).toMatchObject({
      status: 200,
      body: { basics: { name: 'Jane', photoUrl: '/api/private-profile/image' }, locale: 'en' },
    })
  })

  it('rewrites public photo URL to private endpoint', async () => {
    const signingSecret = 'test-signing-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.CV_PROFILE_SLUG = 'john-doe'
    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      '{"basics":{"name":"Jane","photoUrl":"/api/public-profile/image"}}',
    )
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret)
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { authorization: `Bearer ${token}`, 'accept-language': 'en' } })

    expect(context.res).toMatchObject({
      status: 200,
      body: { basics: { name: 'Jane', photoUrl: '/api/private-profile/image' }, locale: 'en' },
    })
  })

  it('leaves private-profile photo URLs unchanged', async () => {
    const signingSecret = 'test-signing-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.CV_PROFILE_SLUG = 'john-doe'
    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      '{"basics":{"name":"Jane","photoUrl":"/api/private-profile/image"}}',
    )
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret)
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { authorization: `Bearer ${token}`, 'accept-language': 'en' } })

    expect(context.res).toMatchObject({
      status: 200,
      body: { basics: { name: 'Jane', photoUrl: '/api/private-profile/image' }, locale: 'en' },
    })
  })

  it('returns 502 when blob V2 fetch fails', async () => {
    const signingSecret = 'test-signing-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.CV_PROFILE_SLUG = 'john-doe'
    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('boom'))
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret)
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { authorization: `Bearer ${token}`, 'accept-language': 'en' } })

    expect(context.res).toMatchObject({
      status: 502,
      body: { error: 'CV data could not be loaded.' },
    })
  })

  it('returns 401 when share link is revoked', async () => {
    const signingSecret = 'test-signing-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret, 'revoked-share-id')
    ;(validateShareLink as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      reason: 'revoked',
    })
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { authorization: `Bearer ${token}`, 'accept-language': 'en' } })

    expect(validateShareLink).toHaveBeenCalledWith('revoked-share-id')
    expect(context.res).toMatchObject({
      status: 401,
      body: { error: 'Unauthorized' },
    })
    expect(context.log).toHaveBeenCalledWith('Unauthorized /api/cv request: share link invalid', expect.objectContaining({ reason: 'revoked' }))
  })

  it('returns 401 when share link is expired', async () => {
    const signingSecret = 'test-signing-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret, 'expired-share-id')
    ;(validateShareLink as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      reason: 'expired',
    })
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { authorization: `Bearer ${token}`, 'accept-language': 'en' } })

    expect(validateShareLink).toHaveBeenCalledWith('expired-share-id')
    expect(context.res).toMatchObject({
      status: 401,
      body: { error: 'Unauthorized' },
    })
  })

  it('returns 401 when share link does not exist', async () => {
    const signingSecret = 'test-signing-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret, 'missing-share-id')
    ;(validateShareLink as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      reason: 'not_found',
    })
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { authorization: `Bearer ${token}`, 'accept-language': 'en' } })

    expect(validateShareLink).toHaveBeenCalledWith('missing-share-id')
    expect(context.res).toMatchObject({
      status: 401,
      body: { error: 'Unauthorized' },
    })
  })
})
