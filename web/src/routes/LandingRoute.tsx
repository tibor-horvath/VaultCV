import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, KeyRound, LibraryBig, MapPin, Moon, Sun, Target } from 'lucide-react'
import { BasicsLinksRow } from '../components/cv/BasicsLinksRow'
import { SessionStatusBadge } from '../components/cv/SessionStatusBadge'
import { defaultPublicData, fetchPublicProfile, mergePublicData, type PublicData } from '../lib/publicProfile'
import { useDocumentFavicon } from '../lib/favicon'
import { useAppView } from '../lib/appView'
import { useI18n } from '../lib/i18n'
import { LanguageSelector } from '../components/LanguageSelector'
import { useTheme } from '../lib/themeContext'
import { setStoredAccessCode } from '../lib/accessSession'
import { exchangeAccessCode, fetchCv } from '../lib/api'

function getPublicText(value: string | undefined, fallback: string) {
  const normalized = value?.trim()
  return normalized ? normalized : fallback
}

export function LandingRoute() {
  const { locale, t } = useI18n()
  const { openCv } = useAppView()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const urlToken = params.get('t') ?? ''
  const [urlTokenValidating, setUrlTokenValidating] = useState(() => Boolean(urlToken.trim()))
  const [sessionProbePending, setSessionProbePending] = useState(() => !urlToken.trim())
  const [tokenInput, setTokenInput] = useState('')
  const [isTokenVisible, setIsTokenVisible] = useState(false)
  const [urlTokenInvalid, setUrlTokenInvalid] = useState(false)
  const [publicData, setPublicData] = useState<PublicData>(defaultPublicData)
  const [publicLoading, setPublicLoading] = useState(true)
  useEffect(() => {
    let cancelled = false

    async function loadPublicData() {
      const payload = await fetchPublicProfile(locale)
      if (cancelled) return
      setPublicData((current) => mergePublicData(current, payload))

      if (!cancelled) setPublicLoading(false)
    }

    loadPublicData()
    return () => {
      cancelled = true
    }
  }, [locale])

  const publicName = getPublicText(import.meta.env.VITE_PUBLIC_NAME as string | undefined, publicData.name)
  const publicTitle = getPublicText(import.meta.env.VITE_PUBLIC_TITLE as string | undefined, publicData.title)

  useEffect(() => {
    document.title = publicName
  }, [publicName])

  useDocumentFavicon(publicName)

  const effectiveToken = useMemo(() => {
    const fromUrl = urlToken.trim()
    if (fromUrl) return fromUrl
    const fromInput = tokenInput.trim()
    return fromInput
  }, [tokenInput, urlToken])
  const isUnlocked = Boolean(effectiveToken)
  const isAccessDetected = Boolean(urlToken.trim())

  useEffect(() => {
    const trimmed = urlToken.trim()
    queueMicrotask(() => {
      if (trimmed) {
        setUrlTokenValidating(true)
        setSessionProbePending(false)
      } else {
        setUrlTokenValidating(false)
      }
    })
  }, [urlToken])

  useEffect(() => {
    if (!tokenInput.trim()) return
    queueMicrotask(() => {
      setSessionProbePending(false)
    })
  }, [tokenInput])

  useEffect(() => {
    const trimmed = urlToken.trim()
    if (!trimmed) return
    let cancelled = false
    ;(async () => {
      const res = await exchangeAccessCode(trimmed)
      if (cancelled) return
      if (res.ok) {
        setStoredAccessCode(trimmed)
        openCv()
        return
      }
      setUrlTokenValidating(false)
      setTokenInput(trimmed)
      setUrlTokenInvalid(true)
      const next = new URLSearchParams(window.location.search)
      next.delete('t')
      const qs = next.toString()
      navigate({ pathname: '/', search: qs ? `?${qs}` : '' }, { replace: true })
    })()
    return () => {
      cancelled = true
    }
  }, [urlToken, openCv, navigate])

  useEffect(() => {
    if (urlToken.trim()) return
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
  }, [locale, openCv, tokenInput, urlToken])

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
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">{t('loadingCv')}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full">
      <div className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-[0_30px_70px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/45 sm:p-8">
        <div className="flex items-center justify-end gap-2">
          <LanguageSelector />
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

        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
          {publicLoading ? t('loading') : publicName}
        </h1>
        <p className="mt-2 text-pretty text-base text-slate-700 dark:text-slate-300 sm:text-lg">
          {publicLoading ? '' : publicTitle}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 dark:border-slate-800/80 dark:bg-slate-900/45">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5" />
              {t('location')}
            </div>
            <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              {publicLoading ? t('loading') : publicData.location}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 dark:border-slate-800/80 dark:bg-slate-900/45">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              <Target className="h-3.5 w-3.5" />
              {t('focus')}
            </div>
            <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              {publicLoading ? t('loading') : publicData.focus}
            </p>
          </div>
        </div>

        <p className="mt-4 text-pretty text-sm text-slate-700 dark:text-slate-300">
          {publicLoading ? '' : publicData.bio}
        </p>

        {!publicLoading ? (
          <>
            <BasicsLinksRow links={publicData.links} />

            {publicData.skills.length ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <LibraryBig className="h-3.5 w-3.5" />
                  {t('skills')}
                </span>
                {publicData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-slate-200/80 bg-slate-100/90 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-200/70 dark:border-slate-600/55 dark:bg-slate-800/55 dark:text-slate-200 dark:hover:bg-slate-800/85"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
          </>
        ) : null}

        <div className="mt-7 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white/75 p-4 dark:border-slate-800/80 dark:bg-slate-900/45 sm:p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            <KeyRound className="h-4 w-4" />
            {t('accessCode')}
          </div>

          {urlTokenInvalid ? (
            <p className="text-sm leading-relaxed text-red-600 dark:text-red-400" role="alert">
              {t('urlTokenInvalid')}
            </p>
          ) : null}

          {!urlToken ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="token">
                {t('accessCode')}
              </label>
              <div className="relative w-full">
                <input
                  id="token"
                  type={isTokenVisible ? 'text' : 'password'}
                  value={tokenInput}
                  onChange={(e) => {
                    setTokenInput(e.target.value)
                    setUrlTokenInvalid(false)
                  }}
                  placeholder={t('pasteAccessCode')}
                  inputMode="text"
                  autoComplete="off"
                  className="w-full rounded-xl border border-slate-200/70 bg-white py-2.5 pl-4 pr-11 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-slate-600"
                />
                {tokenInput.trim().length ? (
                  <button
                    type="button"
                    onClick={() => setIsTokenVisible((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:text-slate-400 dark:hover:bg-slate-900/70 dark:hover:text-slate-200"
                    aria-label={isTokenVisible ? 'Hide access code' : 'Show access code'}
                    aria-pressed={isTokenVisible}
                  >
                    {isTokenVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                ) : null}
              </div>
            </div>
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
                className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200/70 bg-white/60 px-4 py-2.5 text-sm font-semibold text-slate-400 shadow-sm transition focus:outline-none sm:w-auto dark:border-slate-700/80 dark:bg-slate-950/30 dark:text-slate-500"
              >
                {t('openCv')}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            <SessionStatusBadge
              isLocked={!isAccessDetected}
              lockedText={t('lockedUntilCode')}
              unlockedText={t('accessDetected')}
              size="sm"
              minWidthClass="min-w-0"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

