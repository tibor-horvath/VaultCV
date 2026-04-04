import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowRight, Award, Eye, EyeOff, KeyRound, Moon, ShieldCheck, Sun, TentTree } from 'lucide-react'
import { AwardsList } from '../components/cv/AwardsList'
import { BasicsCard } from '../components/cv/BasicsCard'
import { EducationList } from '../components/cv/EducationList'
import { ExperienceList } from '../components/cv/ExperienceList'
import { ProjectsGrid } from '../components/cv/ProjectsGrid'
import { SkillsChips } from '../components/cv/SkillsChips'
import { Section } from '../components/cv/Section'
import { SessionStatusBadge } from '../components/cv/SessionStatusBadge'
import { fetchPublicCvProfile } from '../lib/publicProfile'
import { useDocumentFavicon } from '../lib/favicon'
import { useAppView } from '../lib/appView'
import { useI18n } from '../lib/i18n'
import { LanguageSelector } from '../components/LanguageSelector'
import { useTheme } from '../lib/themeContext'
import { setStoredAccessCode } from '../lib/accessSession'
import { fetchCv } from '../lib/api'
import { fetchProfileScopedLocales } from '../lib/profileLocaleAvailability'
import type { CvData } from '../types/cv'
import { normalizeSectionOrder } from '../lib/sectionOrder'

const EMPTY_LOCALES: readonly string[] = []

function getPublicText(value: string | undefined, fallback: string) {
  const normalized = value?.trim()
  return normalized ? normalized : fallback
}

function formatCredentialIssuerLabel(issuer: string, fallbackOther: string) {
  const normalized = issuer.trim().toLowerCase()
  if (!normalized) return fallbackOther
  if (normalized === 'aws') return 'AWS'
  if (normalized === 'cncf') return 'CNCF'
  return normalized
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function sanitizePublicBasicsForLanding(input: CvData['basics'] | undefined): CvData['basics'] {
  if (!input) return { name: '', headline: '' }
  return {
    ...input,
    // Always private in public landing mode.
    email: undefined,
    mobile: undefined,
  }
}

const skeletonBar =
  'animate-pulse bg-slate-200/90 dark:bg-slate-700/50'

function LandingPublicPreviewSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div className="space-y-6" aria-busy="true" role="status">
      <span className="sr-only">{loadingLabel}</span>
      <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.55)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/35 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="mx-auto flex-shrink-0 sm:mx-0">
            <div className={`h-48 w-48 rounded-full sm:h-56 sm:w-56 ${skeletonBar}`} />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className={`h-8 max-w-sm rounded-md ${skeletonBar} w-3/4`} />
            <div className={`h-4 max-w-xs rounded-md ${skeletonBar} w-1/2`} />
            <div className={`h-4 max-w-sm rounded-md ${skeletonBar} w-2/3`} />
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/35 sm:p-6">
        <div className={`h-5 w-36 rounded-md ${skeletonBar}`} />
        <div className="mt-4 space-y-2">
          <div className={`h-4 w-full rounded-md ${skeletonBar}`} />
          <div className={`h-4 w-[92%] rounded-md ${skeletonBar}`} />
          <div className={`h-4 w-4/5 rounded-md ${skeletonBar}`} />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5 dark:border-slate-800/80 dark:bg-slate-900/35 sm:p-6">
        <div className={`h-5 w-44 rounded-md ${skeletonBar}`} />
        <div className="mt-4 flex flex-wrap gap-2">
          <div className={`h-6 w-16 rounded-md ${skeletonBar}`} />
          <div className={`h-6 w-20 rounded-md ${skeletonBar}`} />
          <div className={`h-6 w-[4.5rem] rounded-md ${skeletonBar}`} />
        </div>
      </div>
    </div>
  )
}

