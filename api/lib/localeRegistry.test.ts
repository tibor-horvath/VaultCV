import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./profileBlobStore', () => {
  return {
    readProfileJsonV2: vi.fn(async () => ''),
    readSettingsJson: vi.fn(async () => ''),
  }
})

import { readProfileJsonV2, readSettingsJson } from './profileBlobStore'
import {
  defaultSupportedLocales,
  fallbackLocale,
  invalidateLocalesCache,
  localeEnvCandidates,
  normalizeLocale,
  readSupportedLocalesFromBlob,
  readSupportedLocalesForProfileCached,
  readSupportedLocalesCached,
} from './localeRegistry'

afterEach(() => {
  vi.clearAllMocks()
  invalidateLocalesCache()
})

describe('normalizeLocale', () => {
  it('returns fallback for empty or invalid', () => {
    expect(normalizeLocale(undefined)).toBe(fallbackLocale)
    expect(normalizeLocale('@@@')).toBe(fallbackLocale)
  })

  it('normalizes valid tags', () => {
    expect(normalizeLocale('  EN-gb  ')).toBe('en-gb')
  })
})

describe('readSupportedLocalesCached', () => {
  it('returns app-level default supported locales', async () => {
    await expect(readSupportedLocalesCached('john-doe')).resolves.toEqual(defaultSupportedLocales)
  })

  it('prefers persisted supported locales from settings blob', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      JSON.stringify({ supportedLocales: ['hu', 'de'] }),
    )

    await expect(readSupportedLocalesCached('john-doe')).resolves.toEqual(['en', 'hu', 'de'])
  })

  it('returns cached value and remains stable after invalidation', async () => {
    const first = await readSupportedLocalesCached('john-doe')
    const second = await readSupportedLocalesCached('john-doe')

    expect(first).toEqual(defaultSupportedLocales)
    expect(second).toEqual(defaultSupportedLocales)

    invalidateLocalesCache('john-doe')
    const third = await readSupportedLocalesCached('john-doe')
    expect(third).toEqual(defaultSupportedLocales)
  })

  it('caches independently per slug', async () => {
    const forJohn = await readSupportedLocalesCached('john-doe')
    const forJane = await readSupportedLocalesCached('jane-doe')

    expect(forJohn).toEqual(defaultSupportedLocales)
    expect(forJane).toEqual(defaultSupportedLocales)
  })
})

describe('readSupportedLocalesForProfileCached', () => {
  it('returns only locales that have an existing profile blob for the requested kind', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      JSON.stringify({ supportedLocales: ['en', 'hu', 'de'] }),
    )

    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce('{"locale":"en"}')
      .mockResolvedValueOnce('{"locale":"hu"}')
      .mockResolvedValueOnce('')

    await expect(readSupportedLocalesForProfileCached('john-doe', 'public')).resolves.toEqual(['en', 'hu'])
  })
})

describe('readSupportedLocalesFromBlob', () => {
  it('normalizes, deduplicates, and injects fallback locale', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      JSON.stringify({ supportedLocales: ['HU', 'hu', '@@@', 'de'] }),
    )

    await expect(readSupportedLocalesFromBlob('john-doe')).resolves.toEqual(['en', 'hu', 'de'])
  })

  it('returns null for invalid settings payloads', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('{bad json')
    await expect(readSupportedLocalesFromBlob('john-doe')).resolves.toBeNull()
  })
})

describe('localeEnvCandidates', () => {
  it('returns exact and fallback when base equals locale', () => {
    expect(localeEnvCandidates('PUBLIC_PROFILE_JSON', 'en')).toEqual([
      { key: 'PUBLIC_PROFILE_JSON_EN', resolvedLocale: 'en' },
      { key: 'PUBLIC_PROFILE_JSON', resolvedLocale: fallbackLocale },
    ])
  })

  it('returns exact, base, and generic for regional tag', () => {
    expect(localeEnvCandidates('PUBLIC_PROFILE_JSON', 'pt-br')).toEqual([
      { key: 'PUBLIC_PROFILE_JSON_PT_BR', resolvedLocale: 'pt-br' },
      { key: 'PUBLIC_PROFILE_JSON_PT', resolvedLocale: 'pt' },
      { key: 'PUBLIC_PROFILE_JSON', resolvedLocale: fallbackLocale },
    ])
  })
})


