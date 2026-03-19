import type { CvExperience } from '../../types/cv'
import { Calendar, Linkedin, MapPin } from 'lucide-react'
import { SkillsChips } from './SkillsChips'

export function ExperienceList({ items }: { items: CvExperience[] }) {
  return (
    <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
      {items.map((x, idx) => (
        <article
          key={`${idx}:${x.company}:${x.role}:${x.start}`}
          className="py-3.5"
        >
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
                {x.companyLinkedInUrl ? (
                  <a
                    className="ml-2 inline-flex align-middle text-slate-500 transition hover:text-[#0a66c2] dark:text-slate-400 dark:hover:text-[#0a66c2]"
                    href={x.companyLinkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${x.company} on LinkedIn`}
                    title={`${x.company} on LinkedIn`}
                  >
                    <Linkedin className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                ) : null}
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
            <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {x.highlights.map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          ) : null}
          {x.skills?.length ? (
            <div className="mt-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                Skills
              </div>
              <SkillsChips items={x.skills} />
            </div>
          ) : null}
        </article>
      ))}
    </div>
  )
}

