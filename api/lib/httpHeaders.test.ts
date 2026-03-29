import { describe, expect, it } from 'vitest'
import { firstLanguageTagFromAcceptLanguage, getHeaderInsensitive } from './httpHeaders'

describe('getHeaderInsensitive', () => {
  it('returns undefined for missing headers', () => {
    expect(getHeaderInsensitive(undefined, 'a')).toBeUndefined()
  })

  it('matches case-insensitively', () => {
    expect(getHeaderInsensitive({ Authorization: 'Bearer x' }, 'authorization')).toBe('Bearer x')
    expect(getHeaderInsensitive({ 'X-Custom': 'v' }, 'x-custom')).toBe('v')
  })

  it('ignores non-string values', () => {
    expect(getHeaderInsensitive({ a: undefined } as Record<string, string | undefined>, 'a')).toBeUndefined()
  })
})

describe('firstLanguageTagFromAcceptLanguage', () => {
  it('returns undefined for empty', () => {
    expect(firstLanguageTagFromAcceptLanguage(undefined)).toBeUndefined()
    expect(firstLanguageTagFromAcceptLanguage('')).toBeUndefined()
  })

  it('parses first tag before weight', () => {
    expect(firstLanguageTagFromAcceptLanguage('en-US,en;q=0.9')).toBe('en-US')
    expect(firstLanguageTagFromAcceptLanguage('hu')).toBe('hu')
  })
})
