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

afterEach(() => {
  vi.restoreAllMocks()
  clearProfilePayloadCache()
  resetEnv()
})

describe('/api/public-profile', () => {
  it('returns URL payload when configured', async () => {
    process.env.CV_PROFILE_SLUG = ''
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

  it('returns V2 blob payload when CV_PROFILE_SLUG is configured and blob exists', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    process.env.PUBLIC_PROFILE_JSON_URL = 'https://example.blob.core.windows.net/public/profile.json'
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"basics":{"name":"Legacy"}}', { status: 200 })))
    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('{"basics":{"name":"Jane"}}')

    const context: { log: ReturnType<typeof vi.fn>; res?: unknown } = { log: vi.fn() }
    await handler(context, { headers: { 'accept-language': 'en' } })

    expect(readProfileJsonV2).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'public', locale: 'en', slugFromName: 'john-doe', legacyFallback: false }),
    )
    expect(context.res).toMatchObject({
      status: 200,
      body: { basics: { name: 'Jane' }, locale: 'en' },
    })
    expect(context.log).toHaveBeenCalledWith(
      'Loaded PUBLIC_PROFILE payload',
      expect.objectContaining({ payloadSource: 'blob_v2' }),
    )
  })

  it('falls back to URL payload when V2 blob is empty', async () => {
    process.env.CV_PROFILE_SLUG = 'john-doe'
    process.env.PUBLIC_PROFILE_JSON_URL = 'https://example.blob.core.windows.net/public/profile.json'
    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('')
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
    process.env.CV_PROFILE_SLUG = ''
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