export function LandingRoute() {
  const { locale, t } = useI18n()
  const { openCv } = useAppView()
  const { theme, toggleTheme } = useTheme()
  const [params] = useSearchParams()
  const urlShare = params.get('s') ?? ''
  const initialUrlAccess = urlShare.trim()
  const [shareLinkAccessLoading, setShareLinkAccessLoading] = useState(() => Boolean(initialUrlAccess))
  const urlTokenValidating = shareLinkAccessLoading
  const setUrlTokenValidating = setShareLinkAccessLoading
  const [sessionProbePending, setSessionProbePending] = useState(() => !initialUrlAccess)
  const [tokenInput, setTokenInput] = useState('')
  const [isTokenVisible, setIsTokenVisible] = useState(false)
  const [availablePublicLocales, setAvailablePublicLocales] = useState<string[] | null>(null)
  const [publicCv, setPublicCv] = useState<Partial<CvData>>(() => ({
    basics: { name: '', headline: '' },
  }))
  const [publicLoading, setPublicLoading] = useState(true)
  useEffect(() => {
    let cancelled = false

    async function loadPublicData() {
      const payload = await fetchPublicCvProfile(locale)
      if (cancelled) return
      setPublicCv(payload)

      if (!cancelled) setPublicLoading(false)
    }

    loadPublicData()
    return () => {
      cancelled = true
    }
  }, [locale])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const locales = await fetchProfileScopedLocales('public')
      if (cancelled) return
      setAvailablePublicLocales(locales)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const publicName = getPublicText(import.meta.env.VITE_PUBLIC_NAME as string | undefined, publicCv.basics?.name ?? 'CV')

  useEffect(() => {
    document.title = publicName
  }, [publicName])

  useDocumentFavicon(publicName)

  const effectiveToken = urlShare.trim() || tokenInput.trim()
  const isUnlocked = Boolean(effectiveToken)

  useEffect(() => {
    const trimmed = initialUrlAccess
    queueMicrotask(() => {
      if (trimmed) {
        setUrlTokenValidating(true)
        setSessionProbePending(false)
      } else {
        setUrlTokenValidating(false)
      }
    })
  }, [initialUrlAccess])

  useEffect(() => {
    const trimmed = initialUrlAccess
    if (!trimmed) return

    // IMPORTANT: do not "pre-validate" by calling `/api/auth` here.
    // `CvRoute` exchanges the token; doing it here too doubles share-link view counts.
    setStoredAccessCode(trimmed)
    openCv()
  }, [initialUrlAccess, openCv])

  useEffect(() => {
    if (!tokenInput.trim()) return
    queueMicrotask(() => {
      setSessionProbePending(false)
    })
  }, [tokenInput])

  useEffect(() => {
    if (initialUrlAccess) return
    if (tokenInput.trim()) return
    let cancelled = false
    queueMicrotask(() => {
      setSessionProbePending(true)
    })
    async function checkExistingSession() {
      const cvRes = await fetchCv('', locale)
      if (cancelled) return
      if (cvRes.ok) {
        openCv()
        return
      }
      setSessionProbePending(false)
    }
    checkExistingSession()
    return () => {
      cancelled = true
    }
  }, [locale, openCv, tokenInput])

  if (urlTokenValidating || sessionProbePending) {
    return (
      <div
        className="mx-auto flex w-full flex-1 flex-col items-center justify-center gap-4 py-24"
        aria-busy="true"
        role="status"
      >
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 dark:border-slate-600 dark:border-t-slate-200"
          aria-hidden
        />
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          {urlTokenValidating ? t('loadingCv') : t('checkingAccess')}
        </p>
      </div>
    )
  }

  const basics = sanitizePublicBasicsForLanding(publicCv.basics)
  const links = publicCv.links ?? []
  const publicCredentials = (publicCv.credentials ?? []).map((credential) => ({
    ...credential,
    // Always private on public landing.
    dateEarned: undefined,
    dateExpires: undefined,
  }))
  const publicEducation = (publicCv.education ?? []).map((entry) => ({
    ...entry,
    // Always private on public landing.
    gpa: undefined,
    honors: undefined,
    thesisTitle: undefined,
    advisor: undefined,
  }))
  const showPublicPhoto = Boolean(basics.photoAlt?.trim() || basics.photoUrl?.trim())
  const orderedSections = normalizeSectionOrder(publicCv.sectionOrder)

  return (
    <div className="mx-auto w-full">
      <div className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-[0_30px_70px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/45 sm:p-8">
        <div className="flex items-center justify-end gap-2">
          <LanguageSelector allowedLocales={availablePublicLocales ?? EMPTY_LOCALES} />
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900"
            aria-label={theme === 'dark' ? t('themeSwitchToLight') : t('themeSwitchToDark')}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? t('themeLight') : t('themeDark')}
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-7">
          <div className={`min-w-0 ${!isUnlocked ? 'order-2 sm:order-1' : 'order-1'}`}>
        {!publicLoading ? (
          <div className="space-y-6">
            <BasicsCard basics={basics} links={links} showPhoto={showPublicPhoto} />

            {orderedSections.map((key) => {
              if (key === 'credentials' && publicCredentials.length) {
                return (
                  <Section key="credentials" title={t('credentials')} icon={<ShieldCheck className="h-4 w-4" />}>
                    <div className="space-y-3">
                      {publicCredentials.map((credential) => (
                        <article
                          key={`${credential.issuer}:${credential.label}:${credential.url}:${credential.dateEarned ?? ''}:${credential.dateExpires ?? ''}`}
                          className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/30"
                        >
                          <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {formatCredentialIssuerLabel(String(credential.issuer ?? ''), t('other'))}
                          </div>
                          {String(credential.url ?? '').trim() ? (
                            <a
                              className="mt-1 inline-block text-sm font-semibold text-slate-900 underline underline-offset-4 dark:text-slate-100"
                              href={credential.url}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {credential.label}
                            </a>
                          ) : (
                            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{credential.label}</div>
                          )}
                        </article>
                      ))}
                    </div>
                  </Section>
                )
              }
              if (key === 'skillsLanguages') {
                return (
                  <div key="skillsLanguages">
                    {publicCv.skills?.length ? (
                      <Section title={t('skills')}>
                        <div className="flex flex-wrap gap-2">
                          {publicCv.skills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-md border border-slate-200/80 bg-slate-100/90 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-200/70 dark:border-slate-600/55 dark:bg-slate-800/55 dark:text-slate-200 dark:hover:bg-slate-800/85"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </Section>
                    ) : null}
                    {publicCv.languages?.length ? (
                      <Section title={t('languages')}>
                        <div className="flex flex-wrap gap-2">
                          {publicCv.languages.map((lang) => (
                            <span
                              key={lang}
                              className="rounded-md border border-slate-200/80 bg-slate-100/90 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-200/70 dark:border-slate-600/55 dark:bg-slate-800/55 dark:text-slate-200 dark:hover:bg-slate-800/85"
                            >
                              {lang}
                            </span>
                          ))}
                        </div>
                      </Section>
                    ) : null}
                  </div>
                )
              }
              if (key === 'experience' && publicCv.experience?.length) {
                return (
                  <Section key="experience" title={t('experience')}>
                    <ExperienceList items={publicCv.experience} />
                  </Section>
                )
              }
              if (key === 'projects' && publicCv.projects?.length) {
                return (
                  <Section key="projects" title={t('projects')}>
                    <ProjectsGrid items={publicCv.projects} />
                  </Section>
                )
              }
              if (key === 'education' && publicEducation.length) {
                return (
                  <Section key="education" title={t('education')}>
                    <EducationList items={publicEducation} />
                  </Section>
                )
              }
              if (key === 'hobbiesInterests' && publicCv.hobbiesInterests?.length) {
                return (
                  <Section key="hobbiesInterests" title={t('hobbiesInterests')} icon={<TentTree className="h-4 w-4" />}>
                    <SkillsChips items={publicCv.hobbiesInterests} />
                  </Section>
                )
              }
              if (key === 'honorsAwards' && publicCv.awards?.length) {
                return (
                  <Section key="honorsAwards" title={t('honorsAwards')} icon={<Award className="h-4 w-4" />}>
                    <AwardsList items={publicCv.awards} />
                  </Section>
                )
              }
              return null
            })}
          </div>
        ) : (
          <LandingPublicPreviewSkeleton loadingLabel={t('loadingPublicPreview')} />
        )}
          </div>

          <div
            className={`flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/75 p-4 dark:border-slate-800/80 dark:bg-slate-900/45 sm:p-5 ${!isUnlocked ? 'order-1 sm:order-2' : 'order-2'}`}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <KeyRound className="h-4 w-4" />
              {t('accessCode')}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="token">
                {t('accessCode')}
              </label>
              <div className="relative w-full">
                <input
                  id="token"
                  type={isTokenVisible ? 'text' : 'password'}
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder={t('pasteAccessCode')}
                  inputMode="text"
                  autoComplete="off"
                  aria-describedby={!isUnlocked ? 'token-hint' : undefined}
                  className="w-full rounded-xl border border-slate-200/70 bg-white py-2.5 pl-4 pr-11 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-slate-600"
                />
                {tokenInput.trim().length ? (
                  <button
                    type="button"
                    onClick={() => setIsTokenVisible((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:text-slate-400 dark:hover:bg-slate-900/70 dark:hover:text-slate-200"
                    aria-label={isTokenVisible ? t('accessCodeHide') : t('accessCodeShow')}
                    aria-pressed={isTokenVisible}
                  >
                    {isTokenVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                ) : null}
              </div>
            </div>

            {!isUnlocked ? (
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400" id="token-hint">
                {t('accessCodeHint')}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {isUnlocked ? (
                <button
                  type="button"
                  onClick={() => {
                    setStoredAccessCode(effectiveToken)
                    openCv()
                  }}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 sm:w-auto dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                >
                  {t('openCv')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled
                  aria-describedby="token-hint"
                  className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white/60 px-4 py-2.5 text-sm font-semibold text-slate-400 shadow-sm transition focus:outline-none sm:w-auto dark:border-slate-700/80 dark:bg-slate-950/30 dark:text-slate-500"
                >
                  {t('openCv')}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}

              <SessionStatusBadge
                isLocked={!isUnlocked}
                lockedText={t('lockedUntilCode')}
                unlockedText={t('accessDetected')}
                activeTooltipText={t('accessActiveBadgeHint')}
                size="sm"
                minWidthClass="min-w-0"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

