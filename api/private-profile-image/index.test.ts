import crypto from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from './index'

vi.mock('../lib/profileBlobStore', () => {
  return {
    readProfileImage: vi.fn(async () => null),
  }
})

import { readProfileImage } from '../lib/profileBlobStore'

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

function signToken(exp: number, signingSecret: string) {
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url')
  const signature = crypto.createHmac('sha256', signingSecret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

afterEach(() => {
  vi.restoreAllMocks()
  resetEnv()
})

describe('/api/private-profile/image', () => {
  it('returns 500 when signing key is not configured', async () => {
    process.env.CV_SESSION_SIGNING_KEY = ''
    const context: { res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {}

    await handler(context, { headers: {} })

    expect(context.res).toMatchObject({
      status: 500,
      body: { error: 'Server is not configured.' },
    })
  })

  it('returns 401 when no token is provided', async () => {
    process.env.CV_SESSION_SIGNING_KEY = 'test-signing-secret'
    const context: { res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {}

    await handler(context, { headers: {} })

    expect(context.res).toMatchObject({
      status: 401,
      body: { error: 'Unauthorized' },
    })
  })

  it('returns 401 when token is expired', async () => {
    const signingSecret = 'test-signing-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    const token = signToken(Math.floor(Date.now() / 1000) - 100, signingSecret)
    const context: { res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {}

    await handler(context, { headers: { authorization: `Bearer ${token}` } })

    expect(context.res).toMatchObject({
      status: 401,
      body: { error: 'Unauthorized' },
    })
  })

  it('returns 401 when token signature is invalid', async () => {
    const signingSecret = 'test-signing-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, 'wrong-secret')
    const context: { res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {}

    await handler(context, { headers: { authorization: `Bearer ${token}` } })

    expect(context.res).toMatchObject({
      status: 401,
      body: { error: 'Unauthorized' },
    })
  })

  it('returns image when token is valid and image exists', async () => {
    const signingSecret = 'test-signing-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const imageBuffer = Buffer.from('fake-image-data')
    ;(readProfileImage as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      buffer: imageBuffer,
      contentType: 'image/png',
    })
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret)
    const context: { res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {}

    await handler(context, { headers: { authorization: `Bearer ${token}` } })

    expect(context.res).toMatchObject({
      status: 200,
      headers: {
        'content-type': 'image/png',
        'content-length': String(imageBuffer.byteLength),
      },
    })
    expect((context.res as any).body).toBe(imageBuffer)
  })

  it('returns 404 when token is valid but no image exists', async () => {
    const signingSecret = 'test-signing-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.CV_PROFILE_SLUG = 'john-doe'
    ;(readProfileImage as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret)
    const context: { res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {}

    await handler(context, { headers: { authorization: `Bearer ${token}` } })

    expect(context.res).toMatchObject({
      status: 404,
      body: { error: 'No profile image found.' },
    })
  })

  it('accepts token from cookie', async () => {
    const signingSecret = 'test-signing-secret'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.CV_PROFILE_SLUG = 'john-doe'
    const imageBuffer = Buffer.from('fake-image-data')
    ;(readProfileImage as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      buffer: imageBuffer,
      contentType: 'image/jpeg',
    })
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret)
    const context: { res?: { status: number; headers?: Record<string, string>; body?: unknown } } = {}

    await handler(context, { headers: { cookie: `cv_session=${encodeURIComponent(token)}` } })

    expect(context.res).toMatchObject({
      status: 200,
      headers: { 'content-type': 'image/jpeg' },
    })
  })
})
