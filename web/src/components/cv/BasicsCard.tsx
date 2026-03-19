import type { CvBasics, CvLink } from '../../types/cv'
import type { ReactNode } from 'react'
import { ExternalLink, Github, Linkedin, Mail, MapPin, Sparkles } from 'lucide-react'

function getInitials(name: string) {
  const trimmed = name.trim()
  if (!trimmed) return 'CV'
  // Grab the first alphanumeric character to keep the output stable.
  const match = trimmed.match(/[A-Za-z0-9]/)
  return (match?.[0] ?? trimmed[0] ?? 'C').toUpperCase()
}

function getFallbackPhotoDataUrl(name: string) {
  const initial = getInitials(name)
  // CSP allows `img-src 'self' data:` so a data-url SVG is a safe default.
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#a855f7"/>
            <stop offset="0.5" stop-color="#6366f1"/>
            <stop offset="1" stop-color="#0ea5e9"/>
          </linearGradient>
        </defs>
        <rect width="256" height="256" rx="64" fill="url(#g)"/>
        <circle cx="128" cy="108" r="48" fill="rgba(255,255,255,0.92)"/>
        <text x="128" y="128" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="64" font-weight="700" fill="#0f172a">${initial}</text>
        <path d="M56 220c10-44 44-68 72-68s62 24 72 68" fill="rgba(255,255,255,0.92)"/>
      </svg>`,
    )
  )
}

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
  headerRight,
}: {
  basics: CvBasics
  links?: CvLink[]
  headerRight?: ReactNode
}) {
  const visibleLinks = (links ?? []).filter((l) => inferLinkKind(l) !== 'other')

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.55)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/35 sm:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex-shrink-0">
          <img
            src={basics.photoDataUrl ?? getFallbackPhotoDataUrl(basics.name)}
            alt={basics.photoAlt ?? `${basics.name} profile photo`}
            className="h-48 w-48 rounded-3xl object-cover shadow-none ring-0 sm:h-56 sm:w-56"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
                {basics.name}
              </div>
              <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/75 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-300">
                <Sparkles className="h-4 w-4" />
                {basics.headline}
              </div>
            </div>

            {headerRight ? <div className="pt-1">{headerRight}</div> : null}
          </div>

          {basics.location ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <MapPin className="h-4 w-4" />
              {basics.location}
            </div>
          ) : null}

          {basics.email ? (
            <a
              href={`mailto:${basics.email}`}
              className="mt-2 flex w-fit items-center gap-2 text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <Mail className="h-4 w-4" />
              {basics.email}
            </a>
          ) : null}

          {basics.summary ? (
            <p className="mt-4 max-w-3xl text-pretty text-sm leading-relaxed text-slate-700 dark:text-slate-300">
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
                    className="group inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700/70 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900"
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
      </div>
    </div>
  )
}

