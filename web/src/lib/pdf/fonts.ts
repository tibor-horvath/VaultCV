import { Font } from '@react-pdf/renderer'
import interRegular from '../../assets/fonts/Inter-Regular.ttf'
import interSemiBold from '../../assets/fonts/Inter-SemiBold.ttf'
import interBold from '../../assets/fonts/Inter-Bold.ttf'
import robotoMonoRegular from '../../assets/fonts/RobotoMono-Regular.ttf'
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
  // Roboto Mono deliberately, not JetBrains Mono: the latter's programming ligatures (`://`)
  // crash react-pdf's bundled fontkit with "Offset is outside the bounds of the DataView".
  // Ligature-free is also the right call for URLs, which must read literally.
  Font.register({
    family: font.mono,
    fonts: [{ src: robotoMonoRegular, fontWeight: 400 }],
  })

  Font.registerHyphenationCallback(splitForPdfLineBreak)
}
