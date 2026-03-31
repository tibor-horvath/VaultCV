import crypto from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearProfilePayloadCache } from '../lib/profilePayloadSource'
import handler from './index'

vi.mock('../lib/profileBlobStore', () => {
  return {
    readProfileJsonV2: vi.fn(async () => ''),
  }
})

import { readProfileJsonV2 } from '../lib/profileBlobStore'

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
})
