import type { CvEducation } from '../../types/cv'
import { highlightChildKey, stableEducationKey } from '../../lib/cvKeys'
import { Calendar, MapPin } from 'lucide-react'

export function EducationList({ items }: { items: CvEducation[] }) {
  return (
    <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
      {items.map((e) => {
        const rowKey = stableEducationKey(e)
        return (
          <article key={rowKey} className="py-3.5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <div className="font-semibold text-slate-900 dark:text-slate-100">{e.program} · {e.school}</div>
                {e.start || e.end || e.location ? (
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                    {e.location ? (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
                        {e.location}
                      </span>
                    ) : null}
                    {e.start || e.end ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
                        {e.start ?? ''} {e.start && e.end ? '–' : ''} {e.end ?? 'Present'}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
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

