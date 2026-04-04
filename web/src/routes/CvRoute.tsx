import { useEffect, useRef, useState } from 'react'
import {
  Award,
  BriefcaseBusiness,
  CircleAlert,
  FileDown,
  GraduationCap,
  Hourglass,
  Languages,
  LayoutGrid,
  LibraryBig,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
  TentTree,
} from 'lucide-react'
import { BasicsCard } from '../components/cv/BasicsCard'
import { CvPdfLayout } from '../components/cv/pdf/CvPdfLayout'
import { FloatingBasicsMenu } from '../components/cv/FloatingBasicsMenu'
import { AwardsList } from '../components/cv/AwardsList'
import { EducationList } from '../components/cv/EducationList'
import { ExperienceList } from '../components/cv/ExperienceList'
import { ProjectsGrid } from '../components/cv/ProjectsGrid'
import { Section } from '../components/cv/Section'
import { SessionStatusBadge } from '../components/cv/SessionStatusBadge'
import { SkillsChips } from '../components/cv/SkillsChips'
import { GroupedCredentials } from '../components/cv/GroupedCredentials'
import { exchangeAccessCode, fetchCv, type ApiErrorCode } from '../lib/api'
import { fetchPublicCvProfile } from '../lib/publicProfile'
import type { CvData } from '../types/cv'
import { useDocumentFavicon } from '../lib/favicon'
import { useAppView } from '../lib/appView'
import { useI18n } from '../lib/i18n'
import { LanguageSelector } from '../components/LanguageSelector'
import type { MessageKey } from '../i18n/messages'
import { useTheme } from '../lib/themeContext'
import {
  clearStoredAccessCode,
  getStoredAccessCode,
} from '../lib/accessSession'
import { buildPhotoSrc } from '../lib/cvPresentation'
import { downloadCvPdf } from '../lib/downloadCvPdf'
import { PDF_CAPTURE_ROOT_WIDTH_PX } from '../lib/pdfCaptureLayout'
import { fetchProfileScopedLocales } from '../lib/profileLocaleAvailability'
import { normalizeSectionOrder } from '../lib/sectionOrder'

const EMPTY_LOCALES: readonly string[] = []
import type { SectionKey } from '../lib/sectionOrder'

