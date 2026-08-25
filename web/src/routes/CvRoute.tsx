import { useEffect, useRef, useState } from 'react'
import {
  Award,
  BriefcaseBusiness,
  CircleAlert,
  FileDown,
  GraduationCap,
  Languages,
  LayoutGrid,
  LibraryBig,
  Lock,
  ShieldCheck,
  TentTree,
} from 'lucide-react'
import { BasicsCard } from '../components/cv/BasicsCard'
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
import { ThemeToggle } from '../components/ThemeToggle'
import { CvLoadingScreen } from '../components/CvLoadingScreen'
import { useLoadingIndicator } from '../lib/loadingIndicator'
import type { MessageKey } from '../i18n/messages'
import { Button } from '../components/ui/Button'
import { IconButton } from '../components/ui/IconButton'
import { useScrolledPast } from '../lib/useScrolledPast'
import {
  clearStoredAccessCode,
  getStoredAccessCode,
} from '../lib/accessSession'
import { buildPhotoSrc } from '../lib/cvPresentation'
import { downloadCvPdf } from '../lib/downloadCvPdf'
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

export function CvRoute() {
  const { locale, t } = useI18n()
  const { goHome } = useAppView()
  const accessCode = getStoredAccessCode()
  const state = useCvState(accessCode, locale)
  const sessionExpiresAt = state.kind === 'ready' ? state.sessionExpiresAt : undefined
  const publicName = usePublicName(locale)
  // The top bar takes over exactly when the profile card has cleared the bar's own height.
  const [heroRef, isHeroScrolledPast] = useScrolledPast(56)
  const orderedSections: SectionKey[] = state.kind === 'ready' ? normalizeSectionOrder(state.cv.sectionOrder) : []
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfError, setPdfError] = useState(false)
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
    if (state.kind !== 'ready') return
    setPdfBusy(true)
    setPdfError(false)
    try {
      const name = state.cv.basics.name?.trim().replace(/\s+/g, '-') || 'cv'
      await downloadCvPdf({ cv: state.cv, t, locale, fileBaseName: name })
    } catch {
      // Previously this rejected unhandled and the button just reset, leaving no feedback.
      setPdfError(true)
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

  const profilePhotoSrc = state.kind === 'ready' ? buildPhotoSrc(state.cv.basics) : undefined

  // Skips the loader entirely on fast loads, and holds it briefly once shown so it cannot strobe.
  // Everything the loader replaces has to wait on `showLoader`, or the two would overlap.
  const showLoader = useLoadingIndicator(state.kind === 'loading')

  const unlockedStatus =
    unlockedCountdown ? (
      <SessionStatusBadge
        isLocked={isSessionLocked}
        lockedText={t('lockedUntilCode')}
        unlockedText={`${t('unlockedUntil')}: ${unlockedCountdown}`}
        activeTooltipText={t('accessActiveBadgeHint')}
        expiresInSeconds={remainingSeconds}
        size="xs"
      />
    ) : null

  return (
    <div className="space-y-5">
      {state.kind === 'locked' ? (
        <Section title={t('locked')} icon={<Lock className="h-4 w-4" />}>
          <p className="text-sm leading-relaxed text-ink-muted">
            {t('lockedHintPrefix')}{' '}
            <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-ink">/?s=SHARE_ID</span>
            <span className="text-ink-subtle"> ({t('lockedHintLangOptional')})</span>
          </p>
          <Button size="sm" className="mt-4" onClick={() => clearStoredAccessCode()}>
            {t('clearStoredAccess')}
          </Button>
        </Section>
      ) : null}

      {showLoader ? <CvLoadingScreen label={t('loadingCv')} /> : null}

      {state.kind === 'error' && !showLoader ? (
        <Section title={t('unableToLoad')} icon={<CircleAlert className="h-4 w-4 text-critical" />}>
          <p className="text-sm leading-relaxed text-ink-muted">
            {t(state.messageKey)}
            {state.messageKey === 'requestFailed' && state.status ? ` (${state.status})` : ''}
            {state.details ? ` ${state.details}` : ''}
          </p>
          <p className="mt-3 text-xs text-ink-subtle">{t('serverConfigHint')}</p>
        </Section>
      ) : null}

      {state.kind === 'ready' && !showLoader ? (
        <div className="space-y-5 motion-safe:animate-fade-in">
          {/*
            Page toolbar. Session state on the left, controls on the right — one row that owns
            every page-level action, instead of scattering them through the profile card and
            duplicating the PDF button for mobile.
          */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">{unlockedStatus}</div>
            <div className="flex items-center gap-2">
              <LanguageSelector allowedLocales={availablePrivateLocales ?? EMPTY_LOCALES} />
              <ThemeToggle />
              <Button
                variant="primary"
                onClick={() => void handleDownloadPdf()}
                busy={pdfBusy}
                iconLeft={<FileDown className="h-4 w-4 shrink-0" aria-hidden="true" />}
              >
                {pdfBusy ? t('generatingPdf') : t('downloadPdf')}
              </Button>
            </div>
          </div>

          {pdfError ? (
            <p
              role="alert"
              className="rounded-field border border-critical/25 bg-critical-soft px-3 py-2 text-xs text-critical-soft-ink"
            >
              {t('pdfGenerationFailed')}
            </p>
          ) : null}

          <div ref={heroRef}>
            <BasicsCard basics={state.cv.basics} links={state.cv.links} />
          </div>

          <FloatingBasicsMenu
            basics={state.cv.basics}
            links={state.cv.links}
            profilePhotoSrc={profilePhotoSrc}
            visible={isHeroScrolledPast}
            actions={
              <IconButton
                label={pdfBusy ? t('generatingPdf') : t('downloadPdf')}
                onClick={() => void handleDownloadPdf()}
                disabled={pdfBusy}
                size="sm"
                tabIndex={isHeroScrolledPast ? undefined : -1}
              >
                <FileDown className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            }
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
                <div key="skillsLanguages" className="space-y-5">
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
        </div>
      ) : null}
    </div>
  )
}
