import crypto from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './index'

vi.mock('../lib/profileBlobStore', () => ({
  readProfileJsonV2: vi.fn(async () => '{"basics":{"name":"Jane Doe","headline":"Engineer"}}'),
}))

vi.mock('../lib/shareLinksTable', () => ({
  validateShareLink: vi.fn(async () => ({ ok: true, entity: {} })),
}))

vi.mock('../lib/cvPdfDocument', () => ({
  buildCvPdfBuffer: vi.fn(async () => Buffer.from('%PDF-1.4 mock')),
}))

import { readProfileJsonV2 } from '../lib/profileBlobStore'
import { validateShareLink } from '../lib/shareLinksTable'
import { buildCvPdfBuffer } from '../lib/cvPdfDocument'

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
  resetEnv()
})

describe('/api/cv-pdf', () => {
  it('returns a PDF buffer with correct headers when auth is valid', async () => {
    const signingSecret = 'test-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.CV_PROFILE_SLUG = 'jane-doe'
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret)
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { authorization: `Bearer ${token}`, 'accept-language': 'en' } })

    expect(context.res).toMatchObject({
      status: 200,
      headers: expect.objectContaining({
        'content-type': 'application/pdf',
        'cache-control': 'no-store',
      }),
      isRaw: true,
    })
    expect(buildCvPdfBuffer).toHaveBeenCalledWith(expect.objectContaining({ basics: { name: 'Jane Doe', headline: 'Engineer' } }))
  })

  it('returns 401 when no token is provided', async () => {
    process.env.CV_SESSION_SIGNING_KEY = 'test-secret'
    process.env.CV_PROFILE_SLUG = 'jane-doe'
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: {} })

    expect(context.res).toMatchObject({ status: 401, body: { error: 'Unauthorized' } })
  })

  it('returns 401 when share link is revoked', async () => {
    const signingSecret = 'test-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.CV_PROFILE_SLUG = 'jane-doe'
    ;(validateShareLink as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, reason: 'revoked' })
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret)
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { authorization: `Bearer ${token}` } })

    expect(context.res).toMatchObject({ status: 401, body: { error: 'Unauthorized' } })
  })

  it('returns 500 when signing key is not configured', async () => {
    delete process.env.CV_SESSION_SIGNING_KEY
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: {} })

    expect(context.res).toMatchObject({ status: 500, body: { error: 'Server is not configured.' } })
  })

  it('returns 500 when PDF generation fails', async () => {
    const signingSecret = 'test-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.CV_PROFILE_SLUG = 'jane-doe'
    ;(buildCvPdfBuffer as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('render error'))
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret)
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { authorization: `Bearer ${token}`, 'accept-language': 'en' } })

    expect(context.res).toMatchObject({ status: 500, body: { error: 'PDF generation failed.' } })
  })

  it('returns 502 when blob store fetch fails', async () => {
    const signingSecret = 'test-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.CV_PROFILE_SLUG = 'jane-doe'
    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('blob error'))
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret)
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { authorization: `Bearer ${token}`, 'accept-language': 'en' } })

    expect(context.res).toMatchObject({ status: 502, body: { error: 'CV data could not be loaded.' } })
  })
})
