// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { renderToBuffer } from '@react-pdf/renderer'
import { getMockCv } from '../src/lib/mockCv'
import { getBrand } from '../src/lib/brand'
import { enMessages } from '../src/i18n/messages'
import type { MessageKey } from '../src/i18n/messages'
import { huMessages } from '../src/i18n/messages/hu'
import { CvPdfDocument } from '../src/components/cv/pdf/document/CvPdfDocument'
import {
  A4_HEIGHT_PT,
  A4_WIDTH_PT,
  extractableCodepoints,
  inflateAllStreams,
  linkAnnotations,
  pageTexts,
  registerTestFonts,
} from './pdfTestUtils'

registerTestFonts()

/**
 * Pinned so credential expiry is deterministic: on this date the mock CV's "Certification
 * transcript" (2026-03) and AWS (2026-06) credentials have expired, the rest are current.
 */
const GENERATED_AT = new Date(2026, 9, 2, 12, 0, 0)

function render(locale: 'en' | 'hu') {
  const messages = locale === 'hu' ? huMessages : enMessages
  const t = (key: MessageKey) => messages[key] ?? enMessages[key]
  return renderToBuffer(
    <CvPdfDocument
      cv={getMockCv(locale)}
      t={t}
      locale={locale}
      photo={{ kind: 'fallback' }}
      generatedAt={GENERATED_AT}
    />,
  )
}

describe('CvPdfDocument', () => {
  it('produces a valid PDF', async () => {
    const pdf = await render('en')
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(pdf.byteLength).toBeGreaterThan(5000)
  })

  it('embeds fonts rather than rasterizing the page', async () => {
    const latin = (await render('en')).toString('latin1')
    // FontFile2 = embedded TrueType. No image XObjects at all: the old pipeline emitted one per page.
    expect(latin).toContain('/FontFile2')
    expect(latin).toContain('/ToUnicode')
    expect(latin).not.toMatch(/\/Subtype\s*\/Image/)
  })

  it('prints no CV links: the only link is the generated-by footer', async () => {
    const pdf = await render('en')
    const uris = [...pdf.toString('latin1').matchAll(/\/URI\s*\(([^)]*)\)/g)].map((m) => m[1])
    expect(uris).toEqual([getBrand().repoUrl])

    const text = pageTexts(pdf).join('\n')
    for (const url of ['github.com/your-handle', 'linkedin.com', 'learn.microsoft.com', 'example.edu']) {
      expect(text).not.toContain(url)
    }
  })

  it('prints contact details as plain text', async () => {
    const text = pageTexts(await render('en')).join('\n')
    expect(text).toContain('john.doe@example.com')
    expect(text).toContain('+49 1512 3456789')
    expect(text).toContain('City, Country')
  })

  it('hides expired credentials and keeps current ones', async () => {
    const text = pageTexts(await render('en')).join('\n')
    expect(text).toContain('Microsoft Learn profile')
    expect(text).toContain('Cambridge English C1 Advanced')
    expect(text).not.toContain('Certification transcript')
    expect(text).not.toContain('AWS Certified Developer')
  })

  // Content streams are not emitted in page order, so pages are identified by their page number.
  function pageNumbered(pages: string[], n: number): string | undefined {
    return pages.find((p) => p.includes(`${n} / ${pages.length}`))
  }

  it('puts experience on page 1, ahead of credentials, when the profile has no section order', async () => {
    const first = pageNumbered(pageTexts(await render('en')), 1)
    expect(first).toContain('EXPERIENCE')
    const credentials = first!.indexOf('CREDENTIALS')
    if (credentials >= 0) expect(first!.indexOf('EXPERIENCE')).toBeLessThan(credentials)
  })

  it('numbers every page and repeats the name on continuation pages', async () => {
    const pages = pageTexts(await render('en'))
    for (let n = 1; n <= pages.length; n++) expect(pageNumbered(pages, n), `page ${n}`).toBeDefined()
    for (let n = 2; n <= pages.length; n++) expect(pageNumbered(pages, n)).toContain('Full‑stack Developer · john.doe@example.com')
  })

  it('makes the Hungarian CV text extractable, not just visible', async () => {
    const decoded = inflateAllStreams(await render('hu'))
    const cps = extractableCodepoints(decoded)
    expect(cps.size).toBeGreaterThan(0)

    // Only characters the mock CV actually contains; a CMap maps used glyphs only.
    for (const ch of ['ő', 'é', 'á', 'ö', 'ü', 'í', 'ó']) {
      expect(cps.has(ch.codePointAt(0)!), `${ch} must be extractable`).toBe(true)
    }
  })

  it('round-trips the double-acute characters WinAnsi cannot encode', async () => {
    // `ő`/`ű` are exactly what react-pdf's built-in Helvetica corrupts *without erroring*, so
    // they get an explicit case with data that is guaranteed to contain them.
    const cv = {
      basics: { name: 'Bíró Győző', headline: 'Űrhajós · Tűzszerész', summary: 'Őrült űrhajós, tűzoltó.' },
    } as Parameters<typeof CvPdfDocument>[0]['cv']

    const pdf = await renderToBuffer(
      <CvPdfDocument cv={cv} t={(k) => enMessages[k]} locale="hu" photo={{ kind: 'fallback' }} />,
    )
    const cps = extractableCodepoints(inflateAllStreams(pdf))

    for (const ch of ['ő', 'ű', 'Ő', 'Ű', 'í', 'ó']) {
      expect(cps.has(ch.codePointAt(0)!), `${ch} must be extractable`).toBe(true)
    }
  })
})

