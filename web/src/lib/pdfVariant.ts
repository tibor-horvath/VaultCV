/**
 * The two PDF layouts a visitor can download.
 *
 * - `modern` — designed for the screen: color, a sidebar, and clickable email, profile and
 *   credential links. The default, since most downloads are saved or forwarded, not printed.
 * - `print`  — designed for paper and applicant tracking systems: black ink, no links.
 *
 * Kept outside `lib/pdf/` on purpose: the CV page imports this eagerly, and nothing in the initial
 * bundle may reach the react-pdf chunk.
 */
export type PdfVariant = 'modern' | 'print'

export const PDF_VARIANTS: readonly PdfVariant[] = ['modern', 'print']

export const DEFAULT_PDF_VARIANT: PdfVariant = 'modern'

const STORAGE_KEY = 'cv_pdf_variant'

export function isPdfVariant(value: unknown): value is PdfVariant {
  return value === 'modern' || value === 'print'
}

/** Last format this browser downloaded. Storage can throw (private mode, blocked site data). */
export function readPdfVariantPreference(): PdfVariant {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isPdfVariant(stored)) return stored
  } catch {
    // Fall through to the default.
  }
  return DEFAULT_PDF_VARIANT
}

export function writePdfVariantPreference(variant: PdfVariant): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, variant)
  } catch {
    // A preference that cannot be remembered is not worth surfacing.
  }
}
