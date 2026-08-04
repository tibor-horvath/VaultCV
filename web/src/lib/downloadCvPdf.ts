import type { MessageKey } from '../i18n/messages'
import type { CvData } from '../types/cv'
import { sanitizePdfFileBaseName } from './pdfFileName'
import { withTimeout } from './withTimeout'

const PDF_RENDER_TIMEOUT_MS = 45000

/** Safari/older Edge cancel an in-flight `a[download]` if the object URL is revoked synchronously. */
const OBJECT_URL_RELEASE_DELAY_MS = 10000

export type DownloadCvPdfOptions = {
  cv: CvData
  t: (key: MessageKey) => string
  locale: string
  fileBaseName?: string
}

/**
 * Generates a vector PDF (selectable text, real link annotations, embedded fonts) and saves it.
 *
 * The renderer is behind a dynamic import so `@react-pdf/renderer` — and the embedded font
 * files it references — stay out of the initial bundle and load only on first download.
 */
export async function downloadCvPdf(opts: DownloadCvPdfOptions): Promise<void> {
  const { renderCvPdfBlob } = await import('./pdf/renderCvPdfBlob')
  const blob = await withTimeout(
    renderCvPdfBlob({ cv: opts.cv, t: opts.t, locale: opts.locale }),
    PDF_RENDER_TIMEOUT_MS,
    'rendering the PDF',
  )

  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = `${sanitizePdfFileBaseName(opts.fileBaseName ?? 'cv')}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), OBJECT_URL_RELEASE_DELAY_MS)
  }
}
