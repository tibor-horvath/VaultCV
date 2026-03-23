import type { CvExperience } from '../../types/cv'
import { highlightChildKey, stableExperienceKey } from '../../lib/cvKeys'
import { AtSign, Calendar, ExternalLink, MapPin } from 'lucide-react'
import { SiLinkedinIcon } from '../icons/SimpleBrandIcons'
import { SkillsChips } from './SkillsChips'
import { useI18n } from '../../lib/i18n'

const linkPillClassName =
  'group inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700/70 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900 dark:focus:ring-offset-slate-950'

const calendarIconClass = 'h-3.5 w-3.5 shrink-0 opacity-80'
const mapPinIconClass = 'h-3.5 w-3.5 shrink-0 opacity-80'

function CompanyUrlPills({ x }: { x: CvExperience }) {
  const { t } = useI18n()
  return (
    <>
      {x.companyUrl ? (
        <a
          className={linkPillClassName}
          href={x.companyUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${x.company} ${t('website')} (${t('opensInNewTab')})`}
        >
          <ExternalLink
            className="h-3.5 w-3.5 shrink-0 opacity-80 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
          <span>{t('website')}</span>
        </a>
      ) : null}
      {x.companyLinkedInUrl ? (
        <a
          className={linkPillClassName}
          href={x.companyLinkedInUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${x.company} ${t('linkedIn')} (${t('opensInNewTab')})`}
        >
          <SiLinkedinIcon
            className="h-3.5 w-3.5 shrink-0 opacity-80 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
          <span>{t('linkedIn')}</span>
          <ExternalLink
            className="h-3.5 w-3.5 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </a>
      ) : null}
    </>
  )
}

function ExperienceDateRange({ x }: { x: CvExperience }) {
  const { t } = useI18n()
  return (
    <>
      <Calendar className={calendarIconClass} aria-hidden="true" />
      {x.start} – {x.end ?? t('present')}
    </>
  )
}

function ExperienceLocation({ location }: { location: string }) {
  return (
    <>
      <MapPin className={mapPinIconClass} aria-hidden="true" />
      {location}
    </>
  )
}

function ExperienceHeadline({ x, variant }: { x: CvExperience; variant: 'mobile' | 'desktop' }) {
  if (variant === 'mobile') {
    return (
      <>
        <div className="font-semibold text-slate-900 dark:text-slate-100">{x.role}</div>
        <div className="inline-flex flex-wrap items-center gap-x-1.5 text-sm text-slate-700 dark:text-slate-300">
          <AtSign className="h-3.5 w-3.5 shrink-0 self-center opacity-80" aria-hidden="true" />
          <span className="font-semibold text-slate-900 dark:text-slate-100">{x.company}</span>
        </div>
      </>
    )
  }
  return (
    <div className="inline-flex flex-wrap items-baseline gap-x-1.5 font-semibold text-slate-900 dark:text-slate-100">
      <span>{x.role}</span>
      <AtSign className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
      <span>{x.company}</span>
    </div>
  )
}

function ExperienceItem({ x }: { x: CvExperience }) {
  const { t } = useI18n()
  const rowKey = stableExperienceKey(x)
  const hasCompanyLinks = Boolean(x.companyUrl || x.companyLinkedInUrl)

  return (
    <article className="py-3.5">
      <div className="flex flex-col gap-1 sm:hidden">
        <ExperienceHeadline x={x} variant="mobile" />
        <div className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
          <ExperienceDateRange x={x} />
        </div>
        {x.location ? (
          <div className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
            <ExperienceLocation location={x.location} />
          </div>
        ) : null}
        {hasCompanyLinks ? (
          <div className="flex flex-wrap items-center gap-2">
            <CompanyUrlPills x={x} />
          </div>
        ) : null}
      </div>

      <div className="hidden flex-col gap-1 sm:flex">
        <ExperienceHeadline x={x} variant="desktop" />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <ExperienceDateRange x={x} />
          </span>
          {x.location ? (
            <span className="inline-flex items-center gap-1.5">
              <ExperienceLocation location={x.location} />
            </span>
          ) : null}
          {hasCompanyLinks ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              <CompanyUrlPills x={x} />
            </span>
          ) : null}
        </div>
      </div>
      {x.highlights?.length ? (
        <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {x.highlights.map((h, i) => (
            <li key={highlightChildKey(rowKey, i)}>{h}</li>
          ))}
        </ul>
      ) : null}
      {x.skills?.length ? (
        <div className="mt-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
            {t('skills')}
          </div>
          <SkillsChips items={x.skills} />
        </div>
      ) : null}
    </article>
  )
}

export function ExperienceList({ items }: { items: CvExperience[] }) {
  return (
    <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
      {items.map((x) => (
        <ExperienceItem key={stableExperienceKey(x)} x={x} />
      ))}
    </div>
  )
}
