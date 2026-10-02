import { describe, expect, it } from 'vitest'
import { dataUrlByteLength, dataUrlMimeType, parseSiteBranding, sanitizeBrandmarkHtml } from './siteBranding'

const PNG = 'data:image/png;base64,iVBORw0KGgo='

describe('sanitizeBrandmarkHtml', () => {
  it('keeps a linked inline SVG badge and forces it into a new tab', () => {
    const out = sanitizeBrandmarkHtml(
      '<a href="https://example.com" target="_self" aria-label="Built by me"><svg viewBox="0 0 10 10"><rect width="10" height="10" fill="#000"/></svg></a>',
    )
    const doc = new DOMParser().parseFromString(out, 'text/html')
    const link = doc.querySelector('a')!
    expect(link.getAttribute('href')).toBe('https://example.com')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link.getAttribute('aria-label')).toBe('Built by me')
    expect(doc.querySelector('svg rect')).not.toBeNull()
  })

  it('keeps SMIL animation and its timing attributes', () => {
    const out = sanitizeBrandmarkHtml(
      '<svg><rect><animate attributeName="width" from="0" to="10" dur="1s" calcMode="spline" keySplines="0 0 1 1" fill="freeze"/></rect></svg>',
    )
    for (const attr of ['attributeName="width"', 'from="0"', 'to="10"', 'calcMode="spline"', 'keySplines="0 0 1 1"']) {
      expect(out).toContain(attr)
    }
  })

  it('drops animations that target links or event handlers', () => {
    const out = sanitizeBrandmarkHtml(
      '<svg><a href="#"><set attributeName="href" to="javascript:alert(1)"/><animate attributeName="xlink:href" values="javascript:alert(1)"/><animate attributeName="onclick" to="x"/><text>x</text></a></svg>',
    )
    expect(out).not.toContain('javascript:')
    expect(out).not.toMatch(/<set|<animate/)
  })

  it('removes scripts, handlers, styles, forms and frames', () => {
    const out = sanitizeBrandmarkHtml(
      '<script>alert(1)</script><img src="x" onerror="alert(1)"><style>body{display:none}</style><form><input></form><iframe src="https://example.com"></iframe><b style="position:fixed" class="fixed inset-0">ok</b>',
    )
    expect(out).not.toMatch(/script|onerror|<style|<form|<input|<iframe|position:fixed|inset-0/)
    expect(out).toContain('<b>ok</b>')
  })

  it('strips javascript: links', () => {
    const out = sanitizeBrandmarkHtml('<a href="javascript:alert(1)">x</a>')
    expect(out).not.toContain('javascript:')
  })
})

describe('parseSiteBranding', () => {
  it('keeps valid fields', () => {
    expect(
      parseSiteBranding({ favicon: PNG, brandmark: { type: 'image', src: PNG, alt: 'Me', href: 'https://example.com' } }),
    ).toEqual({ favicon: PNG, brandmark: { type: 'image', src: PNG, alt: 'Me', href: 'https://example.com' } })
  })

  it('drops anything malformed instead of throwing', () => {
    expect(parseSiteBranding(null)).toEqual({})
    expect(parseSiteBranding({ favicon: 'https://example.com/x.png' })).toEqual({})
    expect(parseSiteBranding({ brandmark: { type: 'image', src: 'nope' } })).toEqual({})
    expect(parseSiteBranding({ brandmark: { type: 'html', html: '  ' } })).toEqual({})
  })
})

describe('data URL helpers', () => {
  it('reads the MIME type and decoded size', () => {
    expect(dataUrlMimeType('data:image/svg+xml;base64,AAAA')).toBe('image/svg+xml')
    expect(dataUrlByteLength('data:image/png;base64,AAAA')).toBe(3)
    expect(dataUrlByteLength('data:image/png;base64,AAA=')).toBe(2)
    expect(dataUrlByteLength('data:image/png;base64,AA==')).toBe(1)
  })
})
