import { pdf } from '@react-pdf/renderer'
import { CvPdfDocument, type CvPdfDocumentProps } from '../../components/cv/pdf/document/CvPdfDocument'
import { buildPhotoSrc } from '../cvPresentation'
import { resolvePdfProfilePhoto } from './pdfImage'
import { registerPdfFonts } from './fonts'

export type RenderCvPdfOptions = Omit<CvPdfDocumentProps, 'photo'>

/**
 * Lazy-chunk entry point: everything react-pdf reaches from here, so nothing above this module
 * pulls the renderer into the initial bundle.
 */
export async function renderCvPdfBlob(opts: RenderCvPdfOptions): Promise<Blob> {
  registerPdfFonts()
  // Resolved up front so the render itself is synchronous and cannot abort on a failed image fetch.
  const photo = await resolvePdfProfilePhoto(buildPhotoSrc(opts.cv.basics))
  return pdf(<CvPdfDocument {...opts} photo={photo} />).toBlob()
}
