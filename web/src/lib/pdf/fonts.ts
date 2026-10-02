import { Font } from '@react-pdf/renderer'
import interRegular from '../../assets/fonts/Inter-Regular.ttf'
import interSemiBold from '../../assets/fonts/Inter-SemiBold.ttf'
import interBold from '../../assets/fonts/Inter-Bold.ttf'
import { font } from './tokens'
import { splitForPdfLineBreak } from './lineBreak'

let registered = false

/**
 * react-pdf's built-in Helvetica is WinAnsi-encoded: it renders `ő` (U+0151) and `ű` (U+0171)
 * as wrong glyphs *without throwing*, silently corrupting Hungarian names. Embedding a Unicode
 * font is therefore required, not cosmetic. It also makes output identical on every machine,
 * which the previous system-font rasterization never was.
 *
 * Idempotent: `Font.register` is module-global state in react-pdf.
 */
export function registerPdfFonts(): void {
  if (registered) return
  registered = true

  Font.register({
    family: font.sans,
    fonts: [
      { src: interRegular, fontWeight: 400 },
      { src: interSemiBold, fontWeight: 600 },
      { src: interBold, fontWeight: 700 },
    ],
  })

  Font.registerHyphenationCallback(splitForPdfLineBreak)
}
