import { describe, expect, it } from 'vitest'
import {
  _buildPdfGeneratedAtFooter,
  canvasPageSliceHeightPx,
  clipVerticalToPage,
  computePdfSliceEnds,
  _mapRectsToCanvas,
  _sanitizePdfFileBaseName,
  type PdfLinkRect,
} from './downloadCvPdf'
import { PDF_CAPTURE_ROOT_WIDTH_PX } from './pdfCaptureLayout'

describe('clipVerticalToPage', () => {
  it('returns intersection when rect overlaps page band', () => {
    expect(clipVerticalToPage(10, 50, 0, 40)).toEqual({ top: 10, bottom: 40 })
    expect(clipVerticalToPage(30, 80, 40, 100)).toEqual({ top: 40, bottom: 80 })
  })

  it('returns null when no overlap', () => {
    expect(clipVerticalToPage(0, 10, 20, 30)).toBeNull()
    expect(clipVerticalToPage(100, 110, 0, 50)).toBeNull()
  })
})

describe('canvasPageSliceHeightPx', () => {
  it('matches contentH / mmPerPx with mmPerPx = contentW/canvasWidth', () => {
    const contentW = 190
    const contentH = 277
    const canvasW = PDF_CAPTURE_ROOT_WIDTH_PX
    expect(canvasPageSliceHeightPx(contentH, contentW, canvasW)).toBeCloseTo((contentH * canvasW) / contentW, 5)
  })
})

describe('computePdfSliceEnds', () => {
  it('aligns page ends to the last break that fits within max slice height', () => {
    const ends = computePdfSliceEnds(800, 300, [100, 250, 400])
    expect(ends).toEqual([250, 400, 700, 800])
  })

  it('uses hard cuts when no break falls in range', () => {
    const ends = computePdfSliceEnds(800, 300, [])
    expect(ends).toEqual([300, 600, 800])
  })
})

describe('_mapRectsToCanvas', () => {
  it('scales rects to canvas dimensions', () => {
    const rects: PdfLinkRect[] = [{ href: 'https://a', left: 10, top: 20, right: 30, bottom: 40 }]
    const out = _mapRectsToCanvas(rects, 100, 200, 200, 400)
    expect(out[0]).toMatchObject({
      href: 'https://a',
      left: 20,
      right: 60,
      top: 40,
      bottom: 80,
    })
  })
})

describe('_sanitizePdfFileBaseName', () => {
  it('preserves accented characters', () => {
    expect(_sanitizePdfFileBaseName('Horváth Ákos CV')).toBe('Horváth Ákos CV')
  })

  it('replaces forbidden filename characters', () => {
    expect(_sanitizePdfFileBaseName('cv: senior/dev*lead?')).toBe('cv_ senior_dev_lead_')
  })

  it('falls back to cv when nothing usable remains', () => {
    expect(_sanitizePdfFileBaseName('   ...   ')).toBe('cv')
  })
})

describe('_buildPdfGeneratedAtFooter', () => {
  it('formats generated-at footer with timestamp and project reference', () => {
    const date = new Date(2026, 2, 30, 14, 5, 9)
    expect(_buildPdfGeneratedAtFooter(date)).toBe(
      'Generated on 2026-03-30 14:05:09 by VaultCV (https://github.com/tibor-horvath/VaultCV)',
    )
  })
})
