// @vitest-environment node
import { inflateSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { Font, renderToBuffer } from '@react-pdf/renderer'
import { getMockCv } from '../src/lib/mockCv'
import { getBrand } from '../src/lib/brand'
import { enMessages } from '../src/i18n/messages'
import type { MessageKey } from '../src/i18n/messages'
import { huMessages } from '../src/i18n/messages/hu'
import { CvPdfDocument } from '../src/components/cv/pdf/document/CvPdfDocument'

/**
 * End-to-end guard for the property this renderer exists to provide: the PDF must contain real,
 * extractable text rather than a picture of text.
 *
 * Fonts are registered from the filesystem here. The app's `fonts.ts` imports `.ttf` files as
 * Vite URL assets, which only resolve in a browser; the font *files* are the same.
 */
function fontPath(name: string): string {
  return fileURLToPath(new URL(`../src/assets/fonts/${name}`, import.meta.url))
}

Font.register({
  family: 'Inter',
  fonts: [
    { src: fontPath('Inter-Regular.ttf'), fontWeight: 400 },
    { src: fontPath('Inter-SemiBold.ttf'), fontWeight: 600 },
    { src: fontPath('Inter-Bold.ttf'), fontWeight: 700 },
  ],
})
Font.register({ family: 'RobotoMono', fonts: [{ src: fontPath('RobotoMono-Regular.ttf'), fontWeight: 400 }] })
Font.registerHyphenationCallback((word) => [word])

function render(locale: 'en' | 'hu') {
  const messages = locale === 'hu' ? huMessages : enMessages
  const t = (key: MessageKey) => messages[key] ?? enMessages[key]
  return renderToBuffer(
    <CvPdfDocument cv={getMockCv(locale)} t={t} locale={locale} photo={{ kind: 'fallback' }} />,
  )
}

/** Every FlateDecode stream, decoded, in document order. */
function inflateStreams(pdf: Buffer): string[] {
  const latin = pdf.toString('latin1')
  const re = /(^|[^d])stream(\r\n|\r|\n)/g
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(latin))) {
    const start = m.index + m[0].length
    const end = latin.indexOf('endstream', start)
    if (end < 0) continue
    try {
      out.push(inflateSync(pdf.subarray(start, end)).toString('latin1'))
    } catch {
      // Not zlib (or our boundary guess was off) — not a stream we need.
    }
  }
  return out
}

/**
 * Maps each font resource (`/F1`, `/F2`, …) to its glyph-id -> Unicode table.
 *
 * Fonts are embedded with Identity-H encoding, so the codes inside `Tj`/`TJ` are glyph ids that
 * are only meaningful per font — decoding must be font-scoped or text comes out garbled.
 */
function buildFontMaps(pdf: Buffer): Map<string, Map<number, string>> {
  const latin = pdf.toString('latin1')
  const streams = inflateStreams(pdf)

  // ToUnicode CMaps, in the order their stream objects appear.
  const cmaps: Array<Map<number, string>> = []
  for (const stream of streams) {
    if (!stream.includes('beginbfchar') && !stream.includes('beginbfrange')) continue
    const map = new Map<number, string>()
    const chars = /beginbfchar([\s\S]*?)endbfchar/g
    let c: RegExpExecArray | null
    while ((c = chars.exec(stream))) {
      const pairs = c[1]!.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) ?? []
      for (const pair of pairs) {
        const [src, dst] = pair.match(/<([0-9A-Fa-f]+)>/g)!.map((h) => h.slice(1, -1))
        map.set(parseInt(src!, 16), String.fromCodePoint(parseInt(dst!.slice(0, 4), 16)))
      }
    }
    const ranges = /beginbfrange([\s\S]*?)endbfrange/g
    let r: RegExpExecArray | null
    while ((r = ranges.exec(stream))) {
      const triples = r[1]!.match(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g) ?? []
      for (const triple of triples) {
        const [lo, hi, dst] = triple.match(/<([0-9A-Fa-f]+)>/g)!.map((h) => h.slice(1, -1))
        const start = parseInt(lo!, 16)
        const end = parseInt(hi!, 16)
        const base = parseInt(dst!.slice(0, 4), 16)
        for (let i = start; i <= end && i - start < 512; i++) {
          map.set(i, String.fromCodePoint(base + (i - start)))
        }
      }
    }
    cmaps.push(map)
  }

  // Font dicts reference their CMap by object number; pair them up in declaration order.
  const byResource = new Map<string, Map<number, string>>()
  const fontDicts = [...latin.matchAll(/\/BaseFont\s*\/[^\s/]+[\s\S]{0,400}?\/ToUnicode\s+(\d+)\s+0\s+R/g)]
  const resources = [...latin.matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g)]
  fontDicts.forEach((_, i) => {
    const res = resources[i]?.[1]
    if (res && cmaps[i]) byResource.set(res, cmaps[i]!)
  })
  return byResource
}

