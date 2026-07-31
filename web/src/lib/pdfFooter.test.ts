import { describe, expect, it } from 'vitest'
import { getBrand } from './brand'
import { buildPdfGeneratedAtFooter, buildPdfGeneratedAtFooterParts } from './pdfFooter'

describe('buildPdfGeneratedAtFooter', () => {
  it('formats generated-at footer with timestamp and versioned project reference', () => {
    const date = new Date(2026, 2, 30, 14, 5, 9)
    const brand = getBrand()
    expect(buildPdfGeneratedAtFooter(date)).toBe(
      `Generated on 2026-03-30 14:05:09 by ${brand.displayName} (${brand.repoUrl})`,
    )
  })
})

describe('buildPdfGeneratedAtFooterParts', () => {
  it('splits into prefix, url and suffix that recompose to the full footer', () => {
    const date = new Date(2026, 2, 30, 14, 5, 9)
    const parts = buildPdfGeneratedAtFooterParts(date)
    expect(parts.url).toBe(getBrand().repoUrl)
    expect(`${parts.prefix}${parts.url}${parts.suffix}`).toBe(buildPdfGeneratedAtFooter(date))
  })
})
