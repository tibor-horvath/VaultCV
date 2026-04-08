import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('./profileBlobStore', () => {
  return {
    readProfileJsonV2: vi.fn(async () => ''),
    readSettingsJson: vi.fn(async () => ''),
    writeSettingsJson: vi.fn(async () => undefined),
  }
})

import { readProfileJsonV2, readSettingsJson, writeSettingsJson } from './profileBlobStore'
import {
  defaultSupportedLocales,
  fallbackLocale,
  invalidateLocalesCache,
  localeEnvCandidates,
  normalizeLocale,
  readDisabledLocalesFromBlob,
  readSupportedLocalesFromBlob,
  readSupportedLocalesForProfileCached,
  readSupportedLocalesCached,
  setLocaleDisabled,
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

  it('excludes disabled locales from private scope results', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      JSON.stringify({ supportedLocales: ['en', 'hu', 'de'], disabledLocales: ['hu'] }),
    )

    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce('{"locale":"en"}')
      .mockResolvedValueOnce('{"locale":"hu"}')
      .mockResolvedValueOnce('{"locale":"de"}')

    await expect(readSupportedLocalesForProfileCached('john-doe', 'private')).resolves.toEqual(['en', 'de'])
  })

  it('does not filter disabled locales from public scope results', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      JSON.stringify({ supportedLocales: ['en', 'hu'], disabledLocales: ['hu'] }),
    )

    ;(readProfileJsonV2 as unknown as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce('{"locale":"en"}')
      .mockResolvedValueOnce('{"locale":"hu"}')

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

describe('readDisabledLocalesFromBlob', () => {
  it('returns empty array when settings blob is empty', async () => {
    await expect(readDisabledLocalesFromBlob('john-doe')).resolves.toEqual([])
  })

  it('returns empty array when disabledLocales field is missing', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      JSON.stringify({ supportedLocales: ['en', 'hu'] }),
    )
    await expect(readDisabledLocalesFromBlob('john-doe')).resolves.toEqual([])
  })

  it('returns normalized and deduplicated disabled locales', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      JSON.stringify({ disabledLocales: ['HU', 'hu', 'de'] }),
    )
    await expect(readDisabledLocalesFromBlob('john-doe')).resolves.toEqual(['hu', 'de'])
  })

  it('returns empty array for invalid JSON', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce('{bad json')
    await expect(readDisabledLocalesFromBlob('john-doe')).resolves.toEqual([])
  })
})

describe('setLocaleDisabled', () => {
  it('adds locale to disabledLocales when disabling', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      JSON.stringify({ supportedLocales: ['en', 'hu'] }),
    )
    await setLocaleDisabled('john-doe', 'hu', true)
    expect(writeSettingsJson).toHaveBeenCalledWith(
      expect.objectContaining({
        jsonText: expect.stringContaining('"hu"'),
      }),
    )
    const written = JSON.parse((writeSettingsJson as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].jsonText)
    expect(written.disabledLocales).toContain('hu')
  })

  it('removes locale from disabledLocales when enabling', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      JSON.stringify({ supportedLocales: ['en', 'hu'], disabledLocales: ['hu'] }),
    )
    await setLocaleDisabled('john-doe', 'hu', false)
    const written = JSON.parse((writeSettingsJson as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0].jsonText)
    expect(written.disabledLocales).not.toContain('hu')
  })

  it('does not write settings when state is already correct', async () => {
    ;(readSettingsJson as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      JSON.stringify({ disabledLocales: ['hu'] }),
    )
    await setLocaleDisabled('john-doe', 'hu', true)
    expect(writeSettingsJson).not.toHaveBeenCalled()
  })
})
