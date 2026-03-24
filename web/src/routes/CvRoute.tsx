import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
  Timer,
} from 'lucide-react'
import { BasicsCard } from '../components/cv/BasicsCard'
import { FloatingBasicsMenu } from '../components/cv/FloatingBasicsMenu'
import { EducationList } from '../components/cv/EducationList'
import { ExperienceList } from '../components/cv/ExperienceList'
import { ProjectsGrid } from '../components/cv/ProjectsGrid'
import { Section } from '../components/cv/Section'
import { SkillsChips } from '../components/cv/SkillsChips'
import { SiGoogleIcon } from '../components/icons/SimpleBrandIcons'
import { exchangeAccessCode, fetchCv, type ApiErrorCode } from '../lib/api'
import { fetchPublicProfile } from '../lib/publicProfile'
import type { CvCredentialIssuer, CvData } from '../types/cv'
import { useDocumentFavicon } from '../lib/favicon'
import { buildLocalizedPath, useI18n } from '../lib/i18n'
import { LanguageSelector } from '../components/LanguageSelector'
import type { MessageKey } from '../i18n/messages'
import { useTheme } from '../lib/themeContext'
import {
  clearStoredAccessCode,
  clearStoredAccessToken,
  getStoredAccessCode,
  getStoredAccessToken,
  setStoredAccessCode,
  setStoredAccessToken,
} from '../lib/accessSession'

type CvRouteState =
  | { kind: 'locked' }
  | { kind: 'expired' }
  | { kind: 'loading' }
  | { kind: 'error'; messageKey: MessageKey; details?: string; status?: number }
  | { kind: 'ready'; cv: CvData; sessionExpiresAt?: string }

const credentialIssuerOrder: CvCredentialIssuer[] = ['microsoft', 'aws', 'google', 'language', 'other']

function mapApiErrorToMessage(code: ApiErrorCode): MessageKey {
  if (code === 'network_error') return 'networkError'
  if (code === 'invalid_json_response') return 'invalidJsonResponse'
  if (code === 'invalid_cv_payload') return 'invalidCvPayload'
  if (code === 'invalid_token_format') return 'invalidTokenFormat'
  if (code === 'unauthorized') return 'unauthorized'
  if (code === 'server_not_configured') return 'serverNotConfigured'
  if (code === 'server_token_invalid') return 'serverTokenInvalid'
  if (code === 'cv_data_not_configured') return 'cvDataNotConfigured'
  if (code === 'cv_data_invalid_json') return 'cvDataInvalidJson'
  return 'requestFailed'
}

function usePublicName(locale: string) {
  const [publicName, setPublicName] = useState(() => {
    const envName = (import.meta.env.VITE_PUBLIC_NAME as string | undefined)?.trim()
    return envName || 'CV'
  })

  useEffect(() => {
    let cancelled = false
    async function loadPublicProfileName() {
      try {
        const payload = await fetchPublicProfile(locale)
        const name = payload.name?.trim() ?? ''
        if (!name || cancelled) return
        setPublicName(name)
      } catch {
        // Ignore; we can still fall back to env name.
      }
    }
    loadPublicProfileName()
    return () => {
      cancelled = true
    }
  }, [locale])

  return publicName
}

function useCvState(accessCode: string, locale: string) {
  const [state, setState] = useState<CvRouteState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    async function run() {
      setState({ kind: 'loading' })
      let accessToken = getStoredAccessToken().trim()
      if (!accessToken && accessCode) {
        const exchangeRes = await exchangeAccessCode(accessCode)
        if (cancelled) return
        if (!exchangeRes.ok) {
          setState({
            kind: 'error',
            messageKey: mapApiErrorToMessage(exchangeRes.code),
            details: exchangeRes.details,
            status: exchangeRes.status,
          })
          return
        }
        accessToken = exchangeRes.data.accessToken
        setStoredAccessToken(accessToken)
      }

      const res = await fetchCv(accessToken, locale)
      if (cancelled) return

      if (!res.ok) {
        if (res.code === 'unauthorized') {
          clearStoredAccessCode()
          clearStoredAccessToken()
          if (!accessCode) {
            setState({ kind: 'expired' })
            return
          }
        }
        setState({
          kind: 'error',
          messageKey: mapApiErrorToMessage(res.code),
          details: res.details,
          status: res.status,
        })
        return
      }
      setState({ kind: 'ready', cv: res.data, sessionExpiresAt: res.sessionExpiresAt })
    }

    run()
    return () => {
      cancelled = true
    }
  }, [accessCode, locale])

  return state
}

