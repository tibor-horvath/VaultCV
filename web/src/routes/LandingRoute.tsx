import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, KeyRound } from 'lucide-react'

export function LandingRoute() {
  const [params] = useSearchParams()
  const urlToken = params.get('t') ?? ''
  const [tokenInput, setTokenInput] = useState('')

  const publicName = (import.meta.env.VITE_PUBLIC_NAME as string | undefined) ?? 'Your Name'
  const publicTitle = (import.meta.env.VITE_PUBLIC_TITLE as string | undefined) ?? 'Your Title'

  const effectiveToken = useMemo(() => {
    const fromUrl = urlToken.trim()
    if (fromUrl) return fromUrl
    const fromInput = tokenInput.trim()
    return fromInput
  }, [tokenInput, urlToken])
  const isUnlocked = Boolean(effectiveToken)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        <div className="text-balance text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          {publicName}
        </div>
        <div className="mt-2 text-pretty text-lg text-slate-700 dark:text-slate-300">
          {publicTitle}
        </div>

        <div className="mt-6 flex flex-col gap-3">
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
                className="w-full rounded-xl border border-slate-200/70 bg-white/80 px-4 py-2.5 text-sm text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-400 dark:border-slate-800/60 dark:bg-slate-950/40 dark:text-slate-100"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to={isUnlocked ? `/cv?t=${encodeURIComponent(effectiveToken)}` : '/'}
              aria-disabled={!isUnlocked}
              className={[
                'group inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400 sm:w-auto',
                isUnlocked
                  ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100'
                  : 'cursor-not-allowed border border-slate-200/70 bg-white/50 text-slate-400 dark:border-slate-800/60 dark:bg-slate-950/30 dark:text-slate-500',
              ].join(' ')}
              onClick={(e) => {
                if (!isUnlocked) e.preventDefault()
              }}
            >
              Open CV
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <div className="text-sm text-slate-600 dark:text-slate-400">
              {isUnlocked ? <>Access detected.</> : <>Locked.</>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

