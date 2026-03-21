import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, KeyRound, LibraryBig, MapPin, Moon, ShieldCheck, ExternalLink, Sun, Target } from 'lucide-react'
import { SiGithubIcon, SiLinkedinIcon } from '../components/icons/SimpleBrandIcons'
import { applyTheme, setStoredTheme, type ThemePreference } from '../lib/theme'
import { inferLinkKind } from '../lib/cvPresentation'
import { defaultPublicData, fetchPublicProfile, mergePublicData, type PublicData } from '../lib/publicProfile'
import { resolveInitialThemeForMode } from '../lib/themePreference'
import { useDocumentFavicon } from '../lib/favicon'

function getPublicText(value: string | undefined, fallback: string) {
  const normalized = value?.trim()
  return normalized ? normalized : fallback
}

export function LandingRoute() {
  const [params] = useSearchParams()
  const urlToken = params.get('t') ?? ''
  const [tokenInput, setTokenInput] = useState('')
  const [publicData, setPublicData] = useState<PublicData>(defaultPublicData)
  const [publicLoading, setPublicLoading] = useState(true)
  const [theme, setTheme] = useState<ThemePreference>(() => {
    const isMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_CV === '1'
    return resolveInitialThemeForMode(isMock)
  })

  useEffect(() => {
    applyTheme(theme)
    setStoredTheme(theme)
  }, [theme])

  useEffect(() => {
    let cancelled = false

    async function loadPublicData() {
      const payload = await fetchPublicProfile()
      if (cancelled) return
      setPublicData((current) => mergePublicData(current, payload))

      if (!cancelled) setPublicLoading(false)
    }

    loadPublicData()
    return () => {
      cancelled = true
    }
  }, [])

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

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-3xl border border-white/80 bg-white/80 p-6 shadow-[0_30px_70px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/45 sm:p-8">
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>

        <div className="mt-4 text-balance text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
          {publicLoading ? 'Loading...' : publicName}
        </div>
        <div className="mt-2 text-pretty text-base text-slate-700 dark:text-slate-300 sm:text-lg">
          {publicLoading ? '' : publicTitle}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 dark:border-slate-800/80 dark:bg-slate-900/45">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5" />
              Location
            </div>
            <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              {publicLoading ? 'Loading...' : publicData.location}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/75 p-4 dark:border-slate-800/80 dark:bg-slate-900/45">
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
              <Target className="h-3.5 w-3.5" />
              Focus
            </div>
            <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
              {publicLoading ? 'Loading...' : publicData.focus}
            </p>
          </div>
        </div>

        <p className="mt-4 text-pretty text-sm text-slate-700 dark:text-slate-300">
          {publicLoading ? '' : publicData.bio}
        </p>

        {!publicLoading ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {publicData.links.map((item) => (
                <a
                  key={`${item.label}:${item.url}`}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/85 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:bg-slate-900"
                >
                  {(() => {
                    const kind = inferLinkKind(item)
                    const Icon = kind === 'github' ? SiGithubIcon : kind === 'linkedin' ? SiLinkedinIcon : ExternalLink
                    return <Icon className="h-3.5 w-3.5 opacity-80" />
                  })()}
                  {item.label}
                </a>
              ))}
            </div>

            {publicData.skills.length ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <LibraryBig className="h-3.5 w-3.5" />
                  Skills
                </span>
                {publicData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-200/85 bg-white px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-200"
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
            Access code
          </div>

          {!urlToken ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="token">
                Access code
              </label>
              <input
                id="token"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste access code"
                inputMode="text"
                autoComplete="off"
                className="w-full rounded-xl border border-slate-200/70 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 transition focus:border-slate-300 focus:ring-2 focus:ring-slate-400 dark:border-slate-700/80 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-slate-600"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to={isUnlocked ? `/cv?t=${encodeURIComponent(effectiveToken)}` : '/'}
              aria-disabled={!isUnlocked}
              className={[
                'group inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-400 sm:w-auto',
                isUnlocked
                  ? 'bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                  : 'cursor-not-allowed border border-slate-200/70 bg-white/60 text-slate-400 dark:border-slate-700/80 dark:bg-slate-950/30 dark:text-slate-500',
              ].join(' ')}
              onClick={(e) => {
                if (!isUnlocked) e.preventDefault()
              }}
            >
              Open CV
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <div className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 opacity-80" />
              {isUnlocked ? <>Access detected.</> : <>Locked until code is provided.</>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

