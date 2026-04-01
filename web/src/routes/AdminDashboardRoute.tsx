import { ExternalLink, KeyRound, Link2, Shield, SquarePen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../lib/i18n'

type ClientPrincipal = {
  userDetails?: string
  userRoles?: string[]
}

async function fetchAuthMe(): Promise<ClientPrincipal | null> {
  try {
    const res = await fetch('/.auth/me', { credentials: 'same-origin' })
    if (!res.ok) return null
    const text = await res.text()
    if (!text.trim()) return null
    const data = JSON.parse(text) as { clientPrincipal?: ClientPrincipal }
    return data?.clientPrincipal ?? null
  } catch {
    return null
  }
}

export function AdminDashboardRoute() {
  const { t } = useI18n()
  const [me, setMe] = useState<ClientPrincipal | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  const isAdmin = useMemo(() => (me?.userRoles ?? []).includes('admin'), [me])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const principal = await fetchAuthMe()
      if (cancelled) return
      setMe(principal)
      setMeLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (meLoading) {
    return (
      <div className="w-full space-y-4 py-10">
        <div className="text-sm text-slate-600 dark:text-slate-300">{t('adminSessionChecking')}</div>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="w-full space-y-6 py-10">
        <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Shield className="h-5 w-5" />
            <div className="text-lg font-semibold">{t('adminPortal')}</div>
          </div>
          <div className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {t('adminSignInHint')}
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              href="/.auth/login/aad"
            >
              <KeyRound className="h-4 w-4" /> {t('adminSignIn')}
              <ExternalLink className="h-4 w-4 opacity-80" />
            </a>
            <a
              className="text-xs font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              href="/.auth/me"
              target="_blank"
              rel="noreferrer"
            >
              {t('adminViewCurrentIdentity')}
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="w-full space-y-6 py-10">
        <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Shield className="h-5 w-5" />
            <div className="text-lg font-semibold">{t('adminPortal')}</div>
          </div>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            {t('adminNoRole').replace('{email}', me.userDetails ?? t('adminUnknownUser'))}
          </div>
          <div className="mt-5">
            <a className="text-xs font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" href="/.auth/logout">
              {t('adminSignOut')}
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <Shield className="h-5 w-5" /> {t('adminPortal')}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">{t('adminChooseManage')}</div>
        </div>
        <a className="text-xs font-medium text-slate-600 underline dark:text-slate-300" href="/.auth/logout">
          {t('adminSignOut')}
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          to="/admin/editor"
          className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950/30"
        >
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <SquarePen className="h-4 w-4" /> {t('adminEditCv')}
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">{t('adminEditCvTileDescription')}</div>
        </Link>

        <Link
          to="/admin/share"
          className="rounded-2xl border border-slate-200/70 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950/30"
        >
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Link2 className="h-4 w-4" /> {t('adminShareCv')}
          </div>
          <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">{t('adminShareCvTileDescription')}</div>
        </Link>
      </div>
    </div>
  )
}
