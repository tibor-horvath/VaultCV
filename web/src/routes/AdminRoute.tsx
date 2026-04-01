import { useEffect, useMemo, useState } from 'react'
import {
  Ban,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Globe2,
  KeyRound,
  Link2,
  LoaderCircle,
  LogOut,
  PlusCircle,
  RefreshCw,
  Shield,
  SquarePen,
  Trash2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { redirectToLogin } from '../lib/authRedirect'
import { useI18n } from '../lib/i18n'
import { IconSelect } from './adminEditor/IconSelect'
import { AdminPageHeader } from './AdminPageHeader'

type ClientPrincipal = {
  identityProvider?: string
  userId?: string
  userDetails?: string
  userRoles?: string[]
  roles?: string[]
  claims?: { typ: string; val: string }[]
}

type ShareLink = {
  rowKey: string
  notes?: string
  createdAtEpoch: number
  expiresAtEpoch: number
  revokedAtEpoch?: number
  lastViewedAtEpoch?: number
  viewCount?: number
}
type LinkStatus = 'active' | 'revoked' | 'expired'
type StatusFilter = LinkStatus | 'all'

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

function extractEmailFromPrincipal(principal: ClientPrincipal | null): string {
  if (!principal) return ''
  const claims = principal.claims ?? []
  const byType = (t: string) =>
    claims
      .filter((c) => (c.typ ?? '').trim().toLowerCase() === t)
      .map((c) => (c.val ?? '').trim())
      .find(Boolean) ?? ''

  return (
    byType('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress') ||
    byType('email') ||
    byType('emails') ||
    byType('preferred_username') ||
    (principal.userDetails ?? '').trim()
  )
}

async function readJsonOrNull<T>(res: Response): Promise<T | null> {
  try {
    const text = await res.text()
    if (!text.trim()) return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && typeof error.message === 'string' && error.message.trim()) return error.message
  return fallback
}

function epochToIso(epoch: number | undefined) {
  if (!epoch || !Number.isFinite(epoch) || epoch <= 0) return ''
  return new Date(epoch * 1000).toISOString().slice(0, 10)
}

function classifyLinkStatus(link: ShareLink, nowEpoch: number): LinkStatus {
  if (link.revokedAtEpoch) return 'revoked'
  if (link.expiresAtEpoch <= nowEpoch) return 'expired'
  return 'active'
}

function readStatusFilterFromUrl(): StatusFilter {
  const value = new URLSearchParams(window.location.search).get('status')
  if (value === 'active' || value === 'revoked' || value === 'expired' || value === 'all') {
    return value
  }
  return 'active'
}

export function AdminShareRoute() {
  const { localeOptions, t } = useI18n()
  const [me, setMe] = useState<ClientPrincipal | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  const [links, setLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [shareLang, setShareLang] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => readStatusFilterFromUrl())

  const isAdmin = useMemo(() => (me?.userRoles ?? []).includes('admin'), [me])
  const signedInEmail = useMemo(() => extractEmailFromPrincipal(me), [me])
  const visibleLinks = useMemo(() => {
    const nowEpoch = Math.floor(Date.now() / 1000)
    if (statusFilter === 'all') return links
    return links.filter((link) => classifyLinkStatus(link, nowEpoch) === statusFilter)
  }, [links, statusFilter])
  const shareLanguageOptions = useMemo(
    () => [
      { value: '', label: t('adminAuto') },
      ...localeOptions.map((o) => ({
        value: o.code,
        label: `${o.code.toUpperCase()} - ${o.label}`,
      })),
    ],
    [localeOptions, t],
  )

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

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/manage/links', { credentials: 'same-origin' })
      if (res.status === 401) {
        redirectToLogin('/admin/share')
        return
      }
      const body = await readJsonOrNull<{ links?: ShareLink[]; error?: string }>(res)
      if (!res.ok) {
        throw new Error(body?.error || `Request failed (${res.status})`)
      }
      setLinks(body?.links ?? [])
    } catch (e: unknown) {
      setError(toErrorMessage(e, t('adminLoadShareLinksFailed')))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!meLoading && isAdmin) {
      refresh()
    }
  }, [meLoading, isAdmin])

  useEffect(() => {
    if (!status) return
    const timer = window.setTimeout(() => setStatus(null), 2500)
    return () => window.clearTimeout(timer)
  }, [status])

  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('status', statusFilter)
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }, [statusFilter])

  async function createLink(form: HTMLFormElement) {
    const fd = new FormData(form)
    const notes = String(fd.get('notes') ?? '')
    const expiresInDays = Number.parseInt(String(fd.get('expiresInDays') ?? '30'), 10)
    setLoading(true)
    setError(null)
    setStatus(null)
    try {
      const res = await fetch('/api/manage/links', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json', 'x-cv-admin': '1' },
        credentials: 'same-origin',
        body: JSON.stringify({
          notes: notes.trim() ? notes : undefined,
          expiresInDays: Number.isFinite(expiresInDays) ? expiresInDays : 30,
        }),
      })
      if (res.status === 401) {
        redirectToLogin('/admin/share')
        return
      }
      const body = await readJsonOrNull<{ id?: string; error?: string }>(res)
      if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`)
      await refresh()
      form.reset()
      setStatus(t('adminShareLinkCreated'))
    } catch (e: unknown) {
      setError(toErrorMessage(e, t('adminCreateShareLinkFailed')))
    } finally {
      setLoading(false)
    }
  }

  async function revoke(id: string) {
    setLoading(true)
    setError(null)
    setStatus(null)
    try {
      const res = await fetch(`/api/manage/links/${encodeURIComponent(id)}/revoke`, {
        method: 'POST',
        headers: { accept: 'application/json', 'x-cv-admin': '1' },
        credentials: 'same-origin',
      })
      if (res.status === 401) {
        redirectToLogin('/admin/share')
        return
      }
      const body = await readJsonOrNull<{ ok?: boolean; error?: string }>(res)
      if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`)
      await refresh()
      setStatus(t('adminShareLinkRevoked'))
    } catch (e: unknown) {
      setError(toErrorMessage(e, t('adminRevokeShareLinkFailed')))
    } finally {
      setLoading(false)
    }
  }

  async function copyShareUrl(shareUrl: string) {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setStatus(t('adminShareLinkCopied'))
    } catch {
      setStatus(t('adminShareLinkCopyFailed'))
    }
  }

  if (meLoading) {
    return (
      <div className="w-full space-y-4 py-10">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <LoaderCircle className="h-4 w-4 animate-spin" /> {t('adminSessionChecking')}
        </div>
      </div>
    )
  }

  if (!me) {
    return (
      <div className="w-full space-y-6 py-10">
        <div className="rounded-3xl border border-slate-200/70 bg-white/60 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Shield className="h-5 w-5" />
              <div className="text-lg font-semibold">{t('adminPortal')}</div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{t('adminSecureAccess')}</div>
          </div>

          <div className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {t('adminShareSignInHint')}
          </div>

          <div className="mt-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            After signing in, assign yourself the <span className="font-mono">admin</span> role in the Static Web App’s{' '}
            <span className="font-semibold">Role assignments</span>.
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
          <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/20 dark:text-slate-300">
            {t('adminRoleAssignmentHint')}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              href="/.auth/me"
              target="_blank"
              rel="noreferrer"
            >
              {t('adminOpenAuthMe')} <ExternalLink className="h-4 w-4 opacity-80" />
            </a>
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
      <AdminPageHeader
        title={t('adminShareCv')}
        icon={<Shield className="h-5 w-5" />}
        signedInEmail={signedInEmail}
        actions={
          <>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            <Shield className="h-3.5 w-3.5 shrink-0" /> {t('adminDashboard')}
          </Link>
          {localeOptions.length > 1 ? (
            <label className="flex items-center gap-2 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">
              <Globe2 className="h-3.5 w-3.5 shrink-0" /> {t('adminShareLanguage')}
              <div className="min-w-[11rem] text-xs">
                <IconSelect
                  value={shareLang}
                  onChange={setShareLang}
                  options={shareLanguageOptions}
                  placeholder={t('adminAuto')}
                  ariaLabel={t('adminShareLanguage')}
                />
              </div>
            </label>
          ) : null}
          <Link
            to="/admin/editor"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            <SquarePen className="h-3.5 w-3.5 shrink-0" /> {t('adminEditCv')}
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={() => refresh()}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" /> {t('adminRefresh')}
          </button>
          <a className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 underline dark:text-slate-300" href="/.auth/logout">
            <LogOut className="h-3.5 w-3.5 shrink-0" /> {t('adminSignOut')}
          </a>
          </>
        }
      />

      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </div>
      ) : null}
      {status ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
        >
          {status}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="sticky top-0 z-10 -mx-5 border-b border-slate-200/70 bg-white/95 px-5 py-2 text-sm font-semibold text-slate-900 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 dark:text-white md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
          <span className="inline-flex items-center gap-2">
            <PlusCircle className="h-4 w-4 shrink-0" /> {t('adminCreateShareLink')}
          </span>
        </div>
        <form
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            void createLink(e.currentTarget)
          }}
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            {t('adminExpiresInDays')}
            <input
              name="expiresInDays"
              type="number"
              min={1}
              max={365}
              defaultValue={30}
              className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300 md:col-span-2">
            {t('adminNotesAdminOnly')}
            <textarea
              name="notes"
              rows={3}
              className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder={t('adminNotesPlaceholder')}
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <Link2 className="h-4 w-4" /> {t('adminCreate')}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="sticky top-0 z-10 -mx-5 flex flex-col items-start gap-2 border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:flex-row md:items-center md:justify-between md:gap-3 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <Link2 className="h-4 w-4 shrink-0" /> {t('adminShareLinks')}
          </div>
          <div className="flex w-full flex-wrap items-center gap-1.5 md:w-auto md:gap-2">
            <div className="mr-2 text-[11px] text-slate-600 dark:text-slate-300">
              {t('adminShowingLinks').replace('{visible}', String(visibleLinks.length)).replace('{total}', String(links.length))}
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              aria-pressed={statusFilter === 'active'}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                statusFilter === 'active'
                  ? 'border-sky-400/60 bg-sky-50 text-sky-800 dark:border-sky-500/60 dark:bg-sky-950/40 dark:text-sky-200'
                  : 'border-slate-300/70 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {t('adminStatusActive')}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('revoked')}
              aria-pressed={statusFilter === 'revoked'}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                statusFilter === 'revoked'
                  ? 'border-red-300/70 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200'
                  : 'border-slate-300/70 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60'
              }`}
            >
              <Ban className="h-3.5 w-3.5 shrink-0" /> {t('adminStatusRevoked')}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('expired')}
              aria-pressed={statusFilter === 'expired'}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                statusFilter === 'expired'
                  ? 'border-amber-300/70 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200'
                  : 'border-slate-300/70 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60'
              }`}
            >
              <Clock3 className="h-3.5 w-3.5 shrink-0" /> {t('adminStatusExpired')}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              aria-pressed={statusFilter === 'all'}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                statusFilter === 'all'
                  ? 'border-sky-400/60 bg-sky-50 text-sky-800 dark:border-sky-500/60 dark:bg-sky-950/40 dark:text-sky-200'
                  : 'border-slate-300/70 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60'
              }`}
            >
              {t('adminStatusAll')}
            </button>
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> {t('adminWorking')}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-4 space-y-3 md:hidden">
          {visibleLinks.map((l) => {
            const isRevoked = Boolean(l.revokedAtEpoch)
            const isExpired = !isRevoked && l.expiresAtEpoch <= Math.floor(Date.now() / 1000)
            const shareUrlBase = `${window.location.origin}/?s=${encodeURIComponent(l.rowKey)}`
            const shareUrl = shareLang ? `${shareUrlBase}&lang=${encodeURIComponent(shareLang)}` : shareUrlBase
            return (
              <div key={l.rowKey} className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/20">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{t('adminLink')}</div>
                    {isRevoked ? <div className="text-[11px] text-red-700 dark:text-red-300">{t('adminStatusRevoked')}</div> : null}
                    {isExpired ? <div className="text-[11px] text-amber-700 dark:text-amber-300">{t('adminStatusExpired')}</div> : null}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{t('adminExpires').replace('{date}', epochToIso(l.expiresAtEpoch))}</div>
                </div>
                <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                  {t('adminViews').replace('{count}', String(l.viewCount ?? 0)).replace('{date}', epochToIso(l.lastViewedAtEpoch) || t('adminNever'))}
                </div>
                <a className="mt-2 inline-block break-all font-mono text-[11px] underline" href={shareUrl} target="_blank" rel="noreferrer">
                  /?s={l.rowKey}
                </a>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300/70 px-2 py-1 text-[11px] hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-900/60"
                    onClick={() => void copyShareUrl(shareUrl)}
                  >
                    {t('adminCopy')}
                  </button>
                  <a
                    className="rounded-lg border border-slate-300/70 px-2 py-1 text-[11px] hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/60"
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('adminOpen')} <ExternalLink className="inline h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    disabled={loading || isRevoked}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-300/70 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-950/40"
                    onClick={() => {
                      const confirmed = window.confirm(t('adminRevokeShareConfirm'))
                      if (!confirmed) return
                      void revoke(l.rowKey)
                    }}
                    title={t('adminRevoke')}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {t('adminRevoke')}
                  </button>
                </div>
              </div>
            )
          })}
          {visibleLinks.length === 0 ? (
            <div className="py-2 text-sm text-slate-500 dark:text-slate-400">
              {t('adminNoLinksForFilter')}
            </div>
          ) : null}
        </div>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[36rem] text-left text-xs">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr className="border-b border-slate-200/70 dark:border-slate-800">
                <th className="py-2 pr-3">Expires</th>
                <th className="py-2 pr-3">Views</th>
                <th className="py-2 pr-3">Link</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-800 dark:text-slate-200">
              {visibleLinks.map((l) => {
                const isRevoked = Boolean(l.revokedAtEpoch)
                const isExpired = !isRevoked && l.expiresAtEpoch <= Math.floor(Date.now() / 1000)
                const shareUrlBase = `${window.location.origin}/?s=${encodeURIComponent(l.rowKey)}`
                const shareUrl = shareLang ? `${shareUrlBase}&lang=${encodeURIComponent(shareLang)}` : shareUrlBase
                return (
                  <tr key={l.rowKey} className="border-b border-slate-200/40 dark:border-slate-800/60">
                    <td className="py-2 pr-3">{epochToIso(l.expiresAtEpoch)}</td>
                    <td className="py-2 pr-3">
                      <div>{l.viewCount ?? 0}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{epochToIso(l.lastViewedAtEpoch)}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <a className="font-mono text-[11px] underline" href={shareUrl} target="_blank" rel="noreferrer">
                        /?s={l.rowKey}
                      </a>
                      {isRevoked ? <div className="mt-0.5 text-[11px] text-red-700 dark:text-red-300">{t('adminStatusRevoked')}</div> : null}
                      {isExpired ? <div className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-300">{t('adminStatusExpired')}</div> : null}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-300/70 px-2 py-1 text-[11px] hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-900/60"
                          onClick={() => void copyShareUrl(shareUrl)}
                        >
                          {t('adminCopy')}
                        </button>
                        <a
                          className="rounded-lg border border-slate-300/70 px-2 py-1 text-[11px] hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/60"
                          href={shareUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t('adminOpen')} <ExternalLink className="inline h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          disabled={loading || isRevoked}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-300/70 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-950/40"
                          onClick={() => {
                            const confirmed = window.confirm(t('adminRevokeShareConfirm'))
                            if (!confirmed) return
                            void revoke(l.rowKey)
                          }}
                          title={t('adminRevoke')}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> {t('adminRevoke')}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {visibleLinks.length === 0 ? (
                <tr>
                  <td className="py-4 text-slate-500 dark:text-slate-400" colSpan={4}>
                    {t('adminNoLinksForFilter')}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

