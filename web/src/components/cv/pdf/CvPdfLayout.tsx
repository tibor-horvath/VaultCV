import { forwardRef } from 'react'
import { AtSign, Calendar, Globe, Mail, MapPin, Sparkles } from 'lucide-react'
import type { CvCredentialIssuer, CvData, CvEducation } from '../../../types/cv'
import {
  buildPhotoSrc,
  inferLinkKind,
  inferProjectLinkLabelKind,
  isCrossOriginImageUrl,
  parseBasicsHeadline,
} from '../../../lib/cvPresentation'
import { PDF_CAPTURE_ROOT_WIDTH_PX } from '../../../lib/pdfCaptureLayout'
import { highlightChildKey, stableEducationKey, stableExperienceKey } from '../../../lib/cvKeys'
import { useI18n } from '../../../lib/i18n'
import { SiGithubIcon, SiLinkedinIcon } from '../../icons/SimpleBrandIcons'
import { CredentialIssuerIcon } from '../CredentialIssuerIcon'

const credentialIssuerOrder: CvCredentialIssuer[] = ['microsoft', 'aws', 'google', 'school', 'language', 'other']

/** Decorative icon next to links (not interactive; PDF hit targets use the URL line). */
const pdfLinkIconClass = 'h-4 w-4 shrink-0 translate-y-px text-slate-600 opacity-90'

/** Tight line-height so flex `items-center` aligns text with icons (root uses `leading-relaxed`). */
const pdfIconRowClass = 'flex min-w-0 items-center gap-2 leading-none'
const pdfIconRowTightClass = 'flex min-w-0 items-center gap-1 leading-none'
const pdfIconRowSmClass = 'inline-flex items-center gap-1 leading-none'

/** Tag pills (skills, languages, project tags): `.pdf-print-chip` onclone styles in `downloadCvPdf`. */
const pdfChipSmClass =
  'pdf-print-chip pdf-print-chip--sm rounded-full border border-slate-200/90 bg-slate-50 px-[calc(10px*1.05)] font-medium text-slate-600'

/**
 * Bare `www.` / missing-scheme URLs would resolve as same-site paths (same tab). Add `https:` when needed.
 * `mailto:` / `tel:` left as-is so the UA handles them; those do not use `target="_blank"`.
 */
function normalizePdfAnchorHref(raw: string): string {
  const s = raw.trim()
  if (!s) return s
  if (/^[a-z][a-z0-9+.-]*:/i.test(s) || s.startsWith('//')) return s
  if (/^www\./i.test(s)) return `https://${s}`
  return s
}

/** Visible, clickable URL for screen + PDF link annotations (`data-pdf-link` on the text, not the icon). */
function PdfPrintUrlLine({ href, className = '' }: { href: string | undefined; className?: string }) {
  if (href == null || String(href).trim() === '') return null
  const safe = normalizePdfAnchorHref(String(href))
  const lower = safe.toLowerCase()
  const isMailto = lower.startsWith('mailto:')
  const isTel = lower.startsWith('tel:')
  const openInNewTab = !isMailto && !isTel
  const text = isMailto
    ? safe.replace(/^mailto:/i, '')
    : isTel
      ? safe.replace(/^tel:/i, '')
      : safe
  return (
    <a
      href={safe}
      data-pdf-link=""
      target={openInNewTab ? '_blank' : undefined}
      rel={openInNewTab ? 'noopener noreferrer' : undefined}
      className={`inline-flex max-w-full min-h-0 items-center break-all font-mono text-[10px] leading-none text-slate-600 no-underline${className ? ` ${className}` : ''}`}
    >
      {text}
    </a>
  )
}

function hasPdfUrl(url: string | undefined | null): boolean {
  return url != null && String(url).trim() !== ''
}

function educationCredentialLine(e: CvEducation): string {
  return [e.degree, e.field, e.program].filter((s) => s != null && String(s).trim() !== '').join(' · ')
}

export const CvPdfLayout = forwardRef<
  HTMLDivElement,
  { cv: CvData; /** Same resolved avatar URL as BasicsCard when passed from the route. */ profilePhotoSrc?: string }
