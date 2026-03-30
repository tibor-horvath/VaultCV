import type { CvEducation } from '../../types/cv'
import { highlightChildKey, stableEducationKey } from '../../lib/cvKeys'
import { Calendar, ExternalLink, MapPin } from 'lucide-react'
import { useI18n } from '../../lib/i18n'

function educationCredentialLine(e: CvEducation): string {
  return [e.degree, e.field].filter((s) => s != null && String(s).trim() !== '').join(' · ')
}

export function EducationList({ items }: { items: CvEducation[] }) {
  const { t } = useI18n()
  return (
    <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60 lg:grid lg:grid-cols-2 lg:gap-4 lg:divide-y-0">
      {items.map((e) => {
        const rowKey = stableEducationKey(e)
        const credential = educationCredentialLine(e)
        const program = e.program?.trim() ? e.program.trim() : null
        const hasMetaRow = Boolean(e.start || e.end || e.location || e.gpa || e.honors)
        return (
          <article className="py-3.5 lg:rounded-xl lg:border lg:border-slate-200/60 lg:p-3.5 dark:lg:border-slate-800/60" key={rowKey}>
            <div className="flex flex-col gap-1 sm:hidden">
              {credential ? (
                <div className="font-semibold text-slate-900 dark:text-slate-100">{credential}</div>
              ) : null}
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {e.schoolUrl ? (
                  <a
                    href={e.schoolUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-slate-900 underline decoration-slate-400/80 underline-offset-2 transition hover:text-slate-700 hover:decoration-slate-500 dark:text-slate-100 dark:decoration-slate-500 dark:hover:text-slate-200"
                    aria-label={`${e.school} ${t('website')} (${t('opensInNewTab')})`}
                  >
                    {e.school}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                  </a>
                ) : (
                  e.school
                )}
              </div>
              {program ? (
                <div className="text-sm text-slate-600 dark:text-slate-400">{program}</div>
              ) : null}
              {hasMetaRow ? (
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                  {e.start || e.end ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
                      {e.start ?? ''} {e.start && e.end ? '–' : ''} {e.end ?? t('present')}
                    </span>
                  ) : null}
                  {e.location ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
                      {e.location}
                    </span>
                  ) : null}
                  {e.gpa || e.honors ? (
                    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {e.gpa ? <span>{e.gpa}</span> : null}
                      {e.gpa && e.honors ? <span aria-hidden="true">·</span> : null}
                      {e.honors ? <span>{e.honors}</span> : null}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="hidden flex-col gap-1 sm:flex">
              {credential ? (
                <div className="font-semibold text-slate-900 dark:text-slate-100">{credential}</div>
              ) : null}
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {e.schoolUrl ? (
                  <a
                    href={e.schoolUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-slate-900 underline decoration-slate-400/80 underline-offset-2 transition hover:text-slate-700 hover:decoration-slate-500 dark:text-slate-100 dark:decoration-slate-500 dark:hover:text-slate-200"
                    aria-label={`${e.school} ${t('website')} (${t('opensInNewTab')})`}
                  >
                    {e.school}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                  </a>
                ) : (
                  e.school
                )}
              </div>
              {program ? (
                <div className="text-sm text-slate-600 dark:text-slate-400">{program}</div>
              ) : null}
              {hasMetaRow ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                  {e.start || e.end ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
                      {e.start ?? ''} {e.start && e.end ? '–' : ''} {e.end ?? t('present')}
                    </span>
                  ) : null}
                  {e.location ? (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
                      {e.location}
                    </span>
                  ) : null}
                  {e.gpa || e.honors ? (
                    <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      {e.gpa ? <span>{e.gpa}</span> : null}
                      {e.gpa && e.honors ? <span aria-hidden="true">·</span> : null}
                      {e.honors ? <span>{e.honors}</span> : null}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
            {e.thesisTitle ? (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">{t('educationThesis')}:</span>{' '}
                {e.thesisTitle}
              </p>
            ) : null}
            {e.advisor ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">{t('educationAdvisor')}:</span>{' '}
                {e.advisor}
              </p>
            ) : null}
            {e.highlights?.length ? (
              <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {e.highlights.map((h, i) => (
                  <li key={highlightChildKey(rowKey, i)}>{h}</li>
                ))}
              </ul>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
