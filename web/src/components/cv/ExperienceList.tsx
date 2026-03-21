import type { CvExperience } from '../../types/cv'
import { AtSign, Calendar, ExternalLink, MapPin } from 'lucide-react'
import { SiLinkedinIcon } from '../icons/SimpleBrandIcons'
import { SkillsChips } from './SkillsChips'

const linkPillClassName =
  'group inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700/70 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900'

function CompanyUrlPills({ x }: { x: CvExperience }) {
  return (
    <>
      {x.companyUrl ? (
        <a
          className={linkPillClassName}
          href={x.companyUrl}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink className="h-3.5 w-3.5 opacity-80 transition-opacity group-hover:opacity-100" />
          Website
          <ExternalLink className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover:opacity-100" />
        </a>
      ) : null}
      {x.companyLinkedInUrl ? (
        <a
          className={linkPillClassName}
          href={x.companyLinkedInUrl}
          target="_blank"
          rel="noreferrer"
        >
          <SiLinkedinIcon className="h-3.5 w-3.5 opacity-80 transition-opacity group-hover:opacity-100" />
          LinkedIn
          <ExternalLink className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover:opacity-100" />
        </a>
      ) : null}
    </>
  )
}

export function ExperienceList({ items }: { items: CvExperience[] }) {
  return (
    <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
      {items.map((x, idx) => (
        <article
          key={`${idx}:${x.company}:${x.role}:${x.start}`}
          className="py-3.5"
        >
          {/* Mobile: role / @ company / dates / location */}
          <div className="flex flex-col gap-1 sm:hidden">
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {x.role}
            </div>
            <div className="inline-flex flex-wrap items-center gap-x-1.5 text-sm text-slate-700 dark:text-slate-300">
              <AtSign className="h-3.5 w-3.5 shrink-0 self-center opacity-80" aria-hidden="true" />
              <span className="font-semibold text-slate-900 dark:text-slate-100">{x.company}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
              {x.start} – {x.end ?? 'Present'}
            </div>
            {x.location ? (
              <div className="inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
                {x.location}
              </div>
            ) : null}
            {x.companyUrl || x.companyLinkedInUrl ? (
              <div className="flex flex-wrap items-center gap-2">
                <CompanyUrlPills x={x} />
              </div>
            ) : null}
          </div>

          {/* Desktop: role @ company — then dates + location */}
          <div className="hidden flex-col gap-1 sm:flex">
            <div className="inline-flex flex-wrap items-baseline gap-x-1.5 font-semibold text-slate-900 dark:text-slate-100">
              <span>{x.role}</span>
              <AtSign className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
              <span>{x.company}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
                {x.start} – {x.end ?? 'Present'}
              </span>
              {x.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden="true" />
                  {x.location}
                </span>
              ) : null}
              {x.companyUrl || x.companyLinkedInUrl ? (
                <span className="inline-flex flex-wrap items-center gap-2">
                  <CompanyUrlPills x={x} />
                </span>
              ) : null}
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

