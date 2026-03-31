import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, KeyRound, Link2, LoaderCircle, Pencil, Shield, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { redirectToLogin } from '../lib/authRedirect'
import { useI18n } from '../lib/i18n'

type ClientPrincipal = {
  userDetails?: string
  userRoles?: string[]
}

type ShareLink = {
  rowKey: string
  label: string
  sharedWith?: string
  notes?: string
  createdAtEpoch: number
  expiresAtEpoch: number
  revokedAtEpoch?: number
  lastViewedAtEpoch?: number
  viewCount?: number
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

async function readJsonOrNull<T>(res: Response): Promise<T | null> {
  try {
    const text = await res.text()
    if (!text.trim()) return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

function epochToIso(epoch: number | undefined) {
  if (!epoch || !Number.isFinite(epoch) || epoch <= 0) return ''
  return new Date(epoch * 1000).toISOString().slice(0, 10)
}

export function AdminRoute() {
  const { localeOptions } = useI18n()
  const [me, setMe] = useState<ClientPrincipal | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  const [links, setLinks] = useState<ShareLink[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareLang, setShareLang] = useState<string>('')

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

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/manage/links', { credentials: 'same-origin' })
      if (res.status === 401) {
        redirectToLogin('/admin')
        return
      }
      const body = await readJsonOrNull<{ links?: ShareLink[]; error?: string }>(res)
      if (!res.ok) {
        throw new Error(body?.error || `Request failed (${res.status})`)
      }
      setLinks(body?.links ?? [])
    } catch (e: any) {
      setError(e?.message ?? 'Failed loading share links.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!meLoading && isAdmin) {
      refresh()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meLoading, isAdmin])

  async function createLink(form: HTMLFormElement) {
    const fd = new FormData(form)
    const label = String(fd.get('label') ?? '')
    const sharedWith = String(fd.get('sharedWith') ?? '')
    const notes = String(fd.get('notes') ?? '')
    const expiresInDays = Number.parseInt(String(fd.get('expiresInDays') ?? '30'), 10)
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/manage/links', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          label,
          sharedWith: sharedWith.trim() ? sharedWith : undefined,
          notes: notes.trim() ? notes : undefined,
          expiresInDays: Number.isFinite(expiresInDays) ? expiresInDays : 30,
        }),
      })
      if (res.status === 401) {
        redirectToLogin('/admin')
        return
      }
      const body = await readJsonOrNull<{ id?: string; error?: string }>(res)
      if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`)
      await refresh()
      form.reset()
    } catch (e: any) {
      setError(e?.message ?? 'Failed creating share link.')
    } finally {
      setLoading(false)
    }
  }

  async function revoke(id: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/manage/links/${encodeURIComponent(id)}/revoke`, {
        method: 'POST',
        headers: { accept: 'application/json' },
        credentials: 'same-origin',
      })
      if (res.status === 401) {
        redirectToLogin('/admin')
        return
      }
      const body = await readJsonOrNull<{ ok?: boolean; error?: string }>(res)
      if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`)
      await refresh()
    } catch (e: any) {
      setError(e?.message ?? 'Failed revoking share link.')
    } finally {
      setLoading(false)
    }
  }

  if (meLoading) {
    return (
      <div className="w-full space-y-4 py-10">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <LoaderCircle className="h-4 w-4 animate-spin" /> Checking admin session…
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
              <div className="text-lg font-semibold">Admin portal</div>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Secure access</div>
          </div>

          <div className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            Sign in with Entra ID to manage share links and edit your public/private profile content.
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
              <KeyRound className="h-4 w-4" /> Sign in
              <ExternalLink className="h-4 w-4 opacity-80" />
            </a>

            <a
              className="text-xs font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              href="/.auth/me"
              target="_blank"
              rel="noreferrer"
            >
              View current identity (`/.auth/me`)
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
            <div className="text-lg font-semibold">Admin portal</div>
          </div>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            You’re signed in as <span className="font-mono">{me.userDetails ?? 'unknown'}</span>, but you don’t have the{' '}
            <span className="font-mono">admin</span> role yet.
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/20 dark:text-slate-300">
            In Azure Portal → Static Web App → Role assignments: add role <span className="font-mono">admin</span> to the
            identity you see in <span className="font-mono">/.auth/me</span>.
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <a
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              href="/.auth/me"
              target="_blank"
              rel="noreferrer"
            >
              Open `/.auth/me` <ExternalLink className="h-4 w-4 opacity-80" />
            </a>
            <a className="text-xs font-medium text-slate-600 underline underline-offset-4 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" href="/.auth/logout">
              Sign out
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-3 py-10 sm:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          <Shield className="h-5 w-5" />
          <div className="text-lg font-semibold">Admin</div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
          {localeOptions.length > 1 ? (
            <label className="flex items-center gap-2 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">
              Share language
              <select
                value={shareLang}
                onChange={(e) => setShareLang(e.target.value)}
                className="rounded-md border border-slate-300/70 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                <option value="">Auto</option>
                {localeOptions.map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.code.toUpperCase()} — {o.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Link
            to="/admin/editor/private"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit CV
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={() => refresh()}
            className="rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            Refresh
          </button>
          <a className="text-xs font-medium text-slate-600 underline dark:text-slate-300" href="/.auth/logout">
            Sign out
          </a>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="sticky top-0 z-10 -mx-5 border-b border-slate-200/70 bg-white/95 px-5 py-2 text-sm font-semibold text-slate-900 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 dark:text-white md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
          Create share link
        </div>
        <form
          className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault()
            void createLink(e.currentTarget)
          }}
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Label
            <input
              name="label"
              required
              className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="Recruiter link"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Shared with (admin-only)
            <input
              name="sharedWith"
              className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="ACME Recruiting"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
            Expires in (days)
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
            Notes (admin-only)
            <textarea
              name="notes"
              rows={3}
              className="rounded-lg border border-slate-300/70 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="Role / date / context…"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              <Link2 className="h-4 w-4" /> Create
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white/60 p-5 dark:border-slate-800 dark:bg-slate-950/30">
        <div className="sticky top-0 z-10 -mx-5 flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white/95 px-5 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:static md:mx-0 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-white">Share links</div>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> Working…
            </div>
          ) : null}
        </div>

        <div className="mt-4 space-y-3 md:hidden">
          {links.map((l) => {
            const isRevoked = Boolean(l.revokedAtEpoch)
            const shareUrlBase = `${window.location.origin}/?s=${encodeURIComponent(l.rowKey)}`
            const shareUrl = shareLang ? `${shareUrlBase}&lang=${encodeURIComponent(shareLang)}` : shareUrlBase
            return (
              <div key={l.rowKey} className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/20">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">{l.label}</div>
                    {isRevoked ? <div className="text-[11px] text-red-700 dark:text-red-300">Revoked</div> : null}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Expires: {epochToIso(l.expiresAtEpoch)}</div>
                </div>
                <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300">Shared with: {l.sharedWith ?? '-'}</div>
                <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
                  Views: {l.viewCount ?? 0} ({epochToIso(l.lastViewedAtEpoch) || 'never'})
                </div>
                <a className="mt-2 inline-block break-all font-mono text-[11px] underline" href={shareUrl} target="_blank" rel="noreferrer">
                  /?s={l.rowKey}
                </a>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-slate-300/70 px-2 py-1 text-[11px] hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-900/60"
                    onClick={() => void navigator.clipboard.writeText(shareUrl)}
                  >
                    Copy
                  </button>
                  <a
                    className="rounded-lg border border-slate-300/70 px-2 py-1 text-[11px] hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/60"
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open <ExternalLink className="inline h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    disabled={loading || isRevoked}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-300/70 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-950/40"
                    onClick={() => void revoke(l.rowKey)}
                    title="Revoke"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Revoke
                  </button>
                </div>
              </div>
            )
          })}
          {links.length === 0 ? <div className="py-2 text-sm text-slate-500 dark:text-slate-400">No links yet.</div> : null}
        </div>

        <div className="mt-4 hidden overflow-x-auto md:block">
          <table className="w-full min-w-[44rem] text-left text-xs">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr className="border-b border-slate-200/70 dark:border-slate-800">
                <th className="py-2 pr-3">Label</th>
                <th className="py-2 pr-3">Shared with</th>
                <th className="py-2 pr-3">Expires</th>
                <th className="py-2 pr-3">Views</th>
                <th className="py-2 pr-3">Link</th>
                <th className="py-2 pr-3">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-800 dark:text-slate-200">
              {links.map((l) => {
                const isRevoked = Boolean(l.revokedAtEpoch)
                const shareUrlBase = `${window.location.origin}/?s=${encodeURIComponent(l.rowKey)}`
                const shareUrl = shareLang ? `${shareUrlBase}&lang=${encodeURIComponent(shareLang)}` : shareUrlBase
                return (
                  <tr key={l.rowKey} className="border-b border-slate-200/40 dark:border-slate-800/60">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{l.label}</div>
                      {isRevoked ? (
                        <div className="mt-0.5 text-[11px] text-red-700 dark:text-red-300">Revoked</div>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3">{l.sharedWith ?? ''}</td>
                    <td className="py-2 pr-3">{epochToIso(l.expiresAtEpoch)}</td>
                    <td className="py-2 pr-3">
                      <div>{l.viewCount ?? 0}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{epochToIso(l.lastViewedAtEpoch)}</div>
                    </td>
                    <td className="py-2 pr-3">
                      <a className="font-mono text-[11px] underline" href={shareUrl} target="_blank" rel="noreferrer">
                        /?s={l.rowKey}
                      </a>
                    </td>
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-300/70 px-2 py-1 text-[11px] hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-900/60"
                          onClick={() => void navigator.clipboard.writeText(shareUrl)}
                        >
                          Copy
                        </button>
                        <a
                          className="rounded-lg border border-slate-300/70 px-2 py-1 text-[11px] hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900/60"
                          href={shareUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open <ExternalLink className="inline h-3.5 w-3.5" />
                        </a>
                        <button
                          type="button"
                          disabled={loading || isRevoked}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-300/70 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/60 dark:text-red-200 dark:hover:bg-red-950/40"
                          onClick={() => void revoke(l.rowKey)}
                          title="Revoke"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Revoke
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {links.length === 0 ? (
                <tr>
                  <td className="py-4 text-slate-500 dark:text-slate-400" colSpan={6}>
                    No links yet.
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

