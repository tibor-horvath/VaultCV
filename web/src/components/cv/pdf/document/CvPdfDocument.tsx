import { Fragment } from 'react'
import { Document, Link, Page, Text, View } from '@react-pdf/renderer'
import type { CvData } from '../../../../types/cv'
import { getBrand } from '../../../../lib/brand'
import { buildPdfGeneratedAtFooterParts } from '../../../../lib/pdfFooter'
import { normalizeSectionOrder, type SectionKey } from '../../../../lib/sectionOrder'
import type { PdfProfilePhoto } from '../../../../lib/pdf/pdfImage'
import { s } from '../../../../lib/pdf/styles'
import { PdfHeader } from './PdfHeader'
import type { PdfT } from './primitives'
import {
  PdfAwards,
  PdfChipSection,
  PdfCredentials,
  PdfEducation,
  PdfExperience,
  PdfProjects,
  PdfSummary,
} from './sections'

export type CvPdfDocumentProps = {
  cv: CvData
  t: PdfT
  locale: string
  photo: PdfProfilePhoto
  generatedAt?: Date
}

function renderSection(key: SectionKey, cv: CvData, t: PdfT) {
  switch (key) {
    case 'credentials':
      return cv.credentials?.length ? <PdfCredentials credentials={cv.credentials} t={t} /> : null
    case 'skillsLanguages':
      return (
        <Fragment>
          {cv.skills?.length ? <PdfChipSection title={t('skills')} items={cv.skills} /> : null}
          {cv.languages?.length ? <PdfChipSection title={t('languages')} items={cv.languages} /> : null}
        </Fragment>
      )
    case 'experience':
      return cv.experience?.length ? <PdfExperience experience={cv.experience} t={t} /> : null
    case 'projects':
      return cv.projects?.length ? <PdfProjects projects={cv.projects} t={t} /> : null
    case 'education':
      return cv.education?.length ? <PdfEducation education={cv.education} t={t} /> : null
    case 'hobbiesInterests':
      return cv.hobbiesInterests?.length ? (
        <PdfChipSection title={t('hobbiesInterests')} items={cv.hobbiesInterests} />
      ) : null
    case 'honorsAwards':
      return cv.awards?.length ? <PdfAwards awards={cv.awards} t={t} /> : null
    default:
      return null
  }
}

export function CvPdfDocument({ cv, t, locale, photo, generatedAt }: CvPdfDocumentProps) {
  const brand = getBrand()
  const footer = buildPdfGeneratedAtFooterParts(generatedAt, brand)
  const orderedSections = normalizeSectionOrder(cv.sectionOrder)

  return (
    // Metadata the raster pipeline could never provide; `language` also helps screen readers.
    <Document
      title={`${cv.basics.name} — CV`}
      author={cv.basics.name}
      creator={brand.displayName}
      producer={brand.displayName}
      language={locale}
    >
      <Page size="A4" style={s.page}>
        <PdfHeader cv={cv} photo={photo} />

        <View style={s.body}>
          {cv.basics.summary ? <PdfSummary summary={cv.basics.summary} /> : null}
          {orderedSections.map((key) => (
            <Fragment key={key}>{renderSection(key, cv, t)}</Fragment>
          ))}
        </View>

        {/* `fixed` reserves the band on every page; `render` prints it only on the last, matching
            the previous behaviour. */}
        <View fixed style={s.footer}>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              pageNumber !== totalPages ? null : (
                <>
                  {footer.prefix}
                  <Link src={footer.url} style={s.footerLink}>
                    {footer.url}
                  </Link>
                  {footer.suffix}
                </>
              )
            }
          />
        </View>
      </Page>
    </Document>
  )
}
