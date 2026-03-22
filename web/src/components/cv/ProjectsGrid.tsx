import { ExternalLink, Globe } from 'lucide-react'
import { inferProjectLinkLabelKind } from '../../lib/cvPresentation'
import type { CvProject } from '../../types/cv'
import { SiGithubIcon } from '../icons/SimpleBrandIcons'
import { SkillsChips } from './SkillsChips'

export function ProjectsGrid({ items }: { items: CvProject[] }) {
  return (
    <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
      {items.map((p) => {
        const links = p.links ?? []
        const iconLinks = links.filter((l) => inferProjectLinkLabelKind(l) !== 'other')
        const textLinks = links.filter((l) => inferProjectLinkLabelKind(l) === 'other')

        return (
          <article
            key={p.name}
            className="py-3.5"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
              <div className="min-w-0 font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
              {iconLinks.map((l) => {
                const kind = inferProjectLinkLabelKind(l)
                const Icon = kind === 'github' ? SiGithubIcon : Globe
                const text = kind === 'github' ? 'GitHub' : 'Web'
                return (
                  <a
                    key={`${p.name}:${kind}:${l.url}`}
                    className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700/70 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900 dark:focus:ring-offset-slate-950"
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${p.name}: ${text} (opens in new tab)`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-80 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                    <span>{text}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  </a>
                )
              })}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{p.description}</p>
            {p.tags?.length ? (
              <div className="mt-3">
                <SkillsChips items={p.tags} />
              </div>
            ) : null}
            {textLinks.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {textLinks.map((l) => (
                  <a
                    key={`${p.name}:${l.url}`}
                    className="text-xs font-medium text-slate-700 underline underline-offset-4 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:text-slate-300 dark:hover:text-white dark:focus:ring-offset-slate-950"
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${p.name}: ${l.label} (opens in new tab)`}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}

