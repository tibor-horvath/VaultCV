import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./profileBlobStore', () => {
  return {
    readSettingsJson: vi.fn(async () => ''),
  }
})

import { readSettingsJson } from './profileBlobStore'
import {
  defaultSupportedLocales,
  fallbackLocale,
  invalidateLocalesCache,
  localeEnvCandidates,
  normalizeLocale,
  readLocalizedEnvJson,
  readSupportedLocalesCached,
  readSupportedLocalesFromBlob,
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

describe('readSupportedLocalesFromBlob', () => {
  it('returns null when settings blob is missing or empty', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('')
    await expect(readSupportedLocalesFromBlob('john-doe')).resolves.toBeNull()
  })

  it('parses supportedLocales and ensures fallback locale is included', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('{"supportedLocales":["de","hu","de"]}')
    await expect(readSupportedLocalesFromBlob('john-doe')).resolves.toEqual(['en', 'de', 'hu'])
  })

  it('returns null on malformed payload', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('{"supportedLocales":"de"}')
    await expect(readSupportedLocalesFromBlob('john-doe')).resolves.toBeNull()
  })
})

describe('readSupportedLocalesCached', () => {
  it('falls back to default locales when blob value is missing', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('')
    await expect(readSupportedLocalesCached('john-doe')).resolves.toEqual(defaultSupportedLocales)
  })

  it('returns cached value without re-reading blob until invalidated', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('{"supportedLocales":["de"]}')
    const first = await readSupportedLocalesCached('john-doe')
    const second = await readSupportedLocalesCached('john-doe')

    expect(first).toEqual(['en', 'de'])
    expect(second).toEqual(['en', 'de'])
    expect(readSettingsJson).toHaveBeenCalledTimes(1)

    invalidateLocalesCache()
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('{"supportedLocales":["hu"]}')
    const third = await readSupportedLocalesCached('john-doe')
    expect(third).toEqual(['en', 'hu'])
    expect(readSettingsJson).toHaveBeenCalledTimes(2)
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

describe('readLocalizedEnvJson', () => {
  const originalPublic = process.env.PUBLIC_PROFILE_JSON_EN

  afterEach(() => {
    if (originalPublic === undefined) delete process.env.PUBLIC_PROFILE_JSON_EN
    else process.env.PUBLIC_PROFILE_JSON_EN = originalPublic
    delete process.env.PUBLIC_PROFILE_JSON
  })

  it('returns first matching env key', () => {
    process.env.PUBLIC_PROFILE_JSON_EN = '{"x":1}'
    const result = readLocalizedEnvJson('PUBLIC_PROFILE_JSON', 'en')
    expect(result.raw).toBe('{"x":1}')
    expect(result.resolvedLocale).toBe('en')
  })

  it('falls back to generic key', () => {
    delete process.env.PUBLIC_PROFILE_JSON_EN
    process.env.PUBLIC_PROFILE_JSON = '{}'
    const result = readLocalizedEnvJson('PUBLIC_PROFILE_JSON', 'en')
    expect(result.raw).toBe('{}')
    expect(result.resolvedLocale).toBe(fallbackLocale)
  })
})