>(function CvPdfLayout({ cv, profilePhotoSrc }, ref) {
  const { t } = useI18n()
  const basics = cv.basics
  const photoSrc = profilePhotoSrc ?? buildPhotoSrc(basics)
  const { role, chip } = parseBasicsHeadline(basics.headline)
  const visibleLinks = (cv.links ?? []).filter(
    (l) => hasPdfUrl(l.url) && inferLinkKind(l) !== 'other',
  )

  return (
    <div
      ref={ref}
      className="mx-auto shrink-0 overflow-visible rounded-3xl border border-slate-200/90 bg-white text-[13px] leading-relaxed text-slate-800 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.2)]"
      style={{
        width: PDF_CAPTURE_ROOT_WIDTH_PX,
        minWidth: PDF_CAPTURE_ROOT_WIDTH_PX,
        maxWidth: PDF_CAPTURE_ROOT_WIDTH_PX,
      }}
    >
      <div
        className="rounded-t-3xl border-b border-indigo-100/80 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/70 px-8 pb-8 pt-10"
        data-pdf-page-break=""
      >
        <div className="flex flex-row items-start gap-8">
          <div className="shrink-0">
            <img
              data-pdf-profile-photo=""
              src={photoSrc}
              alt={basics.photoAlt ?? `${basics.name} — ${t('pdfProfilePhotoContext')}`}
              width={160}
              height={160}
              crossOrigin={isCrossOriginImageUrl(photoSrc) ? 'anonymous' : undefined}
              decoding="async"
              loading="eager"
              className="aspect-square h-40 w-40 rounded-3xl object-cover object-top ring-2 ring-white shadow-md"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-slate-900">{basics.name}</h1>
            {role ? <p className="mt-2 text-base font-medium text-slate-600">{role}</p> : null}
            {chip ? (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/90 px-3 py-1 text-xs font-medium leading-none text-slate-600">
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-indigo-500" aria-hidden="true" />
                <span className="leading-none">{chip}</span>
              </div>
            ) : null}
            {basics.location ? (
              <div className={`mt-4 ${pdfIconRowClass} text-sm text-slate-600`}>
                {/* 1em matches text-sm cap height better than fixed h-4; Lucide pin is top-heavy in its viewBox */}
                <MapPin
                  className="h-[1em] w-[1em] shrink-0 translate-y-[0.08em] text-indigo-500/90"
                  aria-hidden="true"
                />
                <span className="leading-none">{basics.location}</span>
              </div>
            ) : null}
            {hasPdfUrl(basics.email) || visibleLinks.length ? (
              <div className="mt-5 space-y-2 border-t border-slate-200/70 pt-2">
                {hasPdfUrl(basics.email) ? (
                  <div className={`${pdfIconRowClass}`} data-pdf-page-break="">
                    <Mail className={pdfLinkIconClass} aria-hidden="true" />
                    <PdfPrintUrlLine href={`mailto:${String(basics.email).trim()}`} className="min-w-0 flex-1" />
                  </div>
                ) : null}
                {visibleLinks.map((l) => {
                  const kind = inferLinkKind(l)
                  const Icon = kind === 'github' ? SiGithubIcon : kind === 'linkedin' ? SiLinkedinIcon : Globe
                  return (
                    <div key={`${l.label}:${l.url}`} className={pdfIconRowClass} data-pdf-page-break="">
                      <Icon className={pdfLinkIconClass} aria-hidden="true" />
                      <PdfPrintUrlLine href={l.url} className="min-w-0 flex-1" />
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-6 px-8 py-8">
        {basics.summary ? (
          <section className="break-inside-avoid" data-pdf-page-break="">
            <p className="text-pretty text-[13px] leading-relaxed text-slate-700">{basics.summary}</p>
          </section>
        ) : null}

        {cv.credentials?.length ? (
          <section className="break-inside-avoid">
            <h2
              className="border-b border-indigo-200/80 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700"
              data-pdf-page-break=""
            >
              {t('credentials')}
            </h2>
            <div className="mt-4 space-y-4">
              {credentialIssuerOrder.map((issuer) => {
                const items = cv.credentials?.filter((c) => c.issuer === issuer) ?? []
                if (!items.length) return null
                return (
                  <div key={issuer}>
                    <div
                      className="flex items-center gap-2 text-[10px] font-semibold uppercase leading-none tracking-wider text-slate-500"
                      data-pdf-page-break=""
                    >
                      <CredentialIssuerIcon issuer={issuer} className="h-4 w-4 shrink-0 translate-y-px text-slate-600" />
                      {issuer === 'language'
                        ? t('languageExams')
                        : issuer === 'school'
                          ? t('education')
                        : issuer === 'other'
                          ? t('other')
                          : issuer === 'aws'
                            ? 'AWS'
                            : issuer.charAt(0).toUpperCase() + issuer.slice(1)}
                    </div>
                    <div className="mt-2 divide-y divide-slate-100">
                      {items.map((c) => (
                        <article
                          key={`${c.issuer}:${c.label}:${c.url}:${c.dateEarned ?? ''}:${c.dateExpires ?? ''}`}
                          className="py-2.5"
                          data-pdf-page-break=""
                          data-pdf-no-split=""
                        >
                          <div className="font-semibold text-slate-900" data-pdf-page-break="">
                            {c.label}
                          </div>
                          {hasPdfUrl(c.url) ? (
                            <div className={`mt-1.5 ${pdfIconRowClass}`} data-pdf-page-break="">
                              <Globe className={pdfLinkIconClass} aria-hidden="true" />
                              <PdfPrintUrlLine href={c.url} className="min-w-0 flex-1" />
                            </div>
                          ) : null}
                          {c.dateEarned || c.dateExpires ? (
                            <div
                              className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-none text-slate-600"
                              data-pdf-page-break=""
                            >
                              {c.dateEarned ? (
                                <span className={pdfIconRowSmClass}>
                                  <Calendar className="h-3 w-3 shrink-0 opacity-70" />
                                  <span>
                                    {t('earned')} {c.dateEarned}
                                  </span>
                                </span>
                              ) : null}
                              {c.dateExpires ? (
                                <span className={pdfIconRowSmClass}>
                                  <Calendar className="h-3 w-3 shrink-0 opacity-70" />
                                  <span>
                                    {t('expires')} {c.dateExpires}
                                  </span>
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ) : null}

        {cv.skills?.length ? (
          <section className="break-inside-avoid" data-pdf-page-break="">
            <h2 className="border-b border-indigo-200/80 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700">
              {t('skills')}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {cv.skills.map((s) => (
                <span key={s} className={pdfChipSmClass}>
                  {s}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {cv.languages?.length ? (
          <section className="break-inside-avoid" data-pdf-page-break="">
            <h2 className="border-b border-indigo-200/80 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700">
              {t('languages')}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {cv.languages.map((s) => (
                <span key={s} className={pdfChipSmClass}>
                  {s}
                </span>
              ))}
            </div>
          </section>
        ) : null}

        {cv.experience?.length ? (
          <section className="break-inside-avoid">
            <h2
              className="border-b border-indigo-200/80 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700"
              data-pdf-page-break=""
            >
              {t('experience')}
            </h2>
            <div className="mt-3 divide-y divide-slate-100">
              {cv.experience.map((x) => {
                const rowKey = stableExperienceKey(x)
                return (
                  <article key={rowKey} className="py-4" data-pdf-page-break="" data-pdf-no-split="">
                    {/* Stacked rows + per-row breaks so raster page slices do not cut through a single headline line */}
                    <div className="space-y-1 font-semibold leading-none text-slate-900">
                      <div data-pdf-page-break="">{x.role}</div>
                      <div className={pdfIconRowTightClass} data-pdf-page-break="">
                        <AtSign className="h-3.5 w-3.5 shrink-0 translate-y-px text-slate-400" aria-hidden="true" />
                        <span className="leading-none">{x.company}</span>
                      </div>
                    </div>
                    <div
                      className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-none text-slate-600"
                      data-pdf-page-break=""
                    >
                      <span className={pdfIconRowSmClass}>
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {x.start} – {x.end ?? t('present')}
                        </span>
                      </span>
                      {x.location ? (
                        <span className={pdfIconRowSmClass}>
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span>{x.location}</span>
                        </span>
                      ) : null}
                    </div>
                    {hasPdfUrl(x.companyUrl) || hasPdfUrl(x.companyLinkedInUrl) ? (
                      <div className="mt-2 space-y-2">
                        {hasPdfUrl(x.companyUrl) ? (
                          <div className={pdfIconRowClass} data-pdf-page-break="">
                            <Globe className={pdfLinkIconClass} aria-hidden="true" />
                            <PdfPrintUrlLine href={x.companyUrl} className="min-w-0 flex-1" />
                          </div>
                        ) : null}
                        {hasPdfUrl(x.companyLinkedInUrl) ? (
                          <div className={pdfIconRowClass} data-pdf-page-break="">
                            <SiLinkedinIcon className={pdfLinkIconClass} aria-hidden="true" />
                            <PdfPrintUrlLine href={x.companyLinkedInUrl} className="min-w-0 flex-1" />
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {x.highlights?.length ? (
                      <ul className="mt-3 list-disc space-y-1 pl-4 text-[13px] text-slate-700">
                        {x.highlights.map((h, i) => (
                          <li key={highlightChildKey(rowKey, i)} data-pdf-page-break="" data-pdf-no-split="">
                            {h}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {x.skills?.length ? (
                      <div className="mt-3" data-pdf-page-break="">
                        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                          {t('skills')}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {x.skills.map((skill) => (
                            <span key={`${rowKey}:skill:${skill}`} className={pdfChipSmClass}>
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}

        {cv.projects?.length ? (
          <section className="break-inside-avoid">
            <h2
              className="border-b border-indigo-200/80 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700"
              data-pdf-page-break=""
            >
              {t('projects')}
            </h2>
            <div className="mt-3 divide-y divide-slate-100">
              {cv.projects.map((p, projectIndex) => {
                const projectLinks = (p.links ?? []).filter((l) => hasPdfUrl(l.url))
                return (
                  <article
                    key={p.name}
                    className="py-4"
                    {...(projectIndex > 0 ? { 'data-pdf-page-break': '' } : {})}
                    data-pdf-no-split=""
                  >
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    {projectLinks.length ? (
                      <div className="mt-2 space-y-2">
                        {projectLinks.map((l) => {
                          const kind = inferProjectLinkLabelKind(l)
                          const Icon = kind === 'github' ? SiGithubIcon : Globe
                          return (
                            <div key={`${p.name}:${l.url}`} className={pdfIconRowClass}>
                              <Icon className={pdfLinkIconClass} aria-hidden="true" />
                              <PdfPrintUrlLine href={l.url} className="min-w-0 flex-1" />
                            </div>
                          )
                        })}
                      </div>
                    ) : null}
                    <p className="mt-2 text-[13px] text-slate-700">{p.description}</p>
                    {p.tags?.length ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {p.tags.map((tag) => (
                          <span key={tag} className={pdfChipSmClass}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}

        {cv.education?.length ? (
          <section className="break-inside-avoid">
            <h2
              className="border-b border-indigo-200/80 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-700"
              data-pdf-page-break=""
            >
              {t('education')}
            </h2>
            <div className="mt-3 divide-y divide-slate-100">
              {cv.education.map((e) => {
                const rowKey = stableEducationKey(e)
                const credential = educationCredentialLine(e)
                return (
                  <article key={rowKey} className="py-4" data-pdf-page-break="" data-pdf-no-split="">
                    {credential ? (
                      <div className="font-semibold text-slate-900" data-pdf-page-break="">
                        {credential}
                      </div>
                    ) : null}
                    <div
                      className={`font-semibold text-slate-900 ${credential ? 'mt-1' : ''}`}
                      data-pdf-page-break=""
                    >
                      {e.school}
                    </div>
                    {hasPdfUrl(e.schoolUrl) ? (
                      <div className={`mt-1.5 ${pdfIconRowClass}`} data-pdf-page-break="">
                        <Globe className={pdfLinkIconClass} aria-hidden="true" />
                        <PdfPrintUrlLine href={e.schoolUrl} className="min-w-0 flex-1" />
                      </div>
                    ) : null}
                    <div
                      className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs leading-none text-slate-600"
                      data-pdf-page-break=""
                    >
                      {e.location ? (
                        <span className={pdfIconRowSmClass}>
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span>{e.location}</span>
                        </span>
                      ) : null}
                      {e.start || e.end ? (
                        <span className={pdfIconRowSmClass}>
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          <span>
                            {e.start ?? ''} {e.start && e.end ? '–' : ''} {e.end ?? t('present')}
                          </span>
                        </span>
                      ) : null}
                    </div>
                    {e.highlights?.length ? (
                      <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-slate-700">
                        {e.highlights.map((h, i) => (
                          <li key={highlightChildKey(rowKey, i)} data-pdf-page-break="" data-pdf-no-split="">
                            {h}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                )
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
})
