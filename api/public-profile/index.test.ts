import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearProfilePayloadCache } from '../lib/profilePayloadSource'
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

afterEach(() => {
  vi.restoreAllMocks()
  clearProfilePayloadCache()
  resetEnv()
})

describe('/api/public-profile', () => {
  it('returns URL payload when configured', async () => {
    process.env.PUBLIC_PROFILE_JSON_URL = 'https://example.blob.core.windows.net/public/profile.json'
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"basics":{"name":"Jane"}}', { status: 200 })))
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { 'accept-language': 'en' } })

    expect(context.res).toMatchObject({
      status: 200,
      body: { basics: { name: 'Jane' }, locale: 'en' },
    })
    expect(context.log).toHaveBeenCalledWith(
      'Loaded PUBLIC_PROFILE payload',
      expect.objectContaining({ payloadSource: 'url_env' }),
    )
  })

  it('returns 502 when URL payload fetch fails', async () => {
    process.env.PUBLIC_PROFILE_JSON_URL = 'https://example.blob.core.windows.net/public/profile.json'
    vi.stubGlobal('fetch', vi.fn(async () => new Response('missing', { status: 404 })))
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { 'accept-language': 'en' } })

    expect(context.res).toMatchObject({
      status: 502,
      body: { error: 'PUBLIC_PROFILE_JSON_URL could not be loaded.' },
    })
    expect(context.log).toHaveBeenCalledWith(
      'Failed loading PUBLIC_PROFILE payload',
      expect.objectContaining({ failureReason: 'http_non_2xx', httpStatus: 404 }),
    )
  })
})
