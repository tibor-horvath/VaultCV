import { readSettingsJson } from './profileBlobStore'

export const fallbackLocale = 'en'
export const defaultSupportedLocales = [fallbackLocale]

const localePattern = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i
const LOCALES_CACHE_TTL_MS = 60_000

let localesCache: { value: string[]; expiresAt: number } | null = null

export function parseLocale(input: string | undefined) {
  const normalized = input?.trim().toLowerCase()
  if (!normalized) return null
  if (!localePattern.test(normalized)) return null
  return normalized
}

export function normalizeLocale(input: string | undefined) {
  const normalized = parseLocale(input)
  if (!normalized) return fallbackLocale
  return normalized
}

function parseSupportedLocales(locales: unknown) {
  const unique: string[] = []
  if (!Array.isArray(locales)) return null

  for (const candidate of locales) {
    const locale = parseLocale(typeof candidate === 'string' ? candidate : undefined)
    if (!locale) continue
    if (!unique.includes(locale)) unique.push(locale)
  }

  if (!unique.includes(fallbackLocale)) unique.unshift(fallbackLocale)
  return unique.length ? unique : null
}

export async function readSupportedLocalesFromBlob(slug: string) {
  const jsonText = await readSettingsJson({ slugFromName: slug })
  if (!jsonText.trim()) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    return null
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
  const supportedLocales = (parsed as { supportedLocales?: unknown }).supportedLocales
  return parseSupportedLocales(supportedLocales)
}

export function invalidateLocalesCache() {
  localesCache = null
}

export async function readSupportedLocalesCached(slug: string) {
  const now = Date.now()
  if (localesCache && localesCache.expiresAt > now) {
    return [...localesCache.value]
  }

  const fromBlob = await readSupportedLocalesFromBlob(slug)
  const nextValue = fromBlob && fromBlob.length ? fromBlob : [...defaultSupportedLocales]
  localesCache = {
    value: nextValue,
    expiresAt: now + LOCALES_CACHE_TTL_MS,
  }
  return [...nextValue]
}

export function localeEnvCandidates(prefix: string, locale: string) {
  const base = locale.split('-')[0]
  const exact = `${prefix}_${locale.toUpperCase().replace(/-/g, '_')}`
  const baseName = `${prefix}_${base.toUpperCase()}`
  return exact === baseName
    ? [
        { key: exact, resolvedLocale: base },
        { key: prefix, resolvedLocale: fallbackLocale },
      ]
    : [
        { key: exact, resolvedLocale: locale },
        { key: baseName, resolvedLocale: base },
        { key: prefix, resolvedLocale: fallbackLocale },
      ]
}

export function readLocalizedEnvJson(prefix: string, locale: string) {
  return readLocalizedEnvValue(prefix, locale)
}

export function readLocalizedEnvValue(prefix: string, locale: string) {
  const result = readLocalizedEnvValueWithKey(prefix, locale)
  return { raw: result.raw, resolvedLocale: result.resolvedLocale }
}

export function readLocalizedEnvValueWithKey(prefix: string, locale: string) {
  for (const candidate of localeEnvCandidates(prefix, locale)) {
    const raw = process.env[candidate.key]
    if (raw) return { key: candidate.key, raw, resolvedLocale: candidate.resolvedLocale }
  }
  return { key: '', raw: '', resolvedLocale: fallbackLocale }
}
