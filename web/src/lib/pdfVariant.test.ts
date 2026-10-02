import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PDF_VARIANT, readPdfVariantPreference, writePdfVariantPreference } from './pdfVariant'

describe('pdf variant preference', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('defaults to the modern layout', () => {
    expect(DEFAULT_PDF_VARIANT).toBe('modern')
    expect(readPdfVariantPreference()).toBe('modern')
  })

  it('remembers the last downloaded format', () => {
    writePdfVariantPreference('print')
    expect(readPdfVariantPreference()).toBe('print')
  })

  it('ignores unknown stored values', () => {
    localStorage.setItem('cv_pdf_variant', 'fancy')
    expect(readPdfVariantPreference()).toBe('modern')
  })

  it('survives storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => writePdfVariantPreference('print')).not.toThrow()
    expect(readPdfVariantPreference()).toBe('modern')
  })
})
