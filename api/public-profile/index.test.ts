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

afterEach(() => {
  vi.restoreAllMocks()
  resetEnv()
})

describe('/api/public-profile', () => {
  it('returns inline payload when configured', async () => {
    process.env.PROFILE_PAYLOAD_SOURCE = 'inline'
    process.env.PUBLIC_PROFILE_JSON = '{"basics":{"name":"Jane"}}'
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { 'accept-language': 'en' } })

    expect(context.res).toMatchObject({
      status: 200,
      body: { basics: { name: 'Jane' }, locale: 'en' },
    })
    expect(context.log).toHaveBeenCalledWith(
      'Loaded PUBLIC_PROFILE payload',
      expect.objectContaining({ payloadSource: 'inline_env', sourceMode: 'inline' }),
    )
  })

  it('returns 502 when URL payload fetch fails', async () => {
    process.env.PROFILE_PAYLOAD_SOURCE = 'url'
    process.env.PUBLIC_PROFILE_JSON_URL = 'https://example.blob.core.windows.net/public/profile.json'
    vi.stubGlobal('fetch', vi.fn(async () => new Response('missing', { status: 404 })))
    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }

    await handler(context, { headers: { 'accept-language': 'en' } })

    expect(context.res).toMatchObject({
      status: 502,
      body: { error: 'PUBLIC_PROFILE_JSON could not be loaded.' },
    })
    expect(context.log).toHaveBeenCalledWith(
      'Failed loading PUBLIC_PROFILE payload',
      expect.objectContaining({ failureReason: 'http_non_2xx', httpStatus: 404 }),
    )
  })
})