function pad2(value: number) {
  return value.toString().padStart(2, '0')
}

function formatCountdown(totalSeconds: number) {
  const clamped = Math.max(0, totalSeconds)
  const hours = Math.floor(clamped / 3600)
  const minutes = Math.floor((clamped % 3600) / 60)
  const seconds = clamped % 60
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
}

function useBasicsVisibility(stateKind: CvRouteState['kind']) {
  const basicsSentinelRef = useRef<HTMLDivElement | null>(null)
  const [isBasicsInView, setIsBasicsInView] = useState(true)

  useEffect(() => {
    if (stateKind !== 'ready') return
    const el = basicsSentinelRef.current
    if (!el) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsBasicsInView(entry.isIntersecting)
    }, { threshold: 0.01 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [stateKind])

  return { basicsSentinelRef, isBasicsInView }
}

function MicrosoftMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={className}>
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

function CredentialIssuerIcon({ issuer }: { issuer: CvCredentialIssuer }) {
  const cls = 'h-4 w-4 opacity-80'
  if (issuer === 'microsoft') return <MicrosoftMark className={cls} />
  if (issuer === 'aws') return <AwsMark className={cls} />
  if (issuer === 'google') return <SiGoogleIcon className={cls} aria-hidden="true" focusable="false" />
  if (issuer === 'language') return <Languages className={cls} />
  return <ShieldCheck className={cls} />
}

export function CvRoute() {
  const { locale, t } = useI18n()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [params] = useSearchParams()
  const urlToken = params.get('t')?.trim() ?? ''
  const accessCode = urlToken || getStoredAccessCode()
  const state = useCvState(accessCode, locale)
  const publicName = usePublicName(locale)
  const { basicsSentinelRef, isBasicsInView } = useBasicsVisibility(state.kind)

  useEffect(() => {
    document.title = publicName
  }, [publicName])

  useEffect(() => {
    if (!urlToken) return
    setStoredAccessCode(urlToken)
    clearStoredAccessToken()
    const nextUrl = `${window.location.pathname}${window.location.hash}`
    window.history.replaceState(null, '', nextUrl)
  }, [urlToken])

  useEffect(() => {
    if (state.kind !== 'expired') return
    navigate(buildLocalizedPath('/', '', locale), { replace: true })
  }, [state.kind, navigate, locale])

  const faviconName = state.kind === 'ready' ? (state.cv.basics.name?.trim() || publicName) : publicName
  useDocumentFavicon(faviconName)
  const [countdownNow, setCountdownNow] = useState(() => Date.now())

  useEffect(() => {
    if (state.kind !== 'ready' || !state.sessionExpiresAt) return
    const interval = window.setInterval(() => setCountdownNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [state.kind, state.kind === 'ready' ? state.sessionExpiresAt : undefined])

  const unlockedCountdown =
    state.kind === 'ready' && state.sessionExpiresAt
      ? formatCountdown(Math.floor((new Date(state.sessionExpiresAt).getTime() - countdownNow) / 1000))
      : undefined

  const themeToggle = (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900"
      aria-label={theme === 'dark' ? t('themeSwitchToLight') : t('themeSwitchToDark')}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {theme === 'dark' ? t('themeLight') : t('themeDark')}
    </button>
  )

  return (
    <div className="space-y-6 lg:pt-20">
      {state.kind === 'locked' ? (
        <Section title={t('locked')} icon={<Lock className="h-4 w-4" />}>
          <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {t('lockedHintPrefix')} <span className="font-mono">/cv?t=TOKEN</span>
          </div>
          <button
            type="button"
            onClick={() => {
              clearStoredAccessCode()
              clearStoredAccessToken()
            }}
            className="mt-3 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            Clear stored access
          </button>
        </Section>
      ) : null}

      {state.kind === 'loading' ? (
        <Section title={t('loading')} icon={<Hourglass className="h-4 w-4" />}>
          <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{t('loadingCv')}</div>
        </Section>
      ) : null}

      {state.kind === 'error' ? (
        <Section title={t('unableToLoad')} icon={<CircleAlert className="h-4 w-4" />}>
          <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {t(state.messageKey)}
            {state.messageKey === 'requestFailed' && state.status ? ` (${state.status})` : ''}
            {state.details ? ` ${state.details}` : ''}
          </div>
          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            {t('serverConfigHint')} The server has
            <span className="font-mono"> CV_ACCESS_TOKEN</span> and <span className="font-mono">PRIVATE_PROFILE_JSON</span>{' '}
            configured.
          </div>
        </Section>
      ) : null}

      {state.kind === 'ready' ? (
        <div className="space-y-6">
          <div ref={basicsSentinelRef}>
            <BasicsCard
              basics={state.cv.basics}
              links={state.cv.links}
              headerRight={
                <div className="flex flex-col items-end gap-2">
                  <div className="order-2 inline-flex items-center gap-2 sm:order-1">
                    <LanguageSelector />
                    {themeToggle}
                  </div>
                  {unlockedCountdown ? (
                    <div className="order-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/40 dark:text-emerald-300 sm:order-2">
                      <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {t('unlockedUntil')} {unlockedCountdown}
                      </span>
                    </div>
                  ) : null}
                </div>
              }
            />
          </div>

          {!isBasicsInView ? <FloatingBasicsMenu basics={state.cv.basics} links={state.cv.links} /> : null}

          {state.cv.credentials?.length ? (
            <Section title={t('credentials')} icon={<ShieldCheck className="h-4 w-4" />}>
              <div className="space-y-4">
                {credentialIssuerOrder
                  .map((issuer) => {
                    const items = state.cv.credentials?.filter((c) => c.issuer === issuer) ?? []
                    if (!items.length) return null
                    return (
                      <div key={issuer}>
                        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                          <CredentialIssuerIcon issuer={issuer} />
                          {issuer === 'language'
                            ? t('languageExams')
                            : issuer === 'other'
                              ? t('other')
                              : issuer === 'aws'
                                ? 'AWS'
                                : issuer.charAt(0).toUpperCase() + issuer.slice(1)}
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
                                          {t('earned')} {c.dateEarned}
                                        </span>
                                      ) : null}
                                      {c.dateExpires ? (
                                        <span className="inline-flex items-center gap-1.5">
                                          <Calendar className="h-3.5 w-3.5 opacity-80" />
                                          {t('expires')} {c.dateExpires}
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
            <Section title={t('skills')} icon={<LibraryBig className="h-4 w-4" />}>
              <SkillsChips items={state.cv.skills} />
            </Section>
          ) : null}

          {state.cv.languages?.length ? (
            <Section title={t('languages')} icon={<Languages className="h-4 w-4" />}>
              <SkillsChips items={state.cv.languages} />
            </Section>
          ) : null}

          {state.cv.experience?.length ? (
            <Section title={t('experience')} icon={<BriefcaseBusiness className="h-4 w-4" />}>
              <ExperienceList items={state.cv.experience} />
            </Section>
          ) : null}

          {state.cv.projects?.length ? (
            <Section title={t('projects')} icon={<LayoutGrid className="h-4 w-4" />}>
              <ProjectsGrid items={state.cv.projects} />
            </Section>
          ) : null}

          {state.cv.education?.length ? (
            <Section title={t('education')} icon={<GraduationCap className="h-4 w-4" />}>
              <EducationList items={state.cv.education} />
            </Section>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