/** Visible text of each page, in order, decoded through the per-font CMaps. */
function pageTexts(pdf: Buffer): string[] {
  const fonts = buildFontMaps(pdf)
  const fallback = [...fonts.values()][0] ?? new Map<number, string>()
  return inflateStreams(pdf)
    .filter((s) => s.includes('BT') && /\bTf\b/.test(s))
    .map((stream) => {
      let current = fallback
      let text = ''
      const op = /\/(F\d+)\s+[\d.]+\s+Tf|<([0-9A-Fa-f]+)>\s*Tj|\[([^\]]*)\]\s*TJ/g
      let m: RegExpExecArray | null
      while ((m = op.exec(stream))) {
        if (m[1]) {
          current = fonts.get(m[1]) ?? current
          continue
        }
        const hexRuns = m[2] ? [m[2]] : ([...m[3]!.matchAll(/<([0-9A-Fa-f]+)>/g)].map((h) => h[1]!) ?? [])
        for (const hex of hexRuns) {
          for (let i = 0; i + 4 <= hex.length; i += 4) {
            text += current.get(parseInt(hex.slice(i, i + 4), 16)) ?? ''
          }
        }
      }
      return text
    })
}

/** Decodes every FlateDecode stream so we can read the ToUnicode CMaps and content operators. */
function inflateAllStreams(pdf: Buffer): string {
  const latin = pdf.toString('latin1')
  const re = /(^|[^d])stream(\r\n|\r|\n)/g
  let out = ''
  let m: RegExpExecArray | null
  while ((m = re.exec(latin))) {
    const start = m.index + m[0].length
    const end = latin.indexOf('endstream', start)
    if (end < 0) continue
    try {
      out += inflateSync(pdf.subarray(start, end)).toString('latin1')
    } catch {
      // Not every stream is zlib (or our boundary guess may be off); skip it.
    }
  }
  return out
}

/** Unicode codepoints the document's ToUnicode CMaps can produce — i.e. what copy/search yields. */
function extractableCodepoints(decoded: string): Set<number> {
  const cps = new Set<number>()
  const re = /beginbfchar([\s\S]*?)endbfchar|beginbfrange([\s\S]*?)endbfrange/g
  let m: RegExpExecArray | null
  while ((m = re.exec(decoded))) {
    for (const hex of (m[1] ?? m[2] ?? '').match(/<([0-9A-Fa-f]{4,})>/g) ?? []) {
      const h = hex.slice(1, -1)
      for (let i = 0; i + 4 <= h.length; i += 4) cps.add(parseInt(h.slice(i, i + 4), 16))
    }
  }
  return cps
}

describe('CvPdfDocument', () => {
  it('produces a valid multi-page PDF', async () => {
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

  it('emits real link annotations for every link kind', async () => {
    const latin = (await render('en')).toString('latin1')
    const uris = latin.match(/\/URI\s*\(([^)]*)\)/g) ?? []
    expect(uris.length).toBeGreaterThan(5)
    expect(uris.some((u) => u.includes('mailto:'))).toBe(true)
    expect(uris.some((u) => u.includes('https://'))).toBe(true)
    // Every emitted URI must carry a scheme, or viewers resolve it relative to nothing.
    for (const uri of uris) expect(uri).toMatch(/\/URI\s*\((?:[a-z][a-z0-9+.-]*:|\/\/)/i)
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

const A4_WIDTH_PT = 595.28
const A4_HEIGHT_PT = 841.89

/**
 * Link annotations paired with their URI, which lives in a separate action object (`/A 20 0 R`).
 */
function linkAnnotations(pdf: Buffer): Array<{ uri: string; rect: number[] }> {
  const latin = pdf.toString('latin1')
  const uriByObject = new Map<string, string>()
  for (const m of latin.matchAll(/(\d+) 0 obj\s*<<\s*\/S \/URI\s*\/URI \(([^)]*)\)/g)) {
    uriByObject.set(m[1]!, m[2]!)
  }
  return [...latin.matchAll(/\/Subtype \/Link[\s\S]{0,400}?>>/g)].flatMap((m) => {
    const uri = uriByObject.get(m[0].match(/\/A (\d+) 0 R/)?.[1] ?? '')
    const rect = m[0].match(/\/Rect \[([^\]]*)\]/)?.[1]
    if (!uri || !rect) return []
    return [{ uri, rect: rect.trim().split(/\s+/).map(Number) }]
  })
}

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
    expect(annotations.length).toBeGreaterThan(5)

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
   * Regression: "LANGUAGE EXAMS" rendered alone at the foot of a page while its first credential
   * was pushed to the next one. Asserting co-location is precise; checking whether a page *ends*
   * with a heading is not — "AWS" is both a credential issuer heading and a skill chip.
   */
  const HEADING_WITH_FIRST_ENTRY: Array<[heading: string, firstEntry: string]> = [
    ['CREDENTIALS', 'Microsoft Learn profile'],
    ['MICROSOFT', 'Microsoft Learn profile'],
    ['LANGUAGE EXAMS', 'Cambridge English C1 Advanced'],
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
