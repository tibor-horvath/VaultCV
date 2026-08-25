import type { MouseEvent } from 'react'
import { GripVertical, Languages, Link2, LoaderCircle, LogOut, Save, Shield, SquarePen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { LanguageSelector } from '../../components/LanguageSelector'
import type { LocaleItem } from './types'
import { AdminPageHeader } from '../AdminPageHeader'
import { useI18n } from '../../lib/i18n'
import { ToggleButton } from './ToggleButton'

export function AdminEditorHeader(props: {
  locale: string
  locales: LocaleItem[]
  addableLocales: LocaleItem[]
  setLocale: (locale: string) => void
  onAddLocale: (locale: string) => void
  isLocaleEnabled: boolean
  onToggleLocaleEnabled: (enabled: boolean) => void
  hasUnsavedChanges: boolean
  loading: boolean
  saving: boolean
  signedInEmail?: string
  onSave: () => void
  onOpenReorderSheet?: () => void
}) {
  const { locale, locales, addableLocales, setLocale, onAddLocale, isLocaleEnabled, onToggleLocaleEnabled, hasUnsavedChanges, loading, saving, signedInEmail, onSave, onOpenReorderSheet } = props
  const { t } = useI18n()
  const [newLocale, setNewLocale] = useState('')
  const localeSelectId = 'admin-editor-locale-select'
  const addLocaleSelectId = 'admin-editor-add-locale-select'
  const confirmIfDirty = (event: MouseEvent<HTMLElement>) => {
    if (!hasUnsavedChanges) return
    const confirmed = window.confirm(t('adminUnsavedLeaveConfirm'))
    if (!confirmed) event.preventDefault()
  }
  return (
    <AdminPageHeader
      title={t('adminEditCv')}
      icon={<SquarePen className="h-5 w-5" />}
      headingLevel="h1"
      signedInEmail={signedInEmail}
      actions={
        <div className="flex w-full max-w-full flex-wrap items-center justify-end gap-2 sm:gap-3">
          <Link
            to="/admin"
            onClick={(event) => confirmIfDirty(event)}
            className="vc-focusable inline-flex h-8 items-center gap-1.5 rounded-field border border-line bg-surface px-2.5 text-xs font-semibold text-ink-muted shadow-card hover:border-line-strong hover:bg-surface-muted hover:text-ink"
          >
            <Shield className="h-3.5 w-3.5 shrink-0" /> {t('adminDashboard')}
          </Link>
          <Link
            to="/admin/share"
            onClick={(event) => confirmIfDirty(event)}
            className="vc-focusable inline-flex h-8 items-center gap-1.5 rounded-field border border-line bg-surface px-2.5 text-xs font-semibold text-ink-muted shadow-card hover:border-line-strong hover:bg-surface-muted hover:text-ink"
          >
            <Link2 className="h-3.5 w-3.5 shrink-0" /> {t('adminShareCv')}
          </Link>
          <LanguageSelector />
          <label
            htmlFor={localeSelectId}
            className="flex min-w-0 max-w-full flex-wrap items-center gap-2 rounded-field border border-line px-3 py-1.5 text-xs font-medium text-ink-muted"
          >
            <span className="inline-flex min-w-0 items-center gap-1">
              <Languages className="h-3.5 w-3.5 shrink-0" /> {t('adminCvLocale')}
            </span>
            <select
              id={localeSelectId}
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className="rounded-field border border-line bg-surface px-2 py-1.5 text-xs font-semibold text-ink-muted"
            >
              {locales.map((l) => (
                <option key={l.locale} value={l.locale}>
                  {l.label ? `${l.label} (${l.locale})` : l.locale}
                </option>
              ))}
            </select>
          </label>
          <ToggleButton
            pressed={isLocaleEnabled}
            onClick={() => onToggleLocaleEnabled(!isLocaleEnabled)}
            title={t('adminLocaleVisibilityTitle')}
            label={t('adminCvLocale')}
            pressedLabel={t('adminEnabled')}
            unpressedLabel={t('adminDisabled')}
          />
          {addableLocales.length ? (
            <div className="flex items-center gap-2 rounded-field border border-line px-3 py-1.5 text-xs font-medium text-ink-muted">
              <label htmlFor={addLocaleSelectId}>{t('adminAddLanguage')}</label>
              <select
                id={addLocaleSelectId}
                value={newLocale}
                onChange={(e) => setNewLocale(e.target.value)}
                className="rounded-field border border-line bg-surface px-2 py-1.5 text-xs font-semibold text-ink-muted"
              >
                <option value="">{t('adminAuto')}</option>
                {addableLocales.map((l) => (
                  <option key={l.locale} value={l.locale}>
                    {l.label ? `${l.label} (${l.locale})` : l.locale}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!newLocale}
                onClick={() => {
                  if (!newLocale) return
                  onAddLocale(newLocale)
                  setNewLocale('')
                }}
                className="vc-focusable inline-flex h-7 items-center gap-1 rounded-field border border-line bg-surface px-2 text-xs font-semibold text-ink-muted shadow-card hover:border-line-strong hover:bg-surface-muted hover:text-ink disabled:pointer-events-none disabled:opacity-55"
              >
                {t('adminAdd')}
              </button>
            </div>
          ) : null}
          {onOpenReorderSheet ? (
            <button
              type="button"
              onClick={onOpenReorderSheet}
              className="inline-flex items-center gap-2 rounded-field border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted shadow-card transition hover:bg-surface-muted lg:hidden"
            >
              <GripVertical className="h-3.5 w-3.5 shrink-0" /> {t('adminReorderSections')}
            </button>
          ) : null}
          <button
            type="button"
            disabled={loading || saving}
            onClick={onSave}
            className="vc-focusable inline-flex h-8 items-center gap-1.5 rounded-field border border-line bg-surface px-2.5 text-xs font-semibold text-ink-muted shadow-card hover:border-line-strong hover:bg-surface-muted hover:text-ink disabled:opacity-55"
          >
            {saving ? <LoaderCircle className="h-4 w-4 shrink-0 motion-safe:animate-spin" /> : <Save className="h-4 w-4 shrink-0" />}{' '}
            {saving ? t('adminSaving') : t('adminSave')}
          </button>
          <a
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted underline"
            href="/.auth/logout"
            onClick={(event) => confirmIfDirty(event)}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" /> {t('adminSignOut')}
          </a>
        </div>
      }
    />
  )
}

