import { inflateSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { Font } from '@react-pdf/renderer'

/**
 * Shared by the PDF layout tests. They guard the property the renderer exists to provide: the PDF
 * must contain real, extractable text rather than a picture of text.
 */

function fontPath(name: string): string {
  return fileURLToPath(new URL(`../src/assets/fonts/${name}`, import.meta.url))
}

/**
 * Fonts are registered from the filesystem here. The app's `fonts.ts` imports `.ttf` files as
 * Vite URL assets, which only resolve in a browser; the font *files* are the same.
 */
export function registerTestFonts(): void {
  Font.register({
    family: 'Inter',
    fonts: [
      { src: fontPath('Inter-Regular.ttf'), fontWeight: 400 },
      { src: fontPath('Inter-SemiBold.ttf'), fontWeight: 600 },
      { src: fontPath('Inter-Bold.ttf'), fontWeight: 700 },
    ],
  })
  Font.registerHyphenationCallback((word) => [word])
}

/** Every FlateDecode stream, decoded, paired with the object number that owns it. */
export function inflateStreamObjects(pdf: Buffer): Array<{ object: number; content: string }> {
  const latin = pdf.toString('latin1')
  const out: Array<{ object: number; content: string }> = []
  for (const m of latin.matchAll(/(\d+) 0 obj/g)) {
    const header = m.index + m[0].length
    const objectEnd = latin.indexOf('endobj', header)
    const keyword = latin.indexOf('stream', header)
    // Objects that carry no stream would otherwise pick up the next object's.
    if (keyword < 0 || (objectEnd >= 0 && keyword > objectEnd)) continue
    const eol = latin.startsWith('\r\n', keyword + 'stream'.length) ? 2 : 1
    const start = keyword + 'stream'.length + eol
    const end = latin.indexOf('endstream', start)
    if (end < 0) continue
    try {
      out.push({ object: Number(m[1]), content: inflateSync(pdf.subarray(start, end)).toString('latin1') })
    } catch {
      // Not zlib (or our boundary guess was off) — not a stream we need.
    }
  }
  return out
}

/** Every FlateDecode stream, decoded, in document order. */
export function inflateStreams(pdf: Buffer): string[] {
  return inflateStreamObjects(pdf).map((s) => s.content)
}

/**
 * Maps each font resource (`/F1`, `/F2`, …) to its glyph-id -> Unicode table.
 *
 * Fonts are embedded with Identity-H encoding, so the codes inside `Tj`/`TJ` are glyph ids that
 * are only meaningful per font — decoding must be font-scoped or text comes out garbled.
 */
export function buildFontMaps(pdf: Buffer): Map<string, Map<number, string>> {
  const latin = pdf.toString('latin1')

  // ToUnicode CMaps, keyed by the object that holds them.
  const cmapByObject = new Map<number, Map<number, string>>()
  for (const { object, content: stream } of inflateStreamObjects(pdf)) {
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
    cmapByObject.set(object, map)
  }

  /*
   * Resource name -> font object -> CMap object. Joining on object numbers is what makes this
   * stable; pairing the two lists by position is not.
   *
   * Emission order is not a property this file can lean on: rendering the same CV sixty times
   * emits the ToUnicode CMap objects in two different orders, the minority one about 8% of the
   * time. Positional pairing then handed the semibold font the regular font's CMap, every
   * uppercase heading decoded to the wrong characters, and one `it.each` case out of five failed
   * on a heading that was present and correct in the PDF.
   */
  const toUnicodeByFont = new Map<number, number>()
  for (const m of latin.matchAll(/(\d+) 0 obj([\s\S]*?)endobj/g)) {
    const toUnicode = m[2]!.match(/\/ToUnicode\s+(\d+)\s+0\s+R/)?.[1]
    if (toUnicode) toUnicodeByFont.set(Number(m[1]), Number(toUnicode))
  }

  const byResource = new Map<string, Map<number, string>>()
  for (const m of latin.matchAll(/\/(F\d+)\s+(\d+)\s+0\s+R/g)) {
    const cmap = cmapByObject.get(toUnicodeByFont.get(Number(m[2])) ?? -1)
    if (cmap) byResource.set(m[1]!, cmap)
  }
  return byResource
}

/** Visible text of each page, in order, decoded through the per-font CMaps. */
export function pageTexts(pdf: Buffer): string[] {
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
export function inflateAllStreams(pdf: Buffer): string {
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
export function extractableCodepoints(decoded: string): Set<number> {
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


export const A4_WIDTH_PT = 595.28
export const A4_HEIGHT_PT = 841.89

/**
 * Link annotations paired with their URI, which lives in a separate action object (`/A 20 0 R`).
 */
export function linkAnnotations(pdf: Buffer): Array<{ uri: string; rect: number[] }> {
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
