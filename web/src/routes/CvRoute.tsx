import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  BadgeCheck,
  BriefcaseBusiness,
  CircleAlert,
  GraduationCap,
  Hourglass,
  LayoutGrid,
  Lock,
  Languages,
  Moon,
  Sun,
  Wrench,
} from 'lucide-react'
import { BasicsCard } from '../components/cv/BasicsCard'
import { FloatingBasicsMenu } from '../components/cv/FloatingBasicsMenu'
import { EducationList } from '../components/cv/EducationList'
import { ExperienceList } from '../components/cv/ExperienceList'
import { ProjectsGrid } from '../components/cv/ProjectsGrid'
import { Section } from '../components/cv/Section'
import { SkillsChips } from '../components/cv/SkillsChips'
import { fetchCv } from '../lib/api'
import { fetchPublicProfile } from '../lib/publicProfile'
import type { CvCredentialIssuer, CvData } from '../types/cv'
import { applyTheme, setStoredTheme, type ThemePreference } from '../lib/theme'
import { resolveInitialThemeForMode } from '../lib/themePreference'

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

function GoogleMark({ className }: { className?: string }) {
  // Simple mono mark to avoid heavy multi-color SVGs; still recognizable as "G".
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
      <path
        fill="currentColor"
        d="M12 5.6c1.5 0 2.87.52 3.96 1.54l1.55-1.55C16.1 4.28 14.18 3.5 12 3.5 8.09 3.5 4.78 5.74 3.16 9.0l1.98 1.53C6.23 7.58 8.86 5.6 12 5.6Z"
        opacity="0.85"
      />
      <path
        fill="currentColor"
        d="M21 12.2c0-.62-.06-1.08-.18-1.55H12v2.86h5.14c-.1.72-.66 1.8-1.9 2.53l1.84 1.43C19.03 16.23 21 14.12 21 12.2Z"
      />
      <path
        fill="currentColor"
        d="M5.14 13.0c-.18-.54-.28-1.12-.28-1.72 0-.6.1-1.18.28-1.72L3.16 8.03A8.56 8.56 0 0 0 2.5 11.3c0 1.43.35 2.79.66 3.27L5.14 13Z"
        opacity="0.75"
      />
      <path
        fill="currentColor"
        d="M12 20.1c2.18 0 4.01-.72 5.34-1.96l-1.84-1.43c-.49.35-1.44.74-3.5.74-3.1 0-5.73-1.97-6.86-4.93L3.16 14.57C4.79 17.86 8.09 20.1 12 20.1Z"
        opacity="0.85"
      />
    </svg>
  )
}

const credentialIssuerOrder: CvCredentialIssuer[] = ['microsoft', 'aws', 'google', 'other']

const credentialIssuerLabel: Record<CvCredentialIssuer, string> = {
  microsoft: 'Microsoft',
  aws: 'AWS',
  google: 'Google',
  other: 'Other',
}

function CredentialIssuerIcon({ issuer }: { issuer: CvCredentialIssuer }) {
  const cls = 'h-4 w-4 opacity-80'
  if (issuer === 'microsoft') return <MicrosoftMark className={cls} />
  if (issuer === 'aws') return <AwsMark className={cls} />
  if (issuer === 'google') return <GoogleMark className={cls} />
  return <BadgeCheck className={cls} />
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
    document.title = publicName === 'CV' ? 'CV' : `${publicName} + CV`
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
            <Section title="Credentials" icon={<BadgeCheck className="h-4 w-4" />}>
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
                        <div className="mt-2 flex flex-wrap gap-2">
                          {items.map((c) => (
                            <a
                              key={`${c.issuer}:${c.label}:${c.url}`}
                              className="inline-flex items-center rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-950/75 dark:text-slate-200 dark:hover:bg-slate-900"
                              href={c.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {c.label}
                            </a>
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
            <Section title="Skills" icon={<Wrench className="h-4 w-4" />}>
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