describe('generated-at footer', () => {
  it('prints on exactly one page', async () => {
    const pages = pageTexts(await render('en'))
    const withFooter = pages.filter((p) => p.includes(getBrand().repoUrl))
    // `render` gates on `pageNumber === totalPages`; more than one means the gate broke.
    expect(withFooter).toHaveLength(1)
    expect(withFooter[0]).toContain('Generated on')
  })

  /**
   * Regression: the footer was present in the file but drawn ~5.7 million points below the page,
   * so no reader ever showed it. react-pdf re-resolves styles on every relayout pass and multiplies
   * a unitless `lineHeight` by `fontSize` each time; only `render`-prop nodes are re-laid out, so
   * the footer's leading compounded to ~7^10. Decoded text alone cannot catch this — the glyphs are
   * emitted either way — so the annotation rectangle is what gets asserted.
   */
  it('lands inside the page box', async () => {
    const annotations = linkAnnotations(await render('en'))
    expect(annotations.length).toBeGreaterThan(0)

    const strays = annotations.filter(({ rect: [left, bottom, right, top] }) => {
      return left! < 0 || bottom! < 0 || right! > A4_WIDTH_PT || top! > A4_HEIGHT_PT
    })
    expect(strays).toEqual([])
  })
})

describe('pagination', () => {
  /**
   * Each heading in the mock CV paired with the first entry that must stay with it.
   *
   * Regression: a section heading rendered alone at the foot of a page while its first entry was
   * pushed to the next one. Asserting co-location is precise; checking whether a page *ends* with
   * a heading is not.
   */
  const HEADING_WITH_FIRST_ENTRY: Array<[heading: string, firstEntry: string]> = [
    ['EXPERIENCE', 'Software Engineer'],
    ['EDUCATION', 'Example University'],
    ['CREDENTIALS', 'Microsoft Learn profile'],
    ['PROJECTS', 'Private CV SPA'],
    ['HONORS & AWARDS', 'Employee of the Year'],
  ]

  it.each(HEADING_WITH_FIRST_ENTRY)('keeps "%s" on the same page as "%s"', async (heading, firstEntry) => {
    const pages = pageTexts(await render('en'))
    const page = pages.find((p) => p.includes(heading))
    expect(page, `expected some page to contain the heading "${heading}"`).toBeDefined()
    expect(page).toContain(firstEntry)
  })
})
