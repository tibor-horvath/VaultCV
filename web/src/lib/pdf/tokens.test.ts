import { describe, expect, it } from 'vitest'
import { A4, pt } from './tokens'

describe('pt', () => {
  it('maps the authored 794px layout width onto A4 content width', () => {
    // Guards against accidental drift in the px -> pt scale, which would silently
    // change every dimension in the document.
    expect(pt(794)).toBeCloseTo(A4.contentWidthPt, 1)
  })

  it('is linear and rounds to 2dp', () => {
    expect(pt(0)).toBe(0)
    expect(pt(13)).toBeCloseTo(8.82, 2)
    expect(pt(100)).toBeCloseTo(pt(50) * 2, 1)
  })
})
