import { describe, expect, it } from 'vitest'
import { A4, gutter, margin, pt } from './tokens'

describe('pt', () => {
  it('maps the 794px design width onto the A4 sheet', () => {
    // Guards against accidental drift in the px -> pt scale, which would silently
    // change every dimension in the document.
    expect(pt(794)).toBeCloseTo(A4.widthPt, 0)
  })

  it('is linear and rounds to 2dp', () => {
    expect(pt(0)).toBe(0)
    expect(pt(13)).toBe(9.75)
    expect(pt(100)).toBeCloseTo(pt(50) * 2, 1)
  })
})

describe('layout', () => {
  it('leaves a usable main column beside the gutter', () => {
    const main = A4.widthPt - margin.side * 2 - gutter.width - gutter.gap
    expect(main).toBeGreaterThan(pt(480))
  })
})
