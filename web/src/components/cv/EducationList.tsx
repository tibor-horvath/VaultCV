import type { CvEducation } from '../../types/cv'
import { highlightChildKey, stableEducationKey } from '../../lib/cvKeys'
import { Calendar, ExternalLink, MapPin } from 'lucide-react'
import { useI18n } from '../../lib/i18n'

function educationCredentialLine(e: CvEducation): string {
  return [e.degree, e.field].filter((s) => s != null && String(s).trim() !== '').join(' · ')
}

function EducationItem({ e }: { e: CvEducation }) {
  const { t } = useI18n()
  const rowKey = stableEducationKey(e)
  const credential = educationCredentialLine(e)
  const program = e.program?.trim() ? e.program.trim() : null
  const dates = e.start || e.end ? `${e.start ?? ''}${e.start && e.end ? ' – ' : ''}${e.end ?? t('present')}` : null

  return (
    <article className="py-4 first:pt-0 last:pb-0 lg:py-0">
      {credential ? <h3 className="text-sm font-semibold text-ink">{credential}</h3> : null}

      <p className="mt-1 text-sm font-medium text-ink-muted">
        {e.schoolUrl ? (
          <a
            href={e.schoolUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="vc-focusable inline-flex items-center gap-1.5 rounded-sm hover:text-ink"
            aria-label={`${e.school} ${t('website')} (${t('opensInNewTab')})`}
          >
            {e.school}
            <ExternalLink className="h-3 w-3 shrink-0 text-ink-subtle" aria-hidden="true" />
          </a>
        ) : (
          e.school
        )}
      </p>

      {program ? <p className="mt-0.5 text-xs text-ink-subtle">{program}</p> : null}

      {dates || e.location || e.gpa || e.honors ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-subtle">
          {dates ? (
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {dates}
            </span>
          ) : null}
          {e.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {e.location}
            </span>
          ) : null}
          {e.gpa ? <span>{e.gpa}</span> : null}
          {e.honors ? <span>{e.honors}</span> : null}
        </div>
      ) : null}

      {e.thesisTitle ? (
        <p className="mt-2 text-xs text-ink-muted">
          <span className="font-semibold">{t('educationThesis')}:</span> {e.thesisTitle}
        </p>
      ) : null}
      {e.advisor ? (
        <p className="mt-0.5 text-xs text-ink-muted">
          <span className="font-semibold">{t('educationAdvisor')}:</span> {e.advisor}
        </p>
      ) : null}

      {e.highlights?.length ? (
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-ink-muted">
          {e.highlights.map((h, i) => (
            <li key={highlightChildKey(rowKey, i)} className="relative pl-4">
              <span className="absolute left-0 top-[0.5625rem] h-1 w-1 rounded-full bg-line-strong" aria-hidden="true" />
              {h}
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  )
}

export function EducationList({ items }: { items: CvEducation[] }) {
  return (
    <div className="divide-y divide-line lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-6 lg:divide-y-0">
      {items.map((e) => (
        <EducationItem key={stableEducationKey(e)} e={e} />
      ))}
    </div>
  )
}
