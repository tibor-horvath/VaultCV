import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearProfilePayloadCache, ProfilePayloadSourceError, readLocalizedProfilePayload, readProfilePayloadMode } from './profilePayloadSource'

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

describe('readProfilePayloadMode', () => {
  it('returns auto by default and for invalid value', () => {
    delete process.env.PROFILE_PAYLOAD_SOURCE
    expect(readProfilePayloadMode()).toBe('auto')
    process.env.PROFILE_PAYLOAD_SOURCE = 'invalid'
    expect(readProfilePayloadMode()).toBe('auto')
  })
})

describe('readLocalizedProfilePayload', () => {
  it('reads inline payload in inline mode', async () => {
    process.env.PROFILE_PAYLOAD_SOURCE = 'inline'
    process.env.PRIVATE_PROFILE_JSON_DE = '{"name":"inline"}'

    const result = await readLocalizedProfilePayload('PRIVATE_PROFILE_JSON', 'de')

    expect(result.raw).toBe('{"name":"inline"}')
    expect(result.resolvedLocale).toBe('de')
    expect(result.source).toBe('inline_env')
  })

  it('reads URL payload and uses cache on second call', async () => {
    process.env.PROFILE_PAYLOAD_SOURCE = 'url'
    process.env.PRIVATE_PROFILE_JSON_URL = 'https://example.blob.core.windows.net/private/profile.json'
    process.env.PROFILE_PAYLOAD_CACHE_TTL_MS = '60000'
    const fetchMock = vi.fn(async () => new Response('{"name":"url"}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const first = await readLocalizedProfilePayload('PRIVATE_PROFILE_JSON', 'en')
    const second = await readLocalizedProfilePayload('PRIVATE_PROFILE_JSON', 'en')

    expect(first.source).toBe('url_env')
    expect(first.fromCache).toBe(false)
    expect(second.fromCache).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('falls back to inline in auto mode when URL is unset', async () => {
    process.env.PROFILE_PAYLOAD_SOURCE = 'auto'
    process.env.PRIVATE_PROFILE_JSON = '{"name":"fallback"}'
    delete process.env.PRIVATE_PROFILE_JSON_URL

    const result = await readLocalizedProfilePayload('PRIVATE_PROFILE_JSON', 'en')

    expect(result.source).toBe('inline_env')
    expect(result.raw).toBe('{"name":"fallback"}')
  })

  it('falls back to inline in auto mode when URL fetch fails', async () => {
    process.env.PROFILE_PAYLOAD_SOURCE = 'auto'
    process.env.PRIVATE_PROFILE_JSON_URL = 'https://example.blob.core.windows.net/private/profile.json'
    process.env.PRIVATE_PROFILE_JSON = '{"name":"fallback-inline"}'
    vi.stubGlobal('fetch', vi.fn(async () => new Response('denied', { status: 403 })))

    const result = await readLocalizedProfilePayload('PRIVATE_PROFILE_JSON', 'en')

    expect(result.source).toBe('inline_env')
    expect(result.raw).toBe('{"name":"fallback-inline"}')
  })

  it('throws for host not allowlisted', async () => {
    process.env.PROFILE_PAYLOAD_SOURCE = 'url'
    process.env.PRIVATE_PROFILE_JSON_URL = 'https://evil.example.com/profile.json'
    process.env.PROFILE_PAYLOAD_ALLOWED_HOSTS = 'good.example.com'

    await expect(readLocalizedProfilePayload('PRIVATE_PROFILE_JSON', 'en')).rejects.toMatchObject<Partial<ProfilePayloadSourceError>>({
      reason: 'host_not_allowed',
    })
  })

  it('throws for non-2xx URL response', async () => {
    process.env.PROFILE_PAYLOAD_SOURCE = 'url'
    process.env.PRIVATE_PROFILE_JSON_URL = 'https://example.blob.core.windows.net/private/profile.json'
    vi.stubGlobal('fetch', vi.fn(async () => new Response('denied', { status: 403 })))

    await expect(readLocalizedProfilePayload('PRIVATE_PROFILE_JSON', 'en')).rejects.toMatchObject<Partial<ProfilePayloadSourceError>>({
      reason: 'http_non_2xx',
      httpStatus: 403,
    })
  })
})
