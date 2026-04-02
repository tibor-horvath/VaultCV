import type { MessageCatalog } from './messages'
import { messages } from './messages'

export type Locale = string

export type LocaleOption = {
  code: Locale
  label: string
  countryCode?: string
}

export const fallbackLocale = 'en'
export const localeStorageKey = 'cv-locale'
/** Used until `GET /api/locales` succeeds (then the server list replaces this). Keeps dev/web-only runs testable in every shipped UI language. */
export const defaultSupportedLocales: Locale[] = [fallbackLocale, 'hu', 'de']

const localePattern = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i

export function normalizeLocale(input: string | null | undefined): Locale | null {
  const trimmed = input?.trim().toLowerCase()
  if (!trimmed) return null
  if (!localePattern.test(trimmed)) return null
  return trimmed
}

export function getLocaleBase(locale: string) {
  return locale.split('-')[0]
}

const localeToCountryCode: Record<string, string> = {
  en: 'GB',
  hu: 'HU',
  cs: 'CZ',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
  pt: 'PT',
  pl: 'PL',
  sk: 'SK',
}

const nativeLocaleLabels: Record<string, string> = {
  en: 'English',
  hu: 'magyar',
  cs: 'čeština',
  de: 'Deutsch',
  fr: 'français',
  es: 'español',
  it: 'italiano',
  pt: 'português',
  pl: 'polski',
  sk: 'slovenčina',
}

function getLocaleLabel(locale: string) {
  const base = getLocaleBase(locale)
  if (nativeLocaleLabels[base]) return nativeLocaleLabels[base]
  try {
    const display = new Intl.DisplayNames([locale], { type: 'language' }).of(base)
    return display ?? locale.toUpperCase()
  } catch {
    return locale.toUpperCase()
  }
}

function hasMessageCatalog(locale: string): locale is keyof typeof messages {
  return locale in messages
}

function hasUiCoverage(locale: string) {
  return hasMessageCatalog(locale) || hasMessageCatalog(getLocaleBase(locale))
}

function validateFallbackCatalogCoverage() {
  if (!hasMessageCatalog(fallbackLocale)) {
    throw new Error(`Missing fallback message catalog for "${fallbackLocale}".`)
  }
}

validateFallbackCatalogCoverage()

export const registeredUiLocales: Locale[] = sanitizeSupportedLocales(Object.keys(messages))

export function sanitizeSupportedLocales(inputs: Array<string | null | undefined>): Locale[] {
  const unique: Locale[] = []
  for (const raw of inputs) {
    const normalized = normalizeLocale(raw)
    if (!normalized) continue
    if (!hasUiCoverage(normalized)) continue
    if (!unique.includes(normalized)) unique.push(normalized)
  }

  if (!unique.includes(fallbackLocale)) unique.unshift(fallbackLocale)
  return unique
}

export function toLocaleOptions(supportedLocales: readonly Locale[]): LocaleOption[] {
  return supportedLocales.map((code) => ({
    code,
    label: getLocaleLabel(code),
    countryCode: localeToCountryCode[getLocaleBase(code)],
  }))
}

export function resolveSupportedLocale(
  input: string | null | undefined,
  supportedLocales: readonly Locale[] = defaultSupportedLocales,
): Locale | null {
  const normalized = normalizeLocale(input)
  if (!normalized) return null
  if (supportedLocales.includes(normalized)) return normalized
  const base = getLocaleBase(normalized)
  if (supportedLocales.includes(base)) return base
  return null
}

export function resolveUiLocale(locale: string): keyof typeof messages {
  if (hasMessageCatalog(locale)) return locale
  const base = getLocaleBase(locale)
  if (hasMessageCatalog(base)) return base
  return fallbackLocale
}

export function getUiDictionary(locale: string): Partial<MessageCatalog> {
  return messages[resolveUiLocale(locale)]
}