type CvRouteState =
  | { kind: 'locked' }
  | { kind: 'expired' }
  | { kind: 'loading' }
  | { kind: 'error'; messageKey: MessageKey; details?: string; status?: number }
  | { kind: 'ready'; cv: CvData; sessionExpiresAt?: string }

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
        const payload = await fetchPublicCvProfile(locale)
        const name = payload.basics?.name?.trim() ?? ''
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
  const stateRef = useRef(state)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    let cancelled = false
    async function run() {
      // If we already unlocked successfully and then the access code was cleared,
      // don't re-run the unlock/fetch cycle. This prevents a loading/ready flash
      // (and potential redirect bounce near session boundaries).
      if (!accessCode && stateRef.current.kind === 'ready') return
      setState({ kind: 'loading' })
      let tokenForFetch = ''
      if (accessCode) {
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
        tokenForFetch = exchangeRes.data.accessToken
      }

      const res = await fetchCv(tokenForFetch, locale)
      if (cancelled) return

      if (!res.ok) {
        if (res.code === 'unauthorized') {
          clearStoredAccessCode()
          setState({ kind: 'expired' })
          return
        }
        setState({
          kind: 'error',
          messageKey: mapApiErrorToMessage(res.code),
          details: res.details,
          status: res.status,
        })
        return
      }
      clearStoredAccessCode()
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

export function CvRoute() {
  const { locale, t } = useI18n()
  const { goHome } = useAppView()
  const { theme, toggleTheme } = useTheme()
  const accessCode = getStoredAccessCode()
  const state = useCvState(accessCode, locale)
  const sessionExpiresAt = state.kind === 'ready' ? state.sessionExpiresAt : undefined
  const publicName = usePublicName(locale)
  const { basicsSentinelRef, isBasicsInView } = useBasicsVisibility(state.kind)
  const orderedSections: SectionKey[] = state.kind === 'ready' ? normalizeSectionOrder(state.cv.sectionOrder) : []
  const pdfCaptureRef = useRef<HTMLDivElement>(null)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [availablePrivateLocales, setAvailablePrivateLocales] = useState<string[] | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const locales = await fetchProfileScopedLocales('private')
      if (cancelled) return
      setAvailablePrivateLocales(locales)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleDownloadPdf() {
    const el = pdfCaptureRef.current
    if (!el || state.kind !== 'ready') return
    setPdfBusy(true)
    try {
      const name = state.cv.basics.name?.trim().replace(/\s+/g, '-') || 'cv'
      await downloadCvPdf({ root: el, fileBaseName: name })
    } finally {
      setPdfBusy(false)
    }
  }

  useEffect(() => {
    document.title = publicName
  }, [publicName])

  useEffect(() => {
    if (state.kind !== 'expired') return
    goHome()
  }, [state.kind, goHome])

  const faviconName = state.kind === 'ready' ? (state.cv.basics.name?.trim() || publicName) : publicName
  useDocumentFavicon(faviconName)
  const [countdownNow, setCountdownNow] = useState(() => Date.now())

  useEffect(() => {
    if (state.kind !== 'ready' || !sessionExpiresAt) return
    const interval = window.setInterval(() => setCountdownNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [state.kind, sessionExpiresAt])

  const remainingSeconds =
    state.kind === 'ready' && sessionExpiresAt
      ? Math.floor((new Date(sessionExpiresAt).getTime() - countdownNow) / 1000)
      : undefined
  const unlockedCountdown = remainingSeconds !== undefined ? formatCountdown(remainingSeconds) : undefined
  const isSessionLocked = remainingSeconds !== undefined && remainingSeconds <= 0

  useEffect(() => {
    if (state.kind !== 'ready') return
    if (!sessionExpiresAt) return
    if (!isSessionLocked) return
    clearStoredAccessCode()
    goHome()
  }, [state.kind, sessionExpiresAt, isSessionLocked, goHome])

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
  const profilePhotoSrc = state.kind === 'ready' ? buildPhotoSrc(state.cv.basics) : undefined

  const unlockedStatus =
    unlockedCountdown ? (
      <SessionStatusBadge
        isLocked={isSessionLocked}
        lockedText={t('lockedUntilCode')}
        unlockedText={`${t('unlockedUntil')}: ${unlockedCountdown}`}
        activeTooltipText={t('accessActiveBadgeHint')}
        expiresInSeconds={remainingSeconds}
        size="xs"
        minWidthClass="min-w-[13.5rem]"
      />
    ) : null

  return (
    <div className="space-y-6 lg:pt-20">
      {state.kind === 'locked' ? (
        <Section title={t('locked')} icon={<Lock className="h-4 w-4" />}>
          <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {t('lockedHintPrefix')}{' '}
            <span className="font-mono">/?s=SHARE_ID</span>
            <span className="text-slate-500 dark:text-slate-400"> ({t('lockedHintLangOptional')})</span>
          </div>
          <button
            type="button"
            onClick={() => {
              clearStoredAccessCode()
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
            {t('serverConfigHint')}
          </div>
        </Section>
      ) : null}

      {state.kind === 'ready' ? (
        <div className="space-y-6">
          <div ref={basicsSentinelRef}>
            <BasicsCard
              basics={state.cv.basics}
              links={state.cv.links}
              topStatus={unlockedStatus}
              headerRight={
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => void handleDownloadPdf()}
                    disabled={pdfBusy}
                    className="hidden items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-500/50 sm:inline-flex"
                  >
                    <FileDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {pdfBusy ? t('generatingPdf') : t('downloadPdf')}
                  </button>
                  <LanguageSelector allowedLocales={availablePrivateLocales ?? EMPTY_LOCALES} />
                  {themeToggle}
                </div>
              }
              belowLinks={
                <button
                  type="button"
                  onClick={() => void handleDownloadPdf()}
                  disabled={pdfBusy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-500/50"
                >
                  <FileDown className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {pdfBusy ? t('generatingPdf') : t('downloadPdf')}
                </button>
              }
            />
          </div>

          <FloatingBasicsMenu
            basics={state.cv.basics}
            links={state.cv.links}
            profilePhotoSrc={profilePhotoSrc}
            visible={!isBasicsInView}
          />

          {orderedSections.map((key) => {
            if (key === 'credentials' && state.cv.credentials?.length) {
              return (
                <Section key="credentials" title={t('credentials')} icon={<ShieldCheck className="h-4 w-4" />}>
                  <GroupedCredentials credentials={state.cv.credentials} t={t} />
                </Section>
              )
            }
            if (key === 'skillsLanguages') {
              return (
                <div key="skillsLanguages">
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
                </div>
              )
            }
            if (key === 'experience' && state.cv.experience?.length) {
              return (
                <Section key="experience" title={t('experience')} icon={<BriefcaseBusiness className="h-4 w-4" />}>
                  <ExperienceList items={state.cv.experience} />
                </Section>
              )
            }
            if (key === 'projects' && state.cv.projects?.length) {
              return (
                <Section key="projects" title={t('projects')} icon={<LayoutGrid className="h-4 w-4" />}>
                  <ProjectsGrid items={state.cv.projects} />
                </Section>
              )
            }
            if (key === 'education' && state.cv.education?.length) {
              return (
                <Section key="education" title={t('education')} icon={<GraduationCap className="h-4 w-4" />}>
                  <EducationList items={state.cv.education} />
                </Section>
              )
            }
            if (key === 'hobbiesInterests' && state.cv.hobbiesInterests?.length) {
              return (
                <Section key="hobbiesInterests" title={t('hobbiesInterests')} icon={<TentTree className="h-4 w-4" />}>
                  <SkillsChips items={state.cv.hobbiesInterests} />
                </Section>
              )
            }
            if (key === 'honorsAwards' && state.cv.awards?.length) {
              return (
                <Section key="honorsAwards" title={t('honorsAwards')} icon={<Award className="h-4 w-4" />}>
                  <AwardsList items={state.cv.awards} />
                </Section>
              )
            }
            return null
          })}
          <div
            className="pointer-events-none fixed left-[-10000px] top-0 z-0 shrink-0"
            style={{ width: PDF_CAPTURE_ROOT_WIDTH_PX }}
            aria-hidden="true"
          >
            <CvPdfLayout ref={pdfCaptureRef} cv={state.cv} profilePhotoSrc={profilePhotoSrc} />
          </div>
        </div>
      ) : null}
    </div>
  )
}
