import { describe, expect, it } from 'vitest'
import {
  defaultSupportedLocales,
  fallbackLocale,
  getLocaleBase,
  getUiDictionary,
  normalizeLocale,
  parseSupportedLocalesCsv,
  resolveSupportedLocale,
  resolveUiLocale,
  sanitizeSupportedLocales,
  toLocaleOptions,
} from './localeRegistry'

describe('normalizeLocale', () => {
  it('returns null for empty or invalid', () => {
    expect(normalizeLocale(null)).toBeNull()
    expect(normalizeLocale('')).toBeNull()
    expect(normalizeLocale('!!!')).toBeNull()
  })

  it('normalizes case and trims', () => {
    expect(normalizeLocale('  EN  ')).toBe('en')
    expect(normalizeLocale('zh-Hans')).toBe('zh-hans')
  })
})

describe('getLocaleBase', () => {
  it('returns subtag before first hyphen', () => {
    expect(getLocaleBase('en-GB')).toBe('en')
    expect(getLocaleBase('hu')).toBe('hu')
  })
})

describe('sanitizeSupportedLocales', () => {
  it('keeps known UI locales and dedupes', () => {
    expect(sanitizeSupportedLocales(['en', 'de', 'en', 'xx-invalid'])).toEqual(['en', 'de'])
  })

  it('ensures fallback is present', () => {
    expect(sanitizeSupportedLocales(['de'])[0]).toBe(fallbackLocale)
  })
})

describe('parseSupportedLocalesCsv', () => {
  it('returns defaults when empty', () => {
    expect(parseSupportedLocalesCsv('')).toEqual([...defaultSupportedLocales])
  })

  it('parses csv', () => {
    const parsed = parseSupportedLocalesCsv('de, hu, ')
    expect(parsed).toContain('de')
    expect(parsed).toContain('hu')
    expect(parsed[0]).toBe(fallbackLocale)
  })
})

describe('resolveSupportedLocale', () => {
  const supported = ['en', 'de'] as const

  it('resolves exact and base match', () => {
    expect(resolveSupportedLocale('de', supported)).toBe('de')
    expect(resolveSupportedLocale('de-AT', supported)).toBe('de')
  })

  it('returns null when not supported', () => {
    expect(resolveSupportedLocale('fr', supported)).toBeNull()
  })
})

describe('resolveUiLocale and getUiDictionary', () => {
  it('falls back to en for unknown', () => {
    expect(resolveUiLocale('zz')).toBe(fallbackLocale)
    expect(getUiDictionary('zz').loading).toBeDefined()
  })

  it('resolves base for regional codes', () => {
    expect(resolveUiLocale('en-US')).toBe('en')
  })
})

describe('toLocaleOptions', () => {
  it('returns code, label, and optional country', () => {
    const opts = toLocaleOptions(['en', 'de'])
    expect(opts.map((o) => o.code)).toEqual(['en', 'de'])
    expect(opts.every((o) => o.label.length > 0)).toBe(true)
  })
})
