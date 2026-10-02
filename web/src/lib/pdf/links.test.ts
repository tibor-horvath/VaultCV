import { describe, expect, it } from 'vitest'
import { displayUrl, pdfMailHref, pdfTelHref, pdfWebHref } from './links'

describe('pdfWebHref', () => {
  it('keeps http(s) URLs', () => {
    expect(pdfWebHref(' https://example.com/a ')).toBe('https://example.com/a')
    expect(pdfWebHref('http://example.com')).toBe('http://example.com/')
  })

  it('drops other schemes and junk', () => {
    expect(pdfWebHref('javascript:alert(1)')).toBeUndefined()
    expect(pdfWebHref('file:///etc/passwd')).toBeUndefined()
    expect(pdfWebHref('example.com')).toBeUndefined()
    expect(pdfWebHref('')).toBeUndefined()
    expect(pdfWebHref(undefined)).toBeUndefined()
  })
})

describe('pdfMailHref', () => {
  it('builds mailto links for plain addresses only', () => {
    expect(pdfMailHref(' john@example.com ')).toBe('mailto:john@example.com')
    expect(pdfMailHref('john@example.com?subject=x')).toBeUndefined()
    expect(pdfMailHref('not an email')).toBeUndefined()
  })
})

describe('pdfTelHref', () => {
  it('strips formatting', () => {
    expect(pdfTelHref('+49 1512 3456789')).toBe('tel:+4915123456789')
    expect(pdfTelHref('(030) 123-45')).toBe('tel:03012345')
  })

  it('rejects values without a number', () => {
    expect(pdfTelHref('ask me')).toBeUndefined()
  })
})

describe('displayUrl', () => {
  it('shortens a URL to what a reader recognises', () => {
    expect(displayUrl('https://www.linkedin.com/in/your-handle/')).toBe('linkedin.com/in/your-handle')
    expect(displayUrl('https://github.com/your-handle')).toBe('github.com/your-handle')
  })
})
