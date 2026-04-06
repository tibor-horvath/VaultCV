import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  _buildPdfGeneratedAtFooter,
  canvasPageSliceHeightPx,
  clipVerticalToPage,
  computePdfSliceEnds,
  _mapRectsToCanvas,
  _sanitizePdfFileBaseName,
  downloadCvPdf,
  type PdfLinkRect,
} from './downloadCvPdf'
import { getBrand } from './brand'
import { PDF_CAPTURE_ROOT_WIDTH_PX } from './pdfCaptureLayout'

vi.mock('html2canvas', () => ({ default: vi.fn() }))
vi.mock('jspdf', () => ({ jsPDF: vi.fn() }))

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

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
  it('formats generated-at footer with timestamp and versioned project reference', () => {
    const date = new Date(2026, 2, 30, 14, 5, 9)
    const brand = getBrand()
    expect(_buildPdfGeneratedAtFooter(date)).toBe(
      `Generated on 2026-03-30 14:05:09 by ${brand.displayName} (${brand.repoUrl})`,
    )
  })
})

describe('downloadCvPdf', () => {
  let pdfSaveSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    pdfSaveSpy = vi.fn()
    const save = pdfSaveSpy
    ;(jsPDF as unknown as { mockImplementation: (c: unknown) => void }).mockImplementation(
      class MockPDF {
        addPage = vi.fn()
        addImage = vi.fn()
        link = vi.fn()
        setPage = vi.fn()
        getNumberOfPages = vi.fn(() => 1)
        setFontSize = vi.fn()
        setTextColor = vi.fn()
        text = vi.fn()
        getTextWidth = vi.fn(() => 5)
        getFontSize = vi.fn(() => 8)
        save = save
        internal = { scaleFactor: 1 }
      },
    )
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 0
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('calls pdf.save with the sanitized filename on success', async () => {
    ;(html2canvas as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ width: 100, height: 100 })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,')

    const root = document.createElement('div')
    await downloadCvPdf({ root, fileBaseName: 'John-Doe' })

    expect(pdfSaveSpy).toHaveBeenCalledWith('John-Doe.pdf')
    expect(html2canvas).toHaveBeenCalled()
  })

  it('propagates the error when html2canvas rejects', async () => {
    ;(html2canvas as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('canvas capture failed'))

    const root = document.createElement('div')
    await expect(downloadCvPdf({ root })).rejects.toThrow('canvas capture failed')
  })

  it('throws when the 2d context is unavailable on a slice canvas', async () => {
    ;(html2canvas as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ width: 100, height: 100 })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    const root = document.createElement('div')
    await expect(downloadCvPdf({ root })).rejects.toThrow('2d context unavailable')
  })

  it('calls onProgress at preparing, rendering, and building stages', async () => {
    ;(html2canvas as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ width: 100, height: 100 })
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,')

    const onProgress = vi.fn()
    const root = document.createElement('div')
    await downloadCvPdf({ root, onProgress })

    expect(onProgress).toHaveBeenCalledWith('preparing')
    expect(onProgress).toHaveBeenCalledWith('rendering')
    expect(onProgress).toHaveBeenCalledWith('building')
    expect(onProgress).toHaveBeenCalledTimes(3)
  })
})
