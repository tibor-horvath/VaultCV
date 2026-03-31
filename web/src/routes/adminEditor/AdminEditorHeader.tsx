import { Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { LocaleItem } from './types'

type ProfileKind = 'public' | 'private'

export function AdminEditorHeader(props: {
  profileKind: ProfileKind
  locale: string
  locales: LocaleItem[]
  setLocale: (locale: string) => void
  loading: boolean
  onSave: () => void
}) {
  const { profileKind, locale, locales, setLocale, loading, onSave } = props
  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            Editor: {profileKind === 'public' ? 'Public profile' : 'Private CV'}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">
            This writes JSON to Blob Storage via <span className="font-mono">/api/manage/profile/{profileKind}</span>.
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">Locale</span>
            <select
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
          <Link className="text-xs font-medium text-slate-600 underline dark:text-slate-300" to="/admin">
            Back to admin
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={onSave}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60 sm:w-auto dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            <Save className="h-4 w-4" /> Save
          </button>
        </div>
      </div>

      <div className="flex gap-3 text-xs">
        <Link
          to="/admin/editor/public"
          className={`rounded-lg border px-3 py-1.5 ${
            profileKind === 'public'
              ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
              : 'border-slate-300/70 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60'
          }`}
        >
          Public
        </Link>
        <Link
          to="/admin/editor/private"
          className={`rounded-lg border px-3 py-1.5 ${
            profileKind === 'private'
              ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
              : 'border-slate-300/70 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60'
          }`}
        >
          Private
        </Link>
      </div>
    </>
  )
}

