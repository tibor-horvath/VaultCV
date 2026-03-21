import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BriefcaseBusiness,
  Calendar,
  CircleAlert,
  GraduationCap,
  Hourglass,
  Languages,
  LayoutGrid,
  LibraryBig,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
} from 'lucide-react'
import { BasicsCard } from '../components/cv/BasicsCard'
import { FloatingBasicsMenu } from '../components/cv/FloatingBasicsMenu'
import { EducationList } from '../components/cv/EducationList'
import { ExperienceList } from '../components/cv/ExperienceList'
import { ProjectsGrid } from '../components/cv/ProjectsGrid'
import { Section } from '../components/cv/Section'
import { SkillsChips } from '../components/cv/SkillsChips'
import { SiGoogleIcon } from '../components/icons/SimpleBrandIcons'
import { fetchCv } from '../lib/api'
import { fetchPublicProfile } from '../lib/publicProfile'
import type { CvCredentialIssuer, CvData } from '../types/cv'
import { applyTheme, setStoredTheme, type ThemePreference } from '../lib/theme'
import { resolveInitialThemeForMode } from '../lib/themePreference'
import { useDocumentFavicon } from '../lib/favicon'

function MicrosoftMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect x="3" y="3" width="8" height="8" rx="1.5" fill="currentColor" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.9" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.85" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

function AwsMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path
        fill="currentColor"
        d="M4.25 16.6c2.4 1.76 5.2 2.65 8.05 2.65 3.2 0 6.2-1.1 8.45-2.98.26-.2.03-.62-.29-.45-2.44 1.27-5.3 1.95-8.15 1.95-2.6 0-5.2-.64-7.57-1.87-.34-.18-.66.24-.49.7ZM19.16 15.64c-.33-.44-2.17-.2-3 .07-.25.08-.29-.19-.06-.35 1.47-1.03 3.89-.73 4.17-.38.27.35-.07 2.77-1.44 3.91-.21.17-.41.08-.32-.15.29-.76.92-2.44.65-3.1Z"
      />
      <path
        fill="currentColor"
        d="M7.34 9.58c.14-.19.38-.31.63-.31h2.03c.24 0 .44.12.53.33l3.16 7.53c.07.18.02.38-.12.51l-1.03.96c-.15.14-.38.14-.53.02l-.83-.73a.383.383 0 0 1-.12-.18l-.65-1.58H7.74l-.6 1.45c-.06.16-.22.26-.39.26H5.3c-.31 0-.51-.33-.38-.62L7.34 9.58Zm1.02 2.17-.9 2.17h1.84l-.94-2.17Z"
        opacity="0.9"
      />
    </svg>
  )
}

const credentialIssuerOrder: CvCredentialIssuer[] = ['microsoft', 'aws', 'google', 'language', 'other']

const credentialIssuerLabel: Record<CvCredentialIssuer, string> = {
  microsoft: 'Microsoft',
  aws: 'AWS',
  google: 'Google',
  language: 'Language Exams',
  other: 'Other',
}

function CredentialIssuerIcon({ issuer }: { issuer: CvCredentialIssuer }) {
  const cls = 'h-4 w-4 opacity-80'
  if (issuer === 'microsoft') return <MicrosoftMark className={cls} />
  if (issuer === 'aws') return <AwsMark className={cls} />
  if (issuer === 'google') return <SiGoogleIcon className={cls} aria-hidden="true" focusable="false" />
  if (issuer === 'language') return <Languages className={cls} />
  return <ShieldCheck className={cls} />
}

