export const fallbackLocale = 'en'

const localePattern = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i
const defaultSupportedLocales = [fallbackLocale]

function normalizeLocaleStrict(input: string | undefined) {
  const normalized = input?.trim().toLowerCase()
  if (!normalized) return null
  if (!localePattern.test(normalized)) return null
  return normalized
}

export function normalizeLocale(input: string | undefined) {
  const normalized = normalizeLocaleStrict(input)
  if (!normalized) return fallbackLocale
  return normalized
}

export function readSupportedLocales() {
  const raw = process.env.SUPPORTED_LOCALES?.trim()
  if (!raw) return [...defaultSupportedLocales]

  const unique: string[] = []
  for (const candidate of raw.split(',')) {
    const locale = normalizeLocaleStrict(candidate)
    if (!locale) continue
    if (!unique.includes(locale)) unique.push(locale)
  }

  if (!unique.includes(fallbackLocale)) unique.unshift(fallbackLocale)
  return unique.length ? unique : [...defaultSupportedLocales]
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
