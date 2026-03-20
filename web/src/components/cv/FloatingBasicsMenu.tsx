import type { CvBasics, CvLink } from '../../types/cv'
import { Github, Linkedin, Mail } from 'lucide-react'

function getFallbackPhotoDataUrl() {
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
        <path d="M56 220c10-44 44-68 72-68s62 24 72 68" fill="rgba(255,255,255,0.92)"/>
      </svg>`,
    )
  )
}

function buildPhotoSrc(basics: CvBasics) {
  if (basics.photoBase64) {
    const mimeType = basics.photoMimeType ?? 'image/jpeg'
    return `data:${mimeType};base64,${basics.photoBase64}`
  }

  return getFallbackPhotoDataUrl()
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
    // ignore invalid URLs
  }

  return 'other'
}

export function FloatingBasicsMenu({ basics, links }: { basics: CvBasics; links?: CvLink[] }) {
  const visibleLinks = (links ?? []).filter((l) => inferLinkKind(l) !== 'other')
  const github = visibleLinks.find((l) => inferLinkKind(l) === 'github')
  const linkedin = visibleLinks.find((l) => inferLinkKind(l) === 'linkedin')

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
      {/* Match AppShell footer outer padding/sizing */}
      <div className="pointer-events-auto mx-auto w-full max-w-sm px-1 pb-1.5 sm:px-1 lg:px-1">
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/75 px-2 py-1.5 text-sm text-slate-600 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.55)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/35 dark:text-slate-300">
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

