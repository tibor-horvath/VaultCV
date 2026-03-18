import type { CvExperience } from '../../types/cv'
import { Calendar, MapPin } from 'lucide-react'

export function ExperienceList({ items }: { items: CvExperience[] }) {
  return (
    <div className="space-y-4">
      {items.map((x) => (
        <article key={`${x.company}:${x.role}:${x.start}`} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-900/30">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {x.role} ·{' '}
                {x.companyUrl ? (
                  <a
                    className="underline underline-offset-4 decoration-slate-300 hover:decoration-slate-500 dark:decoration-slate-700 dark:hover:decoration-slate-500"
                    href={x.companyUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {x.company}
                  </a>
                ) : (
                  x.company
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                {x.location ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 opacity-80" />
                    {x.location}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 opacity-80" />
                  {x.start} – {x.end ?? 'Present'}
                </span>
              </div>
            </div>
          </div>
          {x.highlights?.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
              {x.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          ) : null}
        </article>
      ))}
    </div>
  )
}

