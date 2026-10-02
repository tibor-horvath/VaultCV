import { pdf } from '@react-pdf/renderer'
import { CvPdfDocument, type CvPdfDocumentProps } from '../../components/cv/pdf/document/CvPdfDocument'
import { ModernCvPdfDocument } from '../../components/cv/pdf/modern/ModernCvPdfDocument'
import { buildPhotoSrc } from '../cvPresentation'
import type { PdfVariant } from '../pdfVariant'
import { resolvePdfProfilePhoto } from './pdfImage'
import { registerPdfFonts } from './fonts'

export type RenderCvPdfOptions = Omit<CvPdfDocumentProps, 'photo'> & { variant: PdfVariant }

/** The document component for a layout; both take the same props. */
export function pdfDocumentFor(variant: PdfVariant) {
  return variant === 'modern' ? ModernCvPdfDocument : CvPdfDocument
}

/**
 * Lazy-chunk entry point: everything react-pdf reaches from here, so nothing above this module
 * pulls the renderer into the initial bundle.
 */
export async function renderCvPdfBlob({ variant, ...opts }: RenderCvPdfOptions): Promise<Blob> {
  registerPdfFonts()
  // Resolved up front so the render itself is synchronous and cannot abort on a failed image fetch.
  const photo = await resolvePdfProfilePhoto(buildPhotoSrc(opts.cv.basics))
  const PdfDocument = pdfDocumentFor(variant)
  return pdf(<PdfDocument {...opts} photo={photo} />).toBlob()
}
