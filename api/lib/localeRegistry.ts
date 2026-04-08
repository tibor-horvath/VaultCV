import { readProfileJsonV2, readSettingsJson, writeSettingsJson } from './profileBlobStore'

export const fallbackLocale = 'en'
export const defaultSupportedLocales = [fallbackLocale, 'hu', 'de']

const localePattern = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i
const LOCALES_CACHE_TTL_MS = 60_000

const localesCache = new Map<string, { value: string[]; expiresAt: number }>()
const profileLocalesCache = new Map<string, { value: string[]; expiresAt: number }>()
type ProfileKind = 'public' | 'private'

function parseDisabledLocales(locales: unknown) {
  const unique: string[] = []
  if (!Array.isArray(locales)) return unique
  for (const candidate of locales) {
    const locale = parseLocale(typeof candidate === 'string' ? candidate : undefined)
    if (!locale) continue
    if (!unique.includes(locale)) unique.push(locale)
  }
  return unique
}

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
  return parseSupportedLocales((parsed as { supportedLocales?: unknown }).supportedLocales)
}

async function readSettingsObject(slug: string): Promise<Record<string, unknown> | null> {
  const jsonText = await readSettingsJson({ slugFromName: slug })
  if (!jsonText.trim()) return null
  try {
    const parsed = JSON.parse(jsonText)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed as Record<string, unknown>
  } catch {
    return null
  }
}

export async function readDisabledLocalesFromBlob(slug: string) {
  const settings = await readSettingsObject(slug)
  if (!settings) return []
  return parseDisabledLocales(settings.disabledLocales)
}

export async function setLocaleDisabled(slug: string, locale: string, disabled: boolean) {
  const jsonText = await readSettingsJson({ slugFromName: slug })
  let settings: Record<string, unknown> = {}
  if (jsonText.trim()) {
    try {
      const parsed = JSON.parse(jsonText)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        settings = parsed as Record<string, unknown>
      }
    } catch {
      // start with empty settings on parse error
    }
  }

  const existing = parseDisabledLocales(settings.disabledLocales)
  const hasLocale = existing.includes(locale)

  if (disabled && !hasLocale) {
    settings.disabledLocales = [...existing, locale]
  } else if (!disabled && hasLocale) {
    settings.disabledLocales = existing.filter((l) => l !== locale)
  } else {
    return
  }

  await writeSettingsJson({ slugFromName: slug, jsonText: JSON.stringify(settings) })
}

export async function readSupportedLocalesCached(slug: string) {
  const now = Date.now()
  const cached = localesCache.get(slug)
  if (cached && cached.expiresAt > now) {
    return [...cached.value]
  }

  const fromBlob = await readSupportedLocalesFromBlob(slug)
  const nextValue = fromBlob && fromBlob.length ? fromBlob : [...defaultSupportedLocales]
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

  let supported: string[]
  let disabledLocales: string[]
  if (kind === 'private') {
    // Read settings blob once to extract both supported and disabled locales,
    // avoiding a duplicate blob download that would occur if we called
    // readSupportedLocalesCached (on cache miss) and readDisabledLocalesFromBlob separately.
    const settings = await readSettingsObject(slug)
    const fromBlob = settings ? parseSupportedLocales(settings.supportedLocales) : null
    supported = fromBlob && fromBlob.length ? fromBlob : [...defaultSupportedLocales]
    disabledLocales = settings ? parseDisabledLocales(settings.disabledLocales) : []
  } else {
    supported = await readSupportedLocalesCached(slug)
    disabledLocales = []
  }

  const results = await Promise.all(
    supported.map(async (locale) => {
      const raw = await readProfileJsonV2({ kind, locale, slugFromName: slug, legacyFallback: false })
      return { locale, raw }
    }),
  )

  const available: string[] = results
    .filter((result) => result.raw.trim() && !disabledLocales.includes(result.locale))
    .map((result) => result.locale)

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
