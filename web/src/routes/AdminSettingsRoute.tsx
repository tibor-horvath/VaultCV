import { ExternalLink, KeyRound, LoaderCircle, Save, Settings, Shield, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { registeredUiLocales, sanitizeSupportedLocales, toLocaleOptions } from '../i18n/localeRegistry'
import { redirectToLogin } from '../lib/authRedirect'
import { useI18n } from '../lib/i18n'
import { AdminPageHeader } from './AdminPageHeader'

type ClientPrincipal = {
  identityProvider?: string
  userId?: string
  userDetails?: string
  userRoles?: string[]
  roles?: string[]
  claims?: { typ: string; val: string }[]
}

function normalizeSupportedLocales(raw: unknown) {
  return sanitizeSupportedLocales(Array.isArray(raw) ? raw : [])
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

export function AdminSettingsRoute() {
  const { t } = useI18n()
  const [me, setMe] = useState<ClientPrincipal | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [supportedLocales, setSupportedLocales] = useState<string[]>([])
  const [selectedLocaleToAdd, setSelectedLocaleToAdd] = useState('')
  const [lastSavedSignature, setLastSavedSignature] = useState('[]')

  const isAdmin = useMemo(() => (me?.userRoles ?? []).includes('admin'), [me])
  const signedInEmail = useMemo(() => extractEmailFromPrincipal(me), [me])
  const availableLocaleOptions = useMemo(() => toLocaleOptions(registeredUiLocales), [])
  const addableLocales = useMemo(
    () => availableLocaleOptions.filter((option) => !supportedLocales.includes(option.code)),
    [availableLocaleOptions, supportedLocales],
  )
  const signature = useMemo(() => JSON.stringify(supportedLocales), [supportedLocales])
  const isDirty = signature !== lastSavedSignature

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

  useEffect(() => {
    if (!addableLocales.length) {
      setSelectedLocaleToAdd('')
      return
    }
    if (addableLocales.some((item) => item.code === selectedLocaleToAdd)) return
    setSelectedLocaleToAdd(addableLocales[0]?.code ?? '')
  }, [addableLocales, selectedLocaleToAdd])

  useEffect(() => {
    if (!status) return
    const timer = window.setTimeout(() => setStatus(null), 2500)
    return () => window.clearTimeout(timer)
  }, [status])

  useEffect(() => {
    if (!isDirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  useEffect(() => {
    if (meLoading || !isAdmin) return

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/manage/settings', { credentials: 'same-origin' })
        if (res.status === 401) {
          redirectToLogin('/admin/settings')
          return
        }

        const body = await readJsonOrNull<{ supportedLocales?: unknown; error?: string }>(res)
        if (!res.ok) {
          throw new Error(body?.error || `Request failed (${res.status})`)
        }

        const fromBlob = normalizeSupportedLocales(body?.supportedLocales)
        const initial = fromBlob.length ? fromBlob : [...registeredUiLocales]
        const initialSavedSignature = JSON.stringify(fromBlob.length ? fromBlob : [])
        if (cancelled) return
        setSupportedLocales(initial)
        setLastSavedSignature(initialSavedSignature)
      } catch (e: unknown) {
        if (cancelled) return
        setError(toErrorMessage(e, t('adminLoadSettingsFailed')))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAdmin, meLoading, t])

  async function saveSettings() {
    setSaving(true)
    setError(null)
    setStatus(null)
    try {
      const res = await fetch('/api/manage/settings', {
        method: 'PUT',
        headers: { 'content-type': 'application/json', accept: 'application/json', 'x-cv-admin': '1' },
        credentials: 'same-origin',
        body: JSON.stringify({ supportedLocales }),
      })
      if (res.status === 401) {
        redirectToLogin('/admin/settings')
        return
      }
      const body = await readJsonOrNull<{ error?: string }>(res)
      if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`)
      setLastSavedSignature(signature)
      setStatus(t('adminSettingsSaved'))
    } catch (e: unknown) {
      setError(toErrorMessage(e, t('adminSaveSettingsFailed')))
    } finally {
      setSaving(false)
    }
  }

  function addSelectedLocale() {
    if (!selectedLocaleToAdd) return
    setSupportedLocales((current) => {
      if (current.includes(selectedLocaleToAdd)) return current
      return [...current, selectedLocaleToAdd]
    })
  }

  function removeLocale(code: string) {
    if (code === 'en') return
    setSupportedLocales((current) => current.filter((item) => item !== code))
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
          </div>

          <div className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{t('adminSignInHint')}</div>

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
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">{t('adminNoRole').replace('{email}', signedInEmail || t('adminUnknownUser'))}</div>
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
      <AdminPageHeader
        title={t('adminSettings')}
        icon={<Settings className="h-5 w-5" />}
        signedInEmail={signedInEmail}
        actions={
          <>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-300/70 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800/70"
            >
              {t('adminDashboard')}
            </Link>
            <button
              type="button"
              onClick={() => void saveSettings()}
              disabled={saving || loading || !isDirty}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? t('adminSaving') : t('adminSave')}
            </button>
          </>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/20 dark:text-rose-200">
          {error}
        </div>
      ) : null}
      {status ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">
          {status}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200/70 bg-white/70 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/30">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('adminSupportedLocales')}</h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">{t('adminSupportedLocalesHint')}</p>
        </div>

        {loading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <LoaderCircle className="h-4 w-4 animate-spin" /> {t('loading')}
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {supportedLocales.map((code) => {
                const option = availableLocaleOptions.find((item) => item.code === code)
                return (
                  <span
                    key={code}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300/80 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <span>{option ? `${option.code.toUpperCase()} - ${option.label}` : code.toUpperCase()}</span>
                    <button
                      type="button"
                      onClick={() => removeLocale(code)}
                      disabled={code === 'en'}
                      aria-label={`${t('adminRemoveItem').replace('{index}', code.toUpperCase())}`}
                      className="inline-flex items-center rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )
              })}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={selectedLocaleToAdd}
                onChange={(e) => setSelectedLocaleToAdd(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white sm:w-72"
                disabled={!addableLocales.length}
              >
                {addableLocales.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.code.toUpperCase()} - {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addSelectedLocale}
                disabled={!selectedLocaleToAdd || !addableLocales.length}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                {t('adminAdd')}
              </button>
            </div>
            {!addableLocales.length ? <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t('adminNoMoreLocalesToAdd')}</div> : null}
          </>
        )}
      </section>
    </div>
  )
}
