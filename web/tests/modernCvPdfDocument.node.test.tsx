// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { renderToBuffer } from '@react-pdf/renderer'
import { getMockCv } from '../src/lib/mockCv'
import { getBrand } from '../src/lib/brand'
import { enMessages } from '../src/i18n/messages'
import type { MessageKey } from '../src/i18n/messages'
import { huMessages } from '../src/i18n/messages/hu'
import type { CvData } from '../src/types/cv'
import { ModernCvPdfDocument } from '../src/components/cv/pdf/modern/ModernCvPdfDocument'
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

/** Same pinned date as the print test: two of the mock CV's credentials have expired by then. */
const GENERATED_AT = new Date(2026, 9, 2, 12, 0, 0)

function tFor(locale: 'en' | 'hu') {
  const messages = locale === 'hu' ? huMessages : enMessages
  return (key: MessageKey) => messages[key] ?? enMessages[key]
}

function render(locale: 'en' | 'hu' = 'en', cv: CvData = getMockCv(locale)) {
  return renderToBuffer(
    <ModernCvPdfDocument cv={cv} t={tFor(locale)} locale={locale} photo={{ kind: 'fallback' }} generatedAt={GENERATED_AT} />,
  )
}

/** The mock CV with its work history repeated until it cannot fit on one page. */
function longCv(): CvData {
  const cv = getMockCv('en')
  const experience = Array.from({ length: 6 }, (_, round) =>
    (cv.experience ?? []).map((x) => ({ ...x, id: `${x.id}-${round}` })),
  ).flat()
  return { ...cv, experience }
}

function pageNumbered(pages: string[], n: number): string | undefined {
  return pages.find((p) => p.includes(`${n} / ${pages.length}`))
}

function uris(pdf: Buffer): string[] {
  return [...pdf.toString('latin1').matchAll(/\/URI\s*\(([^)]*)\)/g)].map((m) => m[1]!)
}

// Renders several PDFs per case; under a parallel full-suite run that can exceed the 5s default.
describe('ModernCvPdfDocument', { timeout: 30_000 }, () => {
  it('produces a vector PDF with embedded fonts', async () => {
    const pdf = await render()
    const latin = pdf.toString('latin1')
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
    expect(latin).toContain('/FontFile2')
    expect(latin).toContain('/ToUnicode')
    expect(latin).not.toMatch(/\/Subtype\s*\/Image/)
  })

  it('links contact details, profiles, employers, schools, projects and credentials', async () => {
    const links = uris(await render())
    expect(links).toEqual(
      expect.arrayContaining([
        'mailto:john.doe@example.com',
        'tel:+4915123456789',
        'https://github.com/your-handle',
        'https://www.linkedin.com/in/your-handle/',
        'https://example.com/',
        'https://example.edu/',
        'https://github.com/your-handle/cv',
        'https://learn.microsoft.com/',
        'https://www.cambridgeenglish.org/exams-and-tests/advanced/',
        getBrand().repoUrl,
      ]),
    )
  })

  it('hides expired credentials, links included', async () => {
    const pdf = await render()
    const text = pageTexts(pdf).join('\n')
    expect(text).toContain('Microsoft Learn profile')
    expect(text).not.toContain('Certification transcript')
    expect(text).not.toContain('AWS Certified Developer')
    expect(uris(pdf)).not.toContain('https://aws.amazon.com/certification/')
  })

  it('never links unsafe URLs', async () => {
    const cv = getMockCv('en')
    cv.links = [{ label: 'Evil', url: 'javascript:alert(1)' }]
    const pdf = await render('en', cv)
    expect(uris(pdf).some((u) => u.startsWith('javascript:'))).toBe(false)
  })

  it('keeps every link annotation inside the page box', async () => {
    for (const pdf of [await render(), await render('en', longCv())]) {
      const annotations = linkAnnotations(pdf)
      expect(annotations.length).toBeGreaterThan(5)
      const strays = annotations.filter(({ rect: [left, bottom, right, top] }) => {
        return left! < 0 || bottom! < 0 || right! > A4_WIDTH_PT || top! > A4_HEIGHT_PT
      })
      expect(strays).toEqual([])
    }
  })

  it('numbers pages and repeats who the CV belongs to on continuation pages', async () => {
    const pages = pageTexts(await render('en', longCv()))
    expect(pages.length).toBeGreaterThan(1)
    for (let n = 1; n <= pages.length; n++) expect(pageNumbered(pages, n), `page ${n}`).toBeDefined()
    for (let n = 2; n <= pages.length; n++) {
      expect(pageNumbered(pages, n)).toContain('Full‑stack Developer')
      expect(pageNumbered(pages, n)).toContain('john.doe@example.com')
    }
  })

  it('prints the generated-by line on the last page only', async () => {
    const pages = pageTexts(await render('en', longCv()))
    const withFooter = pages.filter((p) => p.includes(getBrand().repoUrl))
    expect(withFooter).toHaveLength(1)
    expect(withFooter[0]).toContain(`${pages.length} / ${pages.length}`)
  })

  it.each([
    ['Experience', 'Software Engineer'],
    ['Education', 'Example University'],
    ['Projects', 'Private CV SPA'],
    ['Honors & awards', 'Employee of the Year'],
    ['CREDENTIALS', 'Microsoft Learn profile'],
  ])('keeps "%s" on the same page as "%s"', async (heading, firstEntry) => {
    // The mock CV breaks right at the awards; the long one breaks inside the work history.
    for (const cv of [getMockCv('en'), longCv()]) {
      const pages = pageTexts(await render('en', cv))
      const page = pages.find((p) => p.includes(heading))
      expect(page, `expected some page to contain "${heading}"`).toBeDefined()
      expect(page).toContain(firstEntry)
    }
  })

  it('round-trips the double-acute characters WinAnsi cannot encode', async () => {
    const cv = {
      basics: { name: 'Bíró Győző', headline: 'Űrhajós · Tűzszerész', summary: 'Őrült űrhajós, tűzoltó.' },
      languages: ['Magyar (Anyanyelvi)'],
    } as CvData
    const cps = extractableCodepoints(inflateAllStreams(await render('hu', cv)))
    for (const ch of ['ő', 'ű', 'Ő', 'Ű', 'í', 'ó']) {
      expect(cps.has(ch.codePointAt(0)!), `${ch} must be extractable`).toBe(true)
    }
  })
})
