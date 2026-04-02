import { readProfileJsonV2 } from './profileBlobStore'

export const fallbackLocale = 'en'
export const defaultSupportedLocales = [fallbackLocale, 'hu', 'de']

const localePattern = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i
const LOCALES_CACHE_TTL_MS = 60_000

const localesCache = new Map<string, { value: string[]; expiresAt: number }>()
const profileLocalesCache = new Map<string, { value: string[]; expiresAt: number }>()
type ProfileKind = 'public' | 'private'

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

export function invalidateLocalesCache(slug?: string) {
  if (slug !== undefined) {
    localesCache.delete(slug)
    profileLocalesCache.delete(`${slug}:public`)
    profileLocalesCache.delete(`${slug}:private`)
  } else {
    localesCache.clear()
    profileLocalesCache.clear()
  }
}

export async function readSupportedLocalesCached(slug: string) {
  const now = Date.now()
  const cached = localesCache.get(slug)
  if (cached && cached.expiresAt > now) {
    return [...cached.value]
  }

  const nextValue = [...defaultSupportedLocales]
  localesCache.set(slug, {
    value: nextValue,
    expiresAt: now + LOCALES_CACHE_TTL_MS,
  })
  return [...nextValue]
}

export async function readSupportedLocalesForProfileCached(slug: string, kind: ProfileKind) {
  const now = Date.now()
  const cacheKey = `${slug}:${kind}`
  const cached = profileLocalesCache.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return [...cached.value]
  }

  const supported = await readSupportedLocalesCached(slug)
  const available: string[] = []
  for (const locale of supported) {
    const raw = await readProfileJsonV2({ kind, locale, slugFromName: slug, legacyFallback: false })
    if (raw.trim()) {
      available.push(locale)
    }
  }

  profileLocalesCache.set(cacheKey, {
    value: available,
    expiresAt: now + LOCALES_CACHE_TTL_MS,
  })
  return [...available]
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

export function readLocalizedEnvValueWithKey(prefix: string, locale: string) {
  for (const candidate of localeEnvCandidates(prefix, locale)) {
    const raw = process.env[candidate.key]
    if (raw) return { key: candidate.key, raw, resolvedLocale: candidate.resolvedLocale }
  }
  return { key: '', raw: '', resolvedLocale: fallbackLocale }
}
