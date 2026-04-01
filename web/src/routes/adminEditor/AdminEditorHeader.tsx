import type { MouseEvent } from 'react'
import { Languages, Link2, LoaderCircle, LogOut, Save, Shield, SquarePen } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { LocaleItem } from './types'
import { AdminPageHeader } from '../AdminPageHeader'

export function AdminEditorHeader(props: {
  locale: string
  locales: LocaleItem[]
  setLocale: (locale: string) => void
  hasUnsavedChanges: boolean
  loading: boolean
  saving: boolean
  signedInEmail?: string
  onSave: () => void
}) {
  const { locale, locales, setLocale, hasUnsavedChanges, loading, saving, signedInEmail, onSave } = props
  const localeSelectId = 'admin-editor-locale-select'
  const confirmIfDirty = (event: MouseEvent<HTMLElement>) => {
    if (!hasUnsavedChanges) return
    const confirmed = window.confirm('You have unsaved changes. Leave this page and discard them?')
    if (!confirmed) event.preventDefault()
  }
  return (
    <AdminPageHeader
      title="Edit CV"
      icon={<SquarePen className="h-5 w-5" />}
      signedInEmail={signedInEmail}
      actions={
        <>
          <Link
            to="/admin"
            onClick={(event) => confirmIfDirty(event)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            <Shield className="h-3.5 w-3.5 shrink-0" /> Dashboard
          </Link>
          <Link
            to="/admin/share"
            onClick={(event) => confirmIfDirty(event)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            <Link2 className="h-3.5 w-3.5 shrink-0" /> Share CV
          </Link>
          <label
            htmlFor={localeSelectId}
            className="flex items-center gap-2 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300"
          >
            <span className="inline-flex items-center gap-1">
              <Languages className="h-3.5 w-3.5 shrink-0" /> Locale
            </span>
            <select
              id={localeSelectId}
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="rounded-lg border border-slate-300/70 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {locales.map((l) => (
                <option key={l.locale} value={l.locale}>
                  {l.label ? `${l.label} (${l.locale})` : l.locale}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={loading || saving}
            onClick={onSave}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            {saving ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" /> : <Save className="h-4 w-4 shrink-0" />}{' '}
            {saving ? 'Saving...' : 'Save'}
          </button>
          <a
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 underline dark:text-slate-300"
            href="/.auth/logout"
            onClick={(event) => confirmIfDirty(event)}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" /> Sign out
          </a>
        </>
      }
    />
  )
}

