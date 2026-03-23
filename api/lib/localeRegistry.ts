export const fallbackLocale = 'en'

const localePattern = /^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i

export function normalizeLocale(input: string | undefined) {
  const normalized = input?.trim().toLowerCase()
  if (!normalized) return fallbackLocale
  if (!localePattern.test(normalized)) return fallbackLocale
  return normalized
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
  for (const candidate of localeEnvCandidates(prefix, locale)) {
    const raw = process.env[candidate.key]
    if (raw) return { raw, resolvedLocale: candidate.resolvedLocale }
  }
  return { raw: '', resolvedLocale: fallbackLocale }
}
