import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Ban,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  Globe2,
  KeyRound,
  Link2,
  LoaderCircle,
  LogOut,
  PlusCircle,
  QrCode,
  RefreshCw,
  Share2,
  Shield,
  SquarePen,
  Trash2,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useLoadingIndicator } from '../lib/loadingIndicator'
import { redirectToLogin } from '../lib/authRedirect'
import { useI18n } from '../lib/i18n'
import { fetchAuthMe, extractEmailFromPrincipal, readJsonOrNull, toErrorMessage, type ClientPrincipal } from '../lib/adminAuth'
import { IconSelect } from './adminEditor/IconSelect'
import { AdminPageHeader } from './AdminPageHeader'
import { QrCodeModal } from '../components/QrCodeModal'

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
  const [expiresInDays, setExpiresInDays] = useState(30)
  const [showCustomExpiry, setShowCustomExpiry] = useState(false)
  const [newLinkId, setNewLinkId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => readStatusFilterFromUrl())
  const [qrLink, setQrLink] = useState<ShareLink | null>(null)

  const [nowEpoch, setNowEpoch] = useState(() => Math.floor(Date.now() / 1000))

  useEffect(() => {
    const id = setInterval(() => setNowEpoch(Math.floor(Date.now() / 1000)), 60_000)
    return () => clearInterval(id)
  }, [])

  const isAdmin = useMemo(() => (me?.userRoles ?? []).includes('admin'), [me])
  const signedInEmail = useMemo(() => extractEmailFromPrincipal(me), [me])
  const visibleLinks = useMemo(() => {
    if (statusFilter === 'all') return links
    return links.filter((link) => classifyLinkStatus(link, nowEpoch) === statusFilter)
  }, [links, statusFilter, nowEpoch])
  const linkStats = useMemo(() => {
    let active = 0
    let revoked = 0
    let expired = 0
    for (const link of links) {
      const state = classifyLinkStatus(link, nowEpoch)
      if (state === 'active') active += 1
      if (state === 'revoked') revoked += 1
      if (state === 'expired') expired += 1
    }
    return { active, revoked, expired, total: links.length }
  }, [links, nowEpoch])
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

  const createdShareUrl = useMemo(() => {
    if (!newLinkId) return ''
    const base = `${window.location.origin}/?s=${encodeURIComponent(newLinkId)}`
    return shareLang ? `${base}&lang=${encodeURIComponent(shareLang)}` : base
  }, [newLinkId, shareLang])

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

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/manage/links', { credentials: 'same-origin' })
      if (res.status === 401) {
        redirectToLogin('/admin/share')
        return
      }
      if (res.status === 403) {
        setError(t('adminNoRole').replace('{email}', signedInEmail || t('adminUnknownUser')))
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
  }, [signedInEmail, t])

  useEffect(() => {
    if (!meLoading && isAdmin) {
      refresh()
    }
  }, [meLoading, isAdmin, refresh])

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
    setNewLinkId(null)
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
      if (res.status === 403) {
        setError(t('adminNoRole').replace('{email}', signedInEmail || t('adminUnknownUser')))
        return
      }
      const body = await readJsonOrNull<{ id?: string; error?: string }>(res)
      if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`)
      setNewLinkId(body?.id?.trim() || null)
      await refresh()
      form.reset()
      setExpiresInDays(30)
      setShowCustomExpiry(false)
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
      if (res.status === 403) {
        setError(t('adminNoRole').replace('{email}', signedInEmail || t('adminUnknownUser')))
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
    setError(null)
    setStatus(null)
    try {
      await navigator.clipboard.writeText(shareUrl)
      setStatus(t('adminShareLinkCopied'))
    } catch {
      setError(t('adminShareLinkCopyFailed'))
    }
  }

  const showSessionLoader = useLoadingIndicator(meLoading)

  if (meLoading) {
    // Render nothing until the loader is due, so a warm session never flashes a spinner. Falling
    // through here would flash the signed-out page instead.
    return showSessionLoader ? <LoadingSpinner label={t('adminSessionChecking')} className="py-10" /> : null
  }

  if (!me) {
    return (
      <div className="w-full space-y-6 py-10">
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-ink">
              <Shield className="h-5 w-5" />
              <div className="text-lg font-semibold">{t('adminPortal')}</div>
            </div>
            <div className="text-xs text-ink-subtle">{t('adminSecureAccess')}</div>
          </div>

          <div className="mt-3 text-sm leading-relaxed text-ink-muted">
            {t('adminShareSignInHint')}
          </div>

          <div className="mt-4 text-xs leading-relaxed text-ink-muted">
            After signing in, assign yourself the <span className="font-mono">admin</span> role in the Static Web App’s{' '}
            <span className="font-semibold">Role assignments</span>.
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="vc-focusable inline-flex h-11 items-center justify-center gap-2 rounded-field bg-accent px-5 text-sm font-semibold text-accent-ink shadow-card hover:bg-accent-hover active:translate-y-px"
              href="/.auth/login/aad"
            >
              <KeyRound className="h-4 w-4" /> {t('adminSignIn')}
              <ExternalLink className="h-4 w-4 opacity-80" />
            </a>

            <a
              className="text-xs font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
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
        <div className="rounded-card border border-line bg-surface p-6 shadow-card">
          <div className="flex items-center gap-2 text-ink">
            <Shield className="h-5 w-5" />
            <div className="text-lg font-semibold">{t('adminPortal')}</div>
          </div>
          <div className="mt-2 text-sm text-ink-muted">
            {t('adminNoRole').replace('{email}', me.userDetails ?? t('adminUnknownUser'))}
          </div>
          <div className="vc-card-muted mt-4 p-4 text-xs text-ink-muted">
            {t('adminRoleAssignmentHint')}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="vc-focusable inline-flex h-11 items-center justify-center gap-2 rounded-field bg-accent px-5 text-sm font-semibold text-accent-ink shadow-card hover:bg-accent-hover active:translate-y-px"
              href="/.auth/me"
              target="_blank"
              rel="noreferrer"
            >
              {t('adminOpenAuthMe')} <ExternalLink className="h-4 w-4 opacity-80" />
            </a>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/.auth/logout'
              }}
              className="text-xs font-medium text-ink-muted underline underline-offset-4 hover:text-ink"
            >
              {t('adminSignOut')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6 py-8 lg:space-y-8 lg:py-10">
      {qrLink ? (
        <QrCodeModal
          shareUrlBase={`${window.location.origin}/?s=${encodeURIComponent(qrLink.rowKey)}`}
          initialLang={shareLang}
          langOptions={shareLanguageOptions}
          onClose={() => setQrLink(null)}
        />
      ) : null}
      <AdminPageHeader
        title={t('adminShareCv')}
        icon={<Shield className="h-5 w-5" />}
        headingLevel="h1"
        signedInEmail={signedInEmail}
        actions={
          <>
          <Link
            to="/admin"
            className="vc-focusable inline-flex h-8 items-center gap-1.5 rounded-field border border-line bg-surface px-2.5 text-xs font-semibold text-ink-muted shadow-card hover:border-line-strong hover:bg-surface-muted hover:text-ink"
          >
            <Shield className="h-3.5 w-3.5 shrink-0" /> {t('adminDashboard')}
          </Link>
          <Link
            to="/admin/editor"
            className="vc-focusable inline-flex h-8 items-center gap-1.5 rounded-field border border-line bg-surface px-2.5 text-xs font-semibold text-ink-muted shadow-card hover:border-line-strong hover:bg-surface-muted hover:text-ink"
          >
            <SquarePen className="h-3.5 w-3.5 shrink-0" /> {t('adminEditCv')}
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={() => refresh()}
            className="vc-focusable inline-flex h-8 items-center gap-1.5 rounded-field border border-line bg-surface px-2.5 text-xs font-semibold text-ink-muted shadow-card hover:border-line-strong hover:bg-surface-muted hover:text-ink disabled:pointer-events-none disabled:opacity-55"
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" /> {t('adminRefresh')}
          </button>
          <a className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted underline underline-offset-4" href="/.auth/logout">
            <LogOut className="h-3.5 w-3.5 shrink-0" /> {t('adminSignOut')}
          </a>
          </>
        }
      />

      <section className="grid grid-cols-2 gap-3 rounded-card border border-line bg-surface p-4 shadow-card sm:grid-cols-4">
        <div className="rounded-card border border-line bg-surface px-3 py-3">
          <div className="vc-eyebrow">{t('adminStatusActive')}</div>
          <div className="mt-1 text-xl font-semibold text-ink">{linkStats.active}</div>
        </div>
        <div className="rounded-card border border-line bg-surface px-3 py-3">
          <div className="vc-eyebrow">{t('adminStatusRevoked')}</div>
          <div className="mt-1 text-xl font-semibold text-ink">{linkStats.revoked}</div>
        </div>
        <div className="rounded-card border border-line bg-surface px-3 py-3">
          <div className="vc-eyebrow">{t('adminStatusExpired')}</div>
          <div className="mt-1 text-xl font-semibold text-ink">{linkStats.expired}</div>
        </div>
        <div className="rounded-card border border-line bg-surface px-3 py-3">
          <div className="vc-eyebrow">{t('adminStatusAll')}</div>
          <div className="mt-1 text-xl font-semibold text-ink">{linkStats.total}</div>
        </div>
      </section>

      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-field border border-critical/25 bg-critical-soft px-4 py-3 text-sm text-critical-soft-ink"
        >
          {error}
        </div>
      ) : null}
      {status ? (
        <div
          role="status"
          aria-live="polite"
          className="rounded-field border border-positive/25 bg-positive-soft px-4 py-3 text-sm text-positive-soft-ink"
        >
          {status}
        </div>
      ) : null}

      <div className="rounded-card border border-line bg-surface p-5 shadow-card">
        <div className="sticky top-0 z-10 -mx-5 border-b border-line bg-surface px-5 py-2 text-sm font-semibold text-ink backdrop-blur md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
          <span className="inline-flex items-center gap-2">
            <PlusCircle className="h-4 w-4 shrink-0" /> {t('adminCreateShareLink')}
          </span>
        </div>
        <form
          className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            void createLink(e.currentTarget)
          }}
        >
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
            {t('adminExpiresInDays')}
            <div role="group" aria-label={t('adminExpiresInDays')} className="flex flex-wrap gap-1.5">
              {([7, 14, 30, 90] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  aria-pressed={!showCustomExpiry && expiresInDays === d}
                  onClick={() => { setExpiresInDays(d); setShowCustomExpiry(false) }}
                  className={`rounded-md border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                    !showCustomExpiry && expiresInDays === d
                      ? 'border-transparent bg-accent text-accent-ink'
                      : 'border-line text-ink-subtle hover:border-line-strong hover:bg-surface-muted'
                  }`}
                >
                  {d}d
                </button>
              ))}
              <button
                type="button"
                aria-pressed={showCustomExpiry}
                onClick={() => setShowCustomExpiry(true)}
                className={`rounded-md border px-2.5 py-0.5 text-[11px] font-semibold transition ${
                  showCustomExpiry
                    ? 'border-transparent bg-accent text-accent-ink'
                    : 'border-line text-ink-subtle hover:border-line-strong hover:bg-surface-muted'
                }`}
              >
                Custom…
              </button>
            </div>
            {showCustomExpiry ? (
              <input
                name="expiresInDays"
                type="number"
                min={1}
                max={365}
                step={1}
                value={expiresInDays}
                autoFocus
                onChange={(e) => {
                  const raw = e.target.value
                  if (raw === '' || isNaN(Number(raw))) return
                  const n = Math.min(365, Math.max(1, Math.trunc(Number(raw))))
                  setExpiresInDays(n)
                }}
                className="vc-field"
              />
            ) : null}
          </label>
          {localeOptions.length > 1 ? (
            <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted">
              <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5 shrink-0" /> {t('adminShareLanguage')}</span>
              <div className="text-xs">
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
          <label className="flex flex-col gap-1.5 text-xs font-medium text-ink-muted md:col-span-2">
            {t('adminNotesAdminOnly')}
            <textarea
              name="notes"
              rows={2}
              className="vc-field"
              placeholder={t('adminNotesPlaceholder')}
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="vc-focusable inline-flex h-9 items-center gap-2 rounded-field bg-accent px-4 text-sm font-semibold text-accent-ink shadow-card hover:bg-accent-hover active:translate-y-px disabled:pointer-events-none disabled:opacity-55"
            >
              {loading ? (
                <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" />
              ) : (
                <Link2 className="h-4 w-4" aria-hidden="true" />
              )}
              {loading ? t('adminWorking') : t('adminCreate')}
            </button>
          </div>
        </form>
        {newLinkId ? (
          <div className="mt-4 rounded-field border border-positive/25 bg-positive-soft/60 p-3">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-positive-soft-ink">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> {t('adminShareLinkCreated')}
              </span>
              <button
                type="button"
                onClick={() => setNewLinkId(null)}
                aria-label="Dismiss"
                className="rounded p-0.5 text-positive-soft-ink hover:bg-positive-soft"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={createdShareUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-field border border-positive/25 bg-surface px-3 py-1.5 font-mono text-xs text-ink-muted"
              />
              <button
                type="button"
                onClick={() => void copyShareUrl(createdShareUrl)}
                className="inline-flex shrink-0 items-center gap-1 rounded-field border border-line px-2.5 py-1.5 text-xs font-medium hover:bg-surface-muted"
              >
                <Copy className="h-3.5 w-3.5" /> {t('adminCopy')}
              </button>
              <button
                type="button"
                onClick={() => setQrLink({ rowKey: newLinkId, createdAtEpoch: 0, expiresAtEpoch: 0 })}
                className="inline-flex shrink-0 items-center gap-1 rounded-field border border-line px-2.5 py-1.5 text-xs font-medium hover:bg-surface-muted"
              >
                <QrCode className="h-3.5 w-3.5" /> {t('adminQrCode')}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-card border border-line bg-surface p-5 shadow-card">
        <div className="sticky top-0 z-10 -mx-5 flex flex-col items-start gap-2 border-b border-line bg-surface px-5 py-2 backdrop-blur md:static md:mx-0 md:flex-row md:items-center md:justify-between md:gap-3 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
            <Link2 className="h-4 w-4 shrink-0" /> {t('adminShareLinks')}
          </div>
          <div className="flex w-full flex-wrap items-center gap-1.5 md:w-auto md:gap-2">
            <div className="mr-2 text-[11px] text-ink-muted">
              {t('adminShowingLinks').replace('{visible}', String(visibleLinks.length)).replace('{total}', String(links.length))}
            </div>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              aria-pressed={statusFilter === 'active'}
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                statusFilter === 'active'
                  ? 'border-accent/40 bg-accent-soft text-accent-soft-ink'
                  : 'border-line text-ink-muted hover:bg-surface-muted'
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
                  ? 'border-red-300/70 bg-critical-soft text-critical-soft-ink'
                  : 'border-line text-ink-muted hover:bg-surface-muted'
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
                  ? 'border-caution/30 bg-caution-soft text-caution-soft-ink'
                  : 'border-line text-ink-muted hover:bg-surface-muted'
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
                  ? 'border-accent/40 bg-accent-soft text-accent-soft-ink'
                  : 'border-line text-ink-muted hover:bg-surface-muted'
              }`}
            >
              {t('adminStatusAll')}
            </button>
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <LoaderCircle className="h-3.5 w-3.5 motion-safe:animate-spin" /> {t('adminWorking')}
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
              <div key={l.rowKey} className="rounded-field border border-line bg-surface p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{t('adminLink')}</div>
                    {isRevoked ? <div className="text-[11px] text-critical-soft-ink">{t('adminStatusRevoked')}</div> : null}
                    {isExpired ? <div className="text-[11px] text-caution-soft-ink">{t('adminStatusExpired')}</div> : null}
                  </div>
                  <div className="text-[11px] text-ink-subtle">{t('adminExpires').replace('{date}', epochToIso(l.expiresAtEpoch))}</div>
                </div>
                <div className="mt-1 text-[11px] text-ink-muted">
                  {t('adminViews').replace('{count}', String(l.viewCount ?? 0)).replace('{date}', epochToIso(l.lastViewedAtEpoch) || t('adminNever'))}
                </div>
                {l.notes?.trim() ? (
                  <div className="mt-1 text-[11px] text-ink-muted">
                    <span className="font-semibold">{t('adminNotes')}:</span> {l.notes.trim()}
                  </div>
                ) : null}
                <a className="mt-2 inline-block break-all font-mono text-[11px] underline" href={shareUrl} target="_blank" rel="noreferrer">
                  /?s={l.rowKey}
                </a>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-field border border-line px-2 py-1 text-[11px] hover:bg-surface-muted disabled:opacity-55"
                    onClick={() => void copyShareUrl(shareUrl)}
                  >
                    {t('adminCopy')}
                  </button>
                  {'share' in navigator ? (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-field border border-line px-2 py-1 text-[11px] hover:bg-surface-muted"
                      onClick={() =>
                        void navigator
                          .share({ url: shareUrl })
                          .catch((e: unknown) => {
                            if (e instanceof Error && e.name === 'AbortError') return
                            // Log non-abort share errors instead of re-throwing to avoid unhandled promise rejections.
                            console.error('navigator.share failed', e)
                          })
                      }
                    >
                      <Share2 className="h-3.5 w-3.5" /> {t('adminShareAction')}
                    </button>
                  ) : null}
                  <a
                    className="rounded-field border border-line px-2 py-1 text-[11px] hover:bg-surface-muted"
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('adminOpen')} <ExternalLink className="inline h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-field border border-line px-2 py-1 text-[11px] hover:bg-surface-muted"
                    onClick={() => setQrLink(l)}
                  >
                    <QrCode className="h-3.5 w-3.5" /> {t('adminQrCode')}
                  </button>
                  <button
                    type="button"
                    disabled={loading || isRevoked}
                    className="inline-flex items-center gap-1 rounded-field border border-red-300/70 px-2 py-1 text-[11px] text-critical-soft-ink hover:bg-critical-soft disabled:opacity-55"
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
            <div className="py-2 text-sm text-ink-subtle">
              {t('adminNoLinksForFilter')}
            </div>
          ) : null}
        </div>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[44rem] text-left text-xs">
            <thead className="text-ink-subtle">
              <tr className="border-b border-line">
                <th className="py-2 pr-3">{t('adminColumnExpires')}</th>
                <th className="py-2 pr-3">{t('adminColumnViews')}</th>
                <th className="py-2 pr-3">{t('adminLink')}</th>
                <th className="py-2 pr-3">{t('adminNotes')}</th>
                <th className="py-2 pr-3">{t('adminColumnActions')}</th>
              </tr>
            </thead>
            <tbody className="text-ink">
              {visibleLinks.map((l) => {
                const isRevoked = Boolean(l.revokedAtEpoch)
                const isExpired = !isRevoked && l.expiresAtEpoch <= Math.floor(Date.now() / 1000)
                const shareUrlBase = `${window.location.origin}/?s=${encodeURIComponent(l.rowKey)}`
                const shareUrl = shareLang ? `${shareUrlBase}&lang=${encodeURIComponent(shareLang)}` : shareUrlBase
                return (
                  <tr key={l.rowKey} className="border-b border-line/40">
                    <td className="py-2 pr-3">{epochToIso(l.expiresAtEpoch)}</td>
                    <td className="py-2 pr-3">
                      <div>{l.viewCount ?? 0}</div>
                      <div className="text-[11px] text-ink-subtle">{epochToIso(l.lastViewedAtEpoch)}</div>
                    </td>
                    <td className="py-2 pr-3 align-top">
                      <a className="font-mono text-[11px] underline" href={shareUrl} target="_blank" rel="noreferrer">
                        /?s={l.rowKey}
                      </a>
                      {isRevoked ? <div className="mt-0.5 text-[11px] text-critical-soft-ink">{t('adminStatusRevoked')}</div> : null}
                      {isExpired ? <div className="mt-0.5 text-[11px] text-caution-soft-ink">{t('adminStatusExpired')}</div> : null}
                    </td>
                    <td className="max-w-[14rem] py-2 pr-3 align-top text-[11px] text-ink-muted">
                      {l.notes?.trim() ? <span className="break-words">{l.notes.trim()}</span> : <span className="text-ink-subtle">—</span>}
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-field border border-line px-2 py-1 text-[11px] hover:bg-surface-muted disabled:opacity-55"
                          onClick={() => void copyShareUrl(shareUrl)}
                        >
                          {t('adminCopy')}
                        </button>
                        {'share' in navigator ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-field border border-line px-2 py-1 text-[11px] hover:bg-surface-muted"
                            onClick={() =>
                              void navigator
                                .share({ url: shareUrl })
                                .catch((e: unknown) => {
                                  if (e instanceof Error && e.name === 'AbortError') return
                                  // Log unexpected share errors instead of rethrowing to avoid unhandled promise rejections
                                  console.error('navigator.share failed', e)
                                })
                            }
                          >
                            <Share2 className="h-3.5 w-3.5" /> {t('adminShareAction')}
                          </button>
                        ) : null}
                        <a
                          className="rounded-field border border-line px-2 py-1 text-[11px] hover:bg-surface-muted"
                          href={shareUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {t('adminOpen')} <ExternalLink className="inline h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-field border border-line px-2 py-1 text-[11px] hover:bg-surface-muted"
                          onClick={() => setQrLink(l)}
                        >
                          <QrCode className="h-3.5 w-3.5" /> {t('adminQrCode')}
                        </button>
                        <button
                          type="button"
                          disabled={loading || isRevoked}
                          className="inline-flex items-center gap-1 rounded-field border border-red-300/70 px-2 py-1 text-[11px] text-critical-soft-ink hover:bg-critical-soft disabled:opacity-55"
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
                  <td className="py-4 text-ink-subtle" colSpan={5}>
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

