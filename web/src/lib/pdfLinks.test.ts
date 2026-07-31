import { describe, expect, it } from 'vitest'
import { hasPdfUrl, normalizePdfAnchorHref, pdfLinkDisplayText } from './pdfLinks'

describe('normalizePdfAnchorHref', () => {
  it('adds https to bare www hosts so they do not resolve as same-site paths', () => {
    expect(normalizePdfAnchorHref('www.example.com')).toBe('https://www.example.com')
  })

  it('leaves already-schemed URLs untouched', () => {
    expect(normalizePdfAnchorHref('https://github.com/x')).toBe('https://github.com/x')
    expect(normalizePdfAnchorHref('mailto:a@b.com')).toBe('mailto:a@b.com')
    expect(normalizePdfAnchorHref('tel:+3612345678')).toBe('tel:+3612345678')
  })

  it('leaves protocol-relative URLs untouched', () => {
    expect(normalizePdfAnchorHref('//cdn.example/x')).toBe('//cdn.example/x')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizePdfAnchorHref('  https://x.dev  ')).toBe('https://x.dev')
  })

  it('returns empty for blank input', () => {
    expect(normalizePdfAnchorHref('   ')).toBe('')
  })
})

describe('pdfLinkDisplayText', () => {
  it('strips mailto and tel schemes, which are noise to a reader', () => {
    expect(pdfLinkDisplayText('mailto:a@b.com')).toBe('a@b.com')
    expect(pdfLinkDisplayText('tel:+3612345678')).toBe('+3612345678')
  })

  it('keeps http(s) URLs verbatim', () => {
    expect(pdfLinkDisplayText('https://github.com/x')).toBe('https://github.com/x')
  })
})

describe('hasPdfUrl', () => {
  it('is false for nullish and blank', () => {
    expect(hasPdfUrl(undefined)).toBe(false)
    expect(hasPdfUrl(null)).toBe(false)
    expect(hasPdfUrl('   ')).toBe(false)
  })

  it('is true for a non-blank string', () => {
    expect(hasPdfUrl('https://x')).toBe(true)
  })
})
