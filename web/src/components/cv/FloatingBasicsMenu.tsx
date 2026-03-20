import type { CvBasics, CvLink } from '../../types/cv'
import { Github, Linkedin, Mail } from 'lucide-react'
import { buildPhotoSrc, inferLinkKind } from '../../lib/cvPresentation'

export function FloatingBasicsMenu({ basics, links }: { basics: CvBasics; links?: CvLink[] }) {
  const visibleLinks = (links ?? []).filter((l) => inferLinkKind(l) !== 'other')
  const github = visibleLinks.find((l) => inferLinkKind(l) === 'github')
  const linkedin = visibleLinks.find((l) => inferLinkKind(l) === 'linkedin')

  return (
    <div
      className="pointer-events-none fixed inset-x-0 overflow-x-hidden z-50"
      style={{
        top: 'max(env(safe-area-inset-top), 0.5rem)',
        paddingLeft: 'max(env(safe-area-inset-left), 0.25rem)',
        paddingRight: 'max(env(safe-area-inset-right), 0.25rem)',
      }}
    >
      {/* Match AppShell footer outer padding/sizing */}
      <div className="pointer-events-auto mx-auto w-full max-w-[calc(100vw-0.5rem)] sm:max-w-sm overflow-hidden pb-1.5">
        <div className="flex w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/75 box-border px-2 py-1.5 text-sm text-slate-600 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.55)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/35 dark:text-slate-300">
          <div className="flex min-w-0 items-center gap-2">
            <img
              src={buildPhotoSrc(basics)}
              alt={basics.photoAlt ?? `${basics.name} profile photo`}
              className="h-6 w-6 rounded-2xl object-cover shadow-none ring-0"
              loading="lazy"
              decoding="async"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                {basics.name}
              </div>
            </div>
          </div>

          <div className="flex flex-nowrap items-center justify-end gap-1">
            {github ? (
              <a
                className="inline-flex items-center justify-center rounded-full border border-slate-200/90 bg-white p-1 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-950/75 dark:text-slate-200 dark:hover:bg-slate-900"
                href={github.url}
                target="_blank"
                rel="noreferrer"
              >
                <Github className="h-3.5 w-3.5 opacity-80" />
              </a>
            ) : null}

            {linkedin ? (
              <a
                className="inline-flex items-center justify-center rounded-full border border-slate-200/90 bg-white p-1 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-950/75 dark:text-slate-200 dark:hover:bg-slate-900"
                href={linkedin.url}
                target="_blank"
                rel="noreferrer"
              >
                <Linkedin className="h-3.5 w-3.5 opacity-80" />
              </a>
            ) : null}

            {basics.email ? (
              <a
                className="inline-flex items-center justify-center rounded-full border border-slate-200/90 bg-white p-1 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-950/75 dark:text-slate-200 dark:hover:bg-slate-900"
                href={`mailto:${basics.email}`}
              >
                <Mail className="h-3.5 w-3.5 opacity-80" />
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

