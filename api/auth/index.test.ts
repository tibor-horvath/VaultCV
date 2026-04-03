import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('../lib/shareLinksTable', () => ({
  validateShareLink: vi.fn(async () => ({ ok: true, entity: {} })),
  markShareLinkViewed: vi.fn(async () => undefined),
}))

import { markShareLinkViewed, validateShareLink } from '../lib/shareLinksTable'
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

// A valid-format share id (base64url, 16–64 chars)
const VALID_SHARE_ID = 'aaaaaaaaaaaaaaaaaaaaaa'

afterEach(() => {
  vi.restoreAllMocks()
  resetEnv()
})

describe('/api/auth', () => {
  it('returns 500 when signing secret is not configured', async () => {
    delete process.env.CV_SESSION_SIGNING_KEY
    const context: { res?: unknown } = {}
    await handler(context, { body: { shareId: VALID_SHARE_ID } })
    expect(context.res).toMatchObject({ status: 500, body: { error: 'Server is not configured.' } })
  })

  it('returns 400 when shareId is missing from body', async () => {
    process.env.CV_SESSION_SIGNING_KEY = 'secret'
    const context: { res?: unknown } = {}
    await handler(context, { body: {} })
    expect(context.res).toMatchObject({ status: 400, body: { error: 'Missing share id.' } })
  })

  it('returns 400 when body is null', async () => {
    process.env.CV_SESSION_SIGNING_KEY = 'secret'
    const context: { res?: unknown } = {}
    await handler(context, { body: null })
    expect(context.res).toMatchObject({ status: 400, body: { error: 'Missing share id.' } })
  })

  it('returns 400 for invalid shareId format (contains spaces)', async () => {
    process.env.CV_SESSION_SIGNING_KEY = 'secret'
    const context: { res?: unknown } = {}
    await handler(context, { body: { shareId: 'bad id with spaces!' } })
    expect(context.res).toMatchObject({ status: 400, body: { error: 'Invalid share id format.' } })
  })

  it('returns 400 for too-short shareId', async () => {
    process.env.CV_SESSION_SIGNING_KEY = 'secret'
    const context: { res?: unknown } = {}
    await handler(context, { body: { shareId: 'abc' } })
    expect(context.res).toMatchObject({ status: 400 })
  })

  it('returns 401 when share link validation returns not_found', async () => {
    process.env.CV_SESSION_SIGNING_KEY = 'secret'
    ;(validateShareLink as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, reason: 'not_found' })
    const context: { res?: unknown } = {}
    await handler(context, { body: { shareId: VALID_SHARE_ID } })
    expect(context.res).toMatchObject({ status: 401, body: { error: 'Unauthorized' } })
  })

  it('returns 401 when share link is revoked', async () => {
    process.env.CV_SESSION_SIGNING_KEY = 'secret'
    ;(validateShareLink as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, reason: 'revoked' })
    const context: { res?: unknown } = {}
    await handler(context, { body: { shareId: VALID_SHARE_ID } })
    expect(context.res).toMatchObject({ status: 401 })
  })

  it('returns 401 when share link is expired', async () => {
    process.env.CV_SESSION_SIGNING_KEY = 'secret'
    ;(validateShareLink as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, reason: 'expired' })
    const context: { res?: unknown } = {}
    await handler(context, { body: { shareId: VALID_SHARE_ID } })
    expect(context.res).toMatchObject({ status: 401 })
  })

  it('returns 200 with accessToken on success', async () => {
    process.env.CV_SESSION_SIGNING_KEY = 'secret'
    const context: { res?: unknown } = {}
    await handler(context, { body: { shareId: VALID_SHARE_ID } })
    expect(context.res).toMatchObject({ status: 200 })
    const body = (context.res as { body: { accessToken?: string } }).body
    expect(typeof body.accessToken).toBe('string')
    expect(body.accessToken!.length).toBeGreaterThan(0)
  })

  it('calls markShareLinkViewed on success', async () => {
    process.env.CV_SESSION_SIGNING_KEY = 'secret'
    const context: { res?: unknown } = {}
    await handler(context, { body: { shareId: VALID_SHARE_ID } })
    expect(markShareLinkViewed).toHaveBeenCalledWith(VALID_SHARE_ID)
  })

  it('sets set-cookie header on success', async () => {
    process.env.CV_SESSION_SIGNING_KEY = 'secret'
    const context: { res?: unknown } = {}
    await handler(context, { body: { shareId: VALID_SHARE_ID } })
    const res = context.res as { headers: Record<string, string> }
    expect(res.headers['set-cookie']).toContain('cv_session=')
    expect(res.headers['set-cookie']).toContain('HttpOnly')
    expect(res.headers['set-cookie']).toContain('Secure')
  })

  it('accessToken in response matches the cookie token', async () => {
    process.env.CV_SESSION_SIGNING_KEY = 'secret'
    const context: { res?: unknown } = {}
    await handler(context, { body: { shareId: VALID_SHARE_ID } })
    const res = context.res as { headers: Record<string, string>; body: { accessToken: string } }
    const tokenFromBody = res.body.accessToken
    const cookieHeader = res.headers['set-cookie']
    expect(cookieHeader).toContain(encodeURIComponent(tokenFromBody))
  })

  it('accepts shareId via legacy "share" field', async () => {
    process.env.CV_SESSION_SIGNING_KEY = 'secret'
    const context: { res?: unknown } = {}
    await handler(context, { body: { share: VALID_SHARE_ID } })
    expect(context.res).toMatchObject({ status: 200 })
  })

  it('includes cache-control: no-store header', async () => {
    process.env.CV_SESSION_SIGNING_KEY = 'secret'
    const context: { res?: unknown } = {}
    await handler(context, { body: { shareId: VALID_SHARE_ID } })
    const res = context.res as { headers: Record<string, string> }
    expect(res.headers['cache-control']).toBe('no-store')
  })
})
