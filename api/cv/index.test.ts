import crypto from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

function signToken(exp: number, signingSecret: string) {
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url')
  const signature = crypto.createHmac('sha256', signingSecret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

afterEach(() => {
  vi.restoreAllMocks()
  resetEnv()
})

describe('/api/cv', () => {
  it('returns inline payload when configured and auth is valid', async () => {
    const signingSecret = 'test-signing-secret'
    process.env.PROFILE_PAYLOAD_SOURCE = 'inline'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.PRIVATE_PROFILE_JSON = '{"basics":{"name":"Jane"}}'
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret)
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { authorization: `Bearer ${token}`, 'accept-language': 'en' } })

    expect(context.res).toMatchObject({
      status: 200,
      body: { basics: { name: 'Jane' }, locale: 'en' },
    })
    expect(context.log).toHaveBeenCalledWith(
      'Loaded PRIVATE_PROFILE payload',
      expect.objectContaining({ payloadSource: 'inline_env', sourceMode: 'inline' }),
    )
  })

  it('returns 502 when URL payload fetch fails', async () => {
    const signingSecret = 'test-signing-secret'
    process.env.PROFILE_PAYLOAD_SOURCE = 'url'
    process.env.CV_SESSION_SIGNING_KEY = signingSecret
    process.env.PRIVATE_PROFILE_JSON_URL = 'https://example.blob.core.windows.net/private/profile.json'
    vi.stubGlobal('fetch', vi.fn(async () => new Response('denied', { status: 403 })))
    const token = signToken(Math.floor(Date.now() / 1000) + 3600, signingSecret)
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { authorization: `Bearer ${token}`, 'accept-language': 'en' } })

    expect(context.res).toMatchObject({
      status: 502,
      body: { error: 'CV data could not be loaded.' },
    })
    expect(context.log).toHaveBeenCalledWith(
      'Failed loading PRIVATE_PROFILE payload',
      expect.objectContaining({ failureReason: 'http_non_2xx', httpStatus: 403 }),
    )
  })
})
