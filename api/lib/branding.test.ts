import { describe, expect, it } from 'vitest'
import { MAX_BRANDMARK_HTML_CHARS, MAX_FAVICON_BYTES, parseBranding } from './branding'

const PNG = `data:image/png;base64,${Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString('base64')}`
const SVG = `data:image/svg+xml;base64,${Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>').toString('base64')}`
const ICO = `data:image/x-icon;base64,${Buffer.from([0, 0, 1, 0, 1, 0]).toString('base64')}`

describe('parseBranding', () => {
  it('accepts an empty document', () => {
    expect(parseBranding({})).toEqual({ ok: true, value: {} })
  })

  it('rejects non-objects', () => {
    expect(parseBranding(null).ok).toBe(false)
    expect(parseBranding([]).ok).toBe(false)
    expect(parseBranding('x').ok).toBe(false)
  })

  it('accepts png, svg and ico favicons', () => {
    for (const favicon of [PNG, SVG, ICO]) {
      expect(parseBranding({ favicon })).toEqual({ ok: true, value: { favicon } })
    }
  })

  it('treats an empty favicon as none', () => {
    expect(parseBranding({ favicon: '' })).toEqual({ ok: true, value: {} })
  })

  it('rejects a favicon whose bytes do not match its declared type', () => {
    const fake = `data:image/png;base64,${Buffer.from('<svg></svg>').toString('base64')}`
    expect(parseBranding({ favicon: fake })).toMatchObject({ ok: false, error: expect.stringContaining('does not match') })
  })

  it('rejects unsupported favicon types and non-data URLs', () => {
    expect(parseBranding({ favicon: 'data:image/gif;base64,R0lGOD==' }).ok).toBe(false)
    expect(parseBranding({ favicon: 'https://example.com/favicon.png' }).ok).toBe(false)
  })

  it('rejects an oversized favicon', () => {
    const big = Buffer.alloc(MAX_FAVICON_BYTES + 1)
    big.set([0x89, 0x50, 0x4e, 0x47])
    expect(parseBranding({ favicon: `data:image/png;base64,${big.toString('base64')}` })).toMatchObject({
      ok: false,
      error: expect.stringContaining('maximum size'),
    })
  })

  it('normalizes an image brandmark and drops empty optional fields', () => {
    const result = parseBranding({
      brandmark: { type: 'image', src: SVG, srcDark: '', alt: '  Built by me ', href: 'https://example.com' },
    })
    expect(result).toEqual({
      ok: true,
      value: { brandmark: { type: 'image', src: SVG, alt: 'Built by me', href: 'https://example.com/' } },
    })
  })

  it('rejects non-http brandmark links', () => {
    expect(parseBranding({ brandmark: { type: 'image', src: PNG, href: 'javascript:alert(1)' } }).ok).toBe(false)
    expect(parseBranding({ brandmark: { type: 'image', src: PNG, href: 'not a url' } }).ok).toBe(false)
  })

  it('requires an image for an image brandmark', () => {
    expect(parseBranding({ brandmark: { type: 'image' } }).ok).toBe(false)
  })

  it('accepts an html brandmark with an optional dark variant', () => {
    expect(parseBranding({ brandmark: { type: 'html', html: ' <b>hi</b> ', htmlDark: '' } })).toEqual({
      ok: true,
      value: { brandmark: { type: 'html', html: '<b>hi</b>' } },
    })
    expect(parseBranding({ brandmark: { type: 'html', html: 'a', htmlDark: 'b' } })).toEqual({
      ok: true,
      value: { brandmark: { type: 'html', html: 'a', htmlDark: 'b' } },
    })
  })

  it('rejects empty or oversized html', () => {
    expect(parseBranding({ brandmark: { type: 'html', html: '   ' } }).ok).toBe(false)
    expect(parseBranding({ brandmark: { type: 'html', html: 'x'.repeat(MAX_BRANDMARK_HTML_CHARS + 1) } }).ok).toBe(false)
  })

  it('rejects unknown brandmark types', () => {
    expect(parseBranding({ brandmark: { type: 'video' } }).ok).toBe(false)
  })
})