export function CvRoute() {
  const [params] = useSearchParams()
  const token = params.get('t') ?? ''
  const [theme, setTheme] = useState<ThemePreference>(() => {
    const isMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_CV === '1'
    return resolveInitialThemeForMode(isMock)
  })
  const [state, setState] = useState<
    | { kind: 'locked' }
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'ready'; cv: CvData }
  >(token ? { kind: 'loading' } : { kind: 'locked' })

  const [publicName, setPublicName] = useState(() => {
    const envName = (import.meta.env.VITE_PUBLIC_NAME as string | undefined)?.trim()
    return envName || 'CV'
  })

  const basicsSentinelRef = useRef<HTMLDivElement | null>(null)
  const [isBasicsInView, setIsBasicsInView] = useState(true)

  useEffect(() => {
    // Browser tab title derived from public profile name.
    document.title = publicName === 'CV' ? 'CV' : `${publicName} CV`
  }, [publicName])

  useEffect(() => {
    let cancelled = false

    async function loadPublicProfileName() {
      try {
        const payload = await fetchPublicProfile()
        const name = payload.name?.trim() ?? ''
        if (!name || cancelled) return

        setPublicName(name)
      } catch {
        // Ignore; we can still fall back to VITE_PUBLIC_NAME.
      }
    }

    loadPublicProfileName()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!token) {
        setState({ kind: 'locked' })
        return
      }

      setState({ kind: 'loading' })
      const res = await fetchCv(token)
      if (cancelled) return

      if (!res.ok) {
        setState({ kind: 'error', message: res.message })
        return
      }

      setState({ kind: 'ready', cv: res.data })
    }

    run()
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    applyTheme(theme)
    setStoredTheme(theme)
  }, [theme])

  useEffect(() => {
    if (state.kind !== 'ready') {
      return
    }

    const el = basicsSentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsBasicsInView(entry.isIntersecting)
      },
      { threshold: 0.01 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [state.kind])

  const faviconName =
    state.kind === 'ready' ? (state.cv.basics.name?.trim() || publicName) : publicName
  useDocumentFavicon(faviconName)

  const themeToggle = (
    <button
      type="button"
      onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900"
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  )

  return (
    <div className="space-y-6 lg:pt-20">
      {state.kind === 'locked' ? (
        <Section title="Locked" icon={<Lock className="h-4 w-4" />}>
          <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Scan your QR code to open this page with a token parameter:{' '}
            <span className="font-mono">/cv?t=TOKEN</span>
          </div>
        </Section>
      ) : null}

      {state.kind === 'loading' ? (
        <Section title="Loading" icon={<Hourglass className="h-4 w-4" />}>
          <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Verifying token and loading CV…
          </div>
        </Section>
      ) : null}

      {state.kind === 'error' ? (
        <Section title="Unable to load" icon={<CircleAlert className="h-4 w-4" />}>
          <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{state.message}</div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            If you expected access, confirm your token is correct and that the server has
            <span className="font-mono"> CV_ACCESS_TOKEN</span> and <span className="font-mono">CV_JSON</span>{' '}
            configured.
          </div>
        </Section>
      ) : null}

      {state.kind === 'ready' ? (
        <div className="space-y-6">
          <div ref={basicsSentinelRef}>
            <BasicsCard basics={state.cv.basics} links={state.cv.links} headerRight={themeToggle} />
          </div>

          {!isBasicsInView ? <FloatingBasicsMenu basics={state.cv.basics} links={state.cv.links} /> : null}

          {state.cv.credentials?.length ? (
            <Section title="Credentials" icon={<ShieldCheck className="h-4 w-4" />}>
              <div className="space-y-4">
                {credentialIssuerOrder
                  .map((issuer) => {
                    const items = state.cv.credentials?.filter((c) => c.issuer === issuer) ?? []
                    if (!items.length) return null
                    return (
                      <div key={issuer}>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                          <CredentialIssuerIcon issuer={issuer} />
                          {credentialIssuerLabel[issuer]}
                        </div>
                        <div className="mt-2 divide-y divide-slate-200/60 dark:divide-slate-800/60">
                          {items.map((c) => (
                            <article
                              key={`${c.issuer}:${c.label}:${c.url}:${c.dateEarned ?? ''}:${c.dateExpires ?? ''}`}
                              className="py-3.5"
                            >
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                                <div className="min-w-0">
                                  <a
                                    className="font-semibold text-slate-900 underline underline-offset-4 decoration-slate-300 hover:decoration-slate-500 dark:text-slate-100 dark:decoration-slate-700 dark:hover:decoration-slate-500"
                                    href={c.url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {c.label}
                                  </a>

                                  {c.dateEarned || c.dateExpires ? (
                                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
                                      {c.dateEarned ? (
                                        <span className="inline-flex items-center gap-1.5">
                                          <Calendar className="h-3.5 w-3.5 opacity-80" />
                                          Earned {c.dateEarned}
                                        </span>
                                      ) : null}
                                      {c.dateExpires ? (
                                        <span className="inline-flex items-center gap-1.5">
                                          <Calendar className="h-3.5 w-3.5 opacity-80" />
                                          Expires {c.dateExpires}
                                        </span>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    )
                  })
                  .filter(Boolean)}
              </div>
            </Section>
          ) : null}

          {state.cv.skills?.length ? (
            <Section title="Skills" icon={<LibraryBig className="h-4 w-4" />}>
              <SkillsChips items={state.cv.skills} />
            </Section>
          ) : null}

          {state.cv.languages?.length ? (
            <Section title="Languages" icon={<Languages className="h-4 w-4" />}>
              <SkillsChips items={state.cv.languages} />
            </Section>
          ) : null}

          {state.cv.experience?.length ? (
            <Section title="Experience" icon={<BriefcaseBusiness className="h-4 w-4" />}>
              <ExperienceList items={state.cv.experience} />
            </Section>
          ) : null}

          {state.cv.projects?.length ? (
            <Section title="Projects" icon={<LayoutGrid className="h-4 w-4" />}>
              <ProjectsGrid items={state.cv.projects} />
            </Section>
          ) : null}

          {state.cv.education?.length ? (
            <Section title="Education" icon={<GraduationCap className="h-4 w-4" />}>
              <EducationList items={state.cv.education} />
            </Section>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

