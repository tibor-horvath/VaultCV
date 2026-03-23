import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { enMessages, type MessageKey } from '../i18n/messages'
import {
  fallbackLocale,
  getUiDictionary,
  localeOptions,
  localeStorageKey,
  resolveSupportedLocale,
  resolveUiLocale,
  supportedLocales,
  type Locale,
  type LocaleOption,
} from '../i18n/localeRegistry'

export type { Locale, LocaleOption }
export { supportedLocales, localeOptions }

function detectInitialLocale(): Locale {
  if (typeof window === 'undefined') return fallbackLocale

  const fromQuery = resolveSupportedLocale(new URLSearchParams(window.location.search).get('lang'))
  if (fromQuery) return fromQuery

  const fromStorage = resolveSupportedLocale(window.localStorage.getItem(localeStorageKey))
  if (fromStorage) return fromStorage

  return resolveSupportedLocale(window.navigator.language) ?? fallbackLocale
}

function setDocumentLang(locale: Locale) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}

export function buildLocalizedPath(pathname: string, search: string, locale: Locale) {
  const next = new URLSearchParams(search)
  next.set('lang', locale)
  const qs = next.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

type TranslationApi = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey) => string
}

const LocaleContext = createContext<TranslationApi | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => detectInitialLocale())
  const resolvedUiLocale = useMemo(() => resolveUiLocale(locale), [locale])

  useEffect(() => {
    setDocumentLang(resolvedUiLocale)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(localeStorageKey, resolvedUiLocale)
      const url = new URL(window.location.href)
      url.searchParams.set('lang', resolvedUiLocale)
      window.history.replaceState({}, '', `${url.pathname}?${url.searchParams.toString()}${url.hash}`)
    }
  }, [resolvedUiLocale])

  const value = useMemo<TranslationApi>(() => {
    const dict = getUiDictionary(resolvedUiLocale)
    return {
      locale: resolvedUiLocale,
      setLocale: (nextLocale: Locale) => {
        setLocale(resolveSupportedLocale(nextLocale) ?? fallbackLocale)
      },
      t: (key) => dict[key] ?? enMessages[key],
    }
  }, [resolvedUiLocale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useI18n() {
  const value = useContext(LocaleContext)
  if (!value) {
    throw new Error('useI18n must be used inside LocaleProvider')
  }
  return value
}
