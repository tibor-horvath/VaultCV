import { Fragment } from 'react'
import { Document, Link, Page, Text, View } from '@react-pdf/renderer'
import type { CvData } from '../../../../types/cv'
import { getBrand } from '../../../../lib/brand'
import { buildPdfGeneratedAtFooterParts } from '../../../../lib/pdfFooter'
import { normalizePrintSectionOrder, type SectionKey } from '../../../../lib/sectionOrder'
import { printableCredentials } from '../../../../lib/pdf/credentials'
import type { PdfProfilePhoto } from '../../../../lib/pdf/pdfImage'
import { s } from '../../../../lib/pdf/styles'
import { PdfHeader, PdfRunningHead } from './PdfHeader'
import type { PdfT } from './primitives'
import {
  PdfAwards,
  PdfCredentials,
  PdfEducation,
  PdfExperience,
  PdfInlineSection,
  PdfProjects,
  PdfSkillsLanguages,
  PdfSummary,
} from './sections'

export type CvPdfDocumentProps = {
  cv: CvData
  t: PdfT
  locale: string
  photo: PdfProfilePhoto
  generatedAt?: Date
}

function renderSection(key: SectionKey, cv: CvData, t: PdfT, now: Date) {
  switch (key) {
    case 'credentials': {
      const credentials = printableCredentials(cv.credentials, now)
      return credentials.length ? <PdfCredentials credentials={credentials} t={t} /> : null
    }
    case 'skillsLanguages':
      return <PdfSkillsLanguages skills={cv.skills ?? []} languages={cv.languages ?? []} t={t} />
    case 'experience':
      return cv.experience?.length ? <PdfExperience experience={cv.experience} t={t} /> : null
    case 'projects':
      return cv.projects?.length ? <PdfProjects projects={cv.projects} t={t} /> : null
    case 'education':
      return cv.education?.length ? <PdfEducation education={cv.education} t={t} /> : null
    case 'hobbiesInterests':
      return <PdfInlineSection title={t('hobbiesInterests')} items={cv.hobbiesInterests ?? []} />
    case 'honorsAwards':
      return cv.awards?.length ? <PdfAwards awards={cv.awards} t={t} /> : null
    default:
      return null
  }
}

export function CvPdfDocument({ cv, t, locale, photo, generatedAt }: CvPdfDocumentProps) {
  const brand = getBrand()
  // One timestamp for both the footer and the credential expiry cut-off.
  const now = generatedAt ?? new Date()
  const footer = buildPdfGeneratedAtFooterParts(now, brand)
  const orderedSections = normalizePrintSectionOrder(cv.sectionOrder)

  return (
    <Document
      title={`${cv.basics.name} — CV`}
      author={cv.basics.name}
      creator={brand.displayName}
      producer={brand.displayName}
      language={locale}
    >
      <Page size="A4" style={s.page}>
        <PdfRunningHead cv={cv} />
        <PdfHeader cv={cv} photo={photo} />

        <View style={s.body}>
          {cv.basics.summary?.trim() ? <PdfSummary summary={cv.basics.summary.trim()} t={t} /> : null}
          {orderedSections.map((key) => (
            <Fragment key={key}>{renderSection(key, cv, t, now)}</Fragment>
          ))}
        </View>

        {/* `fixed` repeats these on every page: the page number everywhere, the generated-by
            line only on the last page. */}
        <View fixed style={s.footer}>
          <View style={s.footerRow}>
            <Text style={s.footerText}>{`${cv.basics.name} — CV`}</Text>
            <Text style={s.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
          </View>
        </View>
        <Text
          fixed
          style={s.footerGenerated}
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
      </Page>
    </Document>
  )
}
