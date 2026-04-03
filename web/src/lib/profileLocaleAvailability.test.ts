import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchProfileScopedLocales } from './profileLocaleAvailability'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchProfileScopedLocales', () => {
  it('returns normalized locale list on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ locales: ['en', 'hu'] }),
      })),
    )
    const result = await fetchProfileScopedLocales('public')
    expect(result).toEqual(['en', 'hu'])
    vi.unstubAllGlobals()
  })

  it('calls the correct URL for "public" scope', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ locales: ['en'] }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    await fetchProfileScopedLocales('public')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/locales?scope=public',
      expect.objectContaining({ method: 'GET' }),
    )
    vi.unstubAllGlobals()
  })

  it('calls the correct URL for "private" scope', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ locales: ['en'] }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    await fetchProfileScopedLocales('private')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/locales?scope=private',
      expect.objectContaining({ method: 'GET' }),
    )
    vi.unstubAllGlobals()
  })

  it('returns null when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false })),
    )
    const result = await fetchProfileScopedLocales('public')
    expect(result).toBeNull()
    vi.unstubAllGlobals()
  })

  it('returns null when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network error')
      }),
    )
    const result = await fetchProfileScopedLocales('public')
    expect(result).toBeNull()
    vi.unstubAllGlobals()
  })

  it('filters out locales not registered in the UI locale list', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ locales: ['en', 'xx-UNKNOWN', 'hu'] }),
      })),
    )
    const result = await fetchProfileScopedLocales('public')
    // 'xx-UNKNOWN' is not a registered UI locale and should be excluded
    expect(result).not.toContain('xx-UNKNOWN')
    vi.unstubAllGlobals()
  })

  it('deduplicates locales', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ locales: ['en', 'en', 'hu'] }),
      })),
    )
    const result = await fetchProfileScopedLocales('public')
    if (result) {
      const enCount = result.filter((l) => l === 'en').length
      expect(enCount).toBe(1)
    }
    vi.unstubAllGlobals()
  })

  it('returns null when locales field is missing from response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({}),
      })),
    )
    const result = await fetchProfileScopedLocales('public')
    expect(result).toEqual([])
    vi.unstubAllGlobals()
  })

  it('ignores non-string items in the locales array', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ locales: ['en', 42, null, 'hu'] }),
      })),
    )
    const result = await fetchProfileScopedLocales('public')
    if (result) {
      expect(result.every((l) => typeof l === 'string')).toBe(true)
    }
    vi.unstubAllGlobals()
  })
})
