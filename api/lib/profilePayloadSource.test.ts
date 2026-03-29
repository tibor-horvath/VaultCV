import { afterEach, describe, expect, it, vi } from 'vitest'
import { clearProfilePayloadCache, ProfilePayloadSourceError, readLocalizedProfilePayload } from './profilePayloadSource'

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

describe('readLocalizedProfilePayload (URL-only)', () => {
  it('reads URL payload and uses cache on second call', async () => {
    process.env.PRIVATE_PROFILE_JSON_URL = 'https://example.blob.core.windows.net/private/profile.json'
    process.env.PROFILE_PAYLOAD_CACHE_TTL_MS = '60000'
    const fetchMock = vi.fn(async () => new Response('{"name":"url"}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const first = await readLocalizedProfilePayload('PRIVATE_PROFILE_JSON_URL', 'en')
    const second = await readLocalizedProfilePayload('PRIVATE_PROFILE_JSON_URL', 'en')

    expect(first.source).toBe('url_env')
    expect(first.fromCache).toBe(false)
    expect(second.fromCache).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('applies locale fallback exact -> base -> en for URL keys', async () => {
    process.env.PRIVATE_PROFILE_JSON_URL_DE = 'https://example.blob.core.windows.net/private/profile-de.json'
    process.env.PRIVATE_PROFILE_JSON_URL = 'https://example.blob.core.windows.net/private/profile-en.json'
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('profile-de.json')) return new Response('{"name":"de"}', { status: 200 })
      return new Response('{"name":"en"}', { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const deAt = await readLocalizedProfilePayload('PRIVATE_PROFILE_JSON_URL', 'de-at')
    const en = await readLocalizedProfilePayload('PRIVATE_PROFILE_JSON_URL', 'en')

    expect(deAt.resolvedLocale).toBe('de')
    expect(en.resolvedLocale).toBe('en')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('throws when URL key is not configured', async () => {
    delete process.env.PRIVATE_PROFILE_JSON_URL
    await expect(readLocalizedProfilePayload('PRIVATE_PROFILE_JSON_URL', 'en')).rejects.toMatchObject<
      Partial<ProfilePayloadSourceError>
    >({ reason: 'not_configured' })
  })

  it('throws for host not allowlisted', async () => {
    process.env.PRIVATE_PROFILE_JSON_URL = 'https://evil.example.com/profile.json'
    process.env.PROFILE_PAYLOAD_ALLOWED_HOSTS = 'good.example.com'

    await expect(readLocalizedProfilePayload('PRIVATE_PROFILE_JSON_URL', 'en')).rejects.toMatchObject<
      Partial<ProfilePayloadSourceError>
    >({
      reason: 'host_not_allowed',
    })
  })

  it('throws for non-2xx URL response', async () => {
    process.env.PRIVATE_PROFILE_JSON_URL = 'https://example.blob.core.windows.net/private/profile.json'
    vi.stubGlobal('fetch', vi.fn(async () => new Response('denied', { status: 403 })))

    await expect(readLocalizedProfilePayload('PRIVATE_PROFILE_JSON_URL', 'en')).rejects.toMatchObject<
      Partial<ProfilePayloadSourceError>
    >({
      reason: 'http_non_2xx',
      httpStatus: 403,
    })
  })

  it('throws fetch_timeout when fetch aborts', async () => {
    process.env.PRIVATE_PROFILE_JSON_URL = 'https://example.blob.core.windows.net/private/profile.json'
    process.env.PROFILE_PAYLOAD_FETCH_TIMEOUT_MS = '1'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const err = new Error('aborted')
        err.name = 'AbortError'
        throw err
      }),
    )

    await expect(readLocalizedProfilePayload('PRIVATE_PROFILE_JSON_URL', 'en')).rejects.toMatchObject<
      Partial<ProfilePayloadSourceError>
    >({
      reason: 'fetch_timeout',
    })
  })
})
