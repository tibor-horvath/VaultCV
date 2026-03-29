import { afterEach, describe, expect, it } from 'vitest'
import { fallbackLocale, localeEnvCandidates, normalizeLocale, readLocalizedEnvJson, readSupportedLocales } from './localeRegistry'

const originalSupported = process.env.SUPPORTED_LOCALES

afterEach(() => {
  if (originalSupported === undefined) delete process.env.SUPPORTED_LOCALES
  else process.env.SUPPORTED_LOCALES = originalSupported
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

describe('readSupportedLocales', () => {
  it('defaults to en when unset', () => {
    delete process.env.SUPPORTED_LOCALES
    expect(readSupportedLocales()).toEqual([fallbackLocale])
  })

  it('parses csv and ensures fallback', () => {
    process.env.SUPPORTED_LOCALES = 'de, hu, de'
    const locales = readSupportedLocales()
    expect(locales).toContain('de')
    expect(locales).toContain('hu')
    expect(locales[0]).toBe(fallbackLocale)
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
