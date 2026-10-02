import { Fragment } from 'react'
import { Document, Link, Page, Text, View } from '@react-pdf/renderer'
import type { CvData } from '../../../../types/cv'
import { getBrand } from '../../../../lib/brand'
import { buildPdfGeneratedAtFooterParts } from '../../../../lib/pdfFooter'
import { normalizePrintSectionOrder, type SectionKey } from '../../../../lib/sectionOrder'
import { printableCredentials } from '../../../../lib/pdf/credentials'
import { m } from '../../../../lib/pdf/modernStyles'
import type { CvPdfDocumentProps } from '../document/CvPdfDocument'
import type { PdfT } from '../document/primitives'
import { ModernSidebar, ModernSidebarRunningHead } from './ModernSidebar'
import {
  ModernAwards,
  ModernEducation,
  ModernExperience,
  ModernHeader,
  ModernInterests,
  ModernProjects,
} from './modernSections'

/**
 * Main-column sections. Credentials, skills and languages live in the sidebar, so their keys in
 * the profile's `sectionOrder` render nothing here; the remaining keys keep their relative order.
 */
function renderMainSection(key: SectionKey, cv: CvData, t: PdfT) {
  switch (key) {
    case 'experience':
      return cv.experience?.length ? <ModernExperience experience={cv.experience} t={t} /> : null
    case 'projects':
      return cv.projects?.length ? <ModernProjects projects={cv.projects} t={t} /> : null
    case 'education':
      return cv.education?.length ? <ModernEducation education={cv.education} t={t} /> : null
    case 'hobbiesInterests':
      return <ModernInterests title={t('hobbiesInterests')} items={cv.hobbiesInterests ?? []} />
    case 'honorsAwards':
      return cv.awards?.length ? <ModernAwards awards={cv.awards} t={t} /> : null
    default:
      return null
  }
}

/**
 * The screen-first CV: a full-height Vault Ink sidebar beside a white main column, color, and live
 * links. Same content rules as the print layout (expired credentials hidden, selectable text).
 */
export function ModernCvPdfDocument({ cv, t, locale, photo, generatedAt }: CvPdfDocumentProps) {
  const brand = getBrand()
  const now = generatedAt ?? new Date()
  const footer = buildPdfGeneratedAtFooterParts(now, brand)
  const orderedSections = normalizePrintSectionOrder(cv.sectionOrder)
  const credentials = printableCredentials(cv.credentials, now)

  return (
    <Document
      title={`${cv.basics.name} — CV`}
      author={cv.basics.name}
      creator={brand.displayName}
      producer={brand.displayName}
      language={locale}
    >
      <Page size="A4" style={m.page}>
        <View fixed style={m.sidebarBackdrop} />
        <ModernSidebarRunningHead cv={cv} />

        <View style={m.columns}>
          <ModernSidebar cv={cv} photo={photo} credentials={credentials} t={t} />
          <View style={m.main}>
            <ModernHeader name={cv.basics.name} headline={cv.basics.headline} summary={cv.basics.summary} />
            {orderedSections.map((key) => (
              <Fragment key={key}>{renderMainSection(key, cv, t)}</Fragment>
            ))}
          </View>
        </View>

        <View fixed style={m.footer}>
          <Text style={m.footerText}>{`${cv.basics.name} · CV`}</Text>
          <Text style={m.footerText} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
        <Text
          fixed
          style={m.footerGenerated}
          render={({ pageNumber, totalPages }) =>
            pageNumber !== totalPages ? null : (
              <>
                {footer.prefix}
                <Link src={footer.url} style={m.footerLink}>
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
