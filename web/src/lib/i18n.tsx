import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { enMessages, type MessageKey } from '../i18n/messages'
import {
  defaultSupportedLocales,
  fallbackLocale,
  getUiDictionary,
  localeStorageKey,
  parseSupportedLocalesCsv,
  resolveSupportedLocale,
  resolveUiLocale,
  toLocaleOptions,
  type Locale,
  type LocaleOption,
} from '../i18n/localeRegistry'

export type { Locale, LocaleOption }

function readPreferredLocaleInput() {
  if (typeof window === 'undefined') return fallbackLocale

  const fromQuery = new URLSearchParams(window.location.search).get('lang')?.trim()
  if (fromQuery) return fromQuery

  const fromStorage = window.localStorage.getItem(localeStorageKey)?.trim()
  if (fromStorage) return fromStorage

  return window.navigator.language
}

function detectInitialLocale(supportedLocales: readonly Locale[]): Locale {
  return resolveSupportedLocale(readPreferredLocaleInput(), supportedLocales) ?? fallbackLocale
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
  supportedLocales: readonly Locale[]
  localeOptions: readonly LocaleOption[]
  t: (key: MessageKey) => string
}

const LocaleContext = createContext<TranslationApi | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [supportedLocales, setSupportedLocales] = useState<Locale[]>(() => [...defaultSupportedLocales])
  const [locale, setLocaleState] = useState<Locale>(() => detectInitialLocale(defaultSupportedLocales))
  const localeOptions = useMemo(() => toLocaleOptions(supportedLocales), [supportedLocales])
  const resolvedUiLocale = useMemo(() => resolveUiLocale(locale), [locale])

  useEffect(() => {
    const controller = new AbortController()
    async function loadSupportedLocales() {
      try {
        const res = await fetch('/api/locales', {
          method: 'GET',
          headers: { accept: 'application/json' },
          signal: controller.signal,
        })
        if (!res.ok) return
        const body = (await res.json()) as { locales?: unknown }
        const csv = Array.isArray(body.locales)
          ? body.locales.filter((x): x is string => typeof x === 'string').join(',')
          : ''
        setSupportedLocales(parseSupportedLocalesCsv(csv))
      } catch {
        // Keep fallback locale set when endpoint is unavailable.
      }
    }
    loadSupportedLocales()
    return () => controller.abort()
  }, [])

  useEffect(() => {
    setLocaleState(detectInitialLocale(supportedLocales))
  }, [supportedLocales])

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
      supportedLocales,
      localeOptions,
      setLocale: (nextLocale: Locale) => {
        setLocaleState(resolveSupportedLocale(nextLocale, supportedLocales) ?? fallbackLocale)
      },
      t: (key) => dict[key] ?? enMessages[key],
    }
  }, [localeOptions, resolvedUiLocale, supportedLocales])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useI18n() {
  const value = useContext(LocaleContext)
  if (!value) {
    throw new Error('useI18n must be used inside LocaleProvider')
  }
  return value
}
