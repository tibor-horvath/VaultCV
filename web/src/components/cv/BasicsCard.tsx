import type { CvBasics, CvLink } from '../../types/cv'
import { ExternalLink, Github, Linkedin, MapPin, Sparkles } from 'lucide-react'

function inferLinkKind(link: CvLink): 'github' | 'linkedin' | 'other' {
  const label = link.label.toLowerCase()
  if (label.includes('github')) return 'github'
  if (label.includes('linkedin')) return 'linkedin'

  try {
    const host = new URL(link.url).hostname.toLowerCase()
    if (host === 'github.com' || host.endsWith('.github.com')) return 'github'
    if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) return 'linkedin'
  } catch {
    // ignore
  }
  return 'other'
}

export function BasicsCard({
  basics,
  links,
}: {
  basics: CvBasics
  links?: CvLink[]
}) {
  const visibleLinks = (links ?? []).filter((l) => inferLinkKind(l) !== 'other')

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex flex-col gap-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            {basics.photoDataUrl ? (
              <img
                src={basics.photoDataUrl}
                alt={basics.photoAlt ?? `${basics.name} profile photo`}
                className="h-16 w-16 rounded-2xl object-cover shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/60"
                loading="lazy"
                decoding="async"
              />
            ) : null}
            <div>
              <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {basics.name}
              </div>
              <div className="mt-1 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Sparkles className="h-4 w-4" />
                {basics.headline}
              </div>
            </div>
          </div>
        </div>
        {basics.location ? (
          <div className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <MapPin className="h-4 w-4" />
            {basics.location}
          </div>
        ) : null}
      </div>

      {basics.summary ? (
        <p className="mt-4 max-w-prose text-pretty text-sm text-slate-700 dark:text-slate-300">
          {basics.summary}
        </p>
      ) : null}

      {visibleLinks.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleLinks.map((l) => {
            const kind = inferLinkKind(l)
            const Icon = kind === 'github' ? Github : kind === 'linkedin' ? Linkedin : ExternalLink
            const text = kind === 'github' ? 'GitHub' : kind === 'linkedin' ? 'LinkedIn' : l.label

            return (
              <a
                key={`${l.label}:${l.url}`}
                className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900/40"
                href={l.url}
                target="_blank"
                rel="noreferrer"
              >
                <Icon className="h-3.5 w-3.5 opacity-80 transition-opacity group-hover:opacity-100" />
                {text}
                <ExternalLink className="h-3.5 w-3.5 opacity-50 transition-opacity group-hover:opacity-100" />
              </a>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

