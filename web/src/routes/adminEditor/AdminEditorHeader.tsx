import { ArrowLeft, Languages, LoaderCircle, Save, SquarePen } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { LocaleItem } from './types'

export function AdminEditorHeader(props: {
  locale: string
  locales: LocaleItem[]
  setLocale: (locale: string) => void
  hasUnsavedChanges: boolean
  loading: boolean
  saving: boolean
  onSave: () => void
}) {
  const { locale, locales, setLocale, hasUnsavedChanges, loading, saving, onSave } = props
  const localeSelectId = 'admin-editor-locale-select'
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
            <SquarePen className="h-5 w-5 shrink-0" />
            Profile editor
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">
            Save writes <span className="font-mono">private</span> (full) and <span className="font-mono">public</span> (filtered) JSON.
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor={localeSelectId} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-300">
              <Languages className="h-3.5 w-3.5 shrink-0" /> Locale
            </label>
            <select
              id={localeSelectId}
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="rounded-lg border border-slate-300/70 bg-white px-2 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              {locales.map((l) => (
                <option key={l.locale} value={l.locale}>
                  {l.label ? `${l.label} (${l.locale})` : l.locale}
                </option>
              ))}
            </select>
          </div>
          <Link
            className="text-xs font-medium text-slate-600 underline dark:text-slate-300"
            to="/admin"
            onClick={(event) => {
              if (!hasUnsavedChanges) return
              const confirmed = window.confirm('You have unsaved changes. Leave this page and discard them?')
              if (!confirmed) event.preventDefault()
            }}
          >
            <span className="inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" /> Back to admin
            </span>
          </Link>
          <button
            type="button"
            disabled={loading || saving}
            onClick={onSave}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 sm:w-auto dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {saving ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" /> : <Save className="h-4 w-4 shrink-0" />}{' '}
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </>
  )
}

