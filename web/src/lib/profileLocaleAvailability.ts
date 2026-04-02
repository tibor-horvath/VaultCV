import { normalizeLocale, registeredUiLocales } from '../i18n/localeRegistry'

function normalizeLocaleList(raw: unknown) {
  if (!Array.isArray(raw)) return []
  const unique: string[] = []
  for (const item of raw) {
    const normalized = normalizeLocale(typeof item === 'string' ? item : null)
    if (!normalized) continue
    if (!registeredUiLocales.includes(normalized)) continue
    if (!unique.includes(normalized)) unique.push(normalized)
  }
  return unique
}

export async function fetchProfileScopedLocales(scope: 'public' | 'private') {
  try {
    const res = await fetch(`/api/locales?scope=${scope}`, {
      method: 'GET',
      headers: { accept: 'application/json' },
    })
    if (!res.ok) return null
    const body = (await res.json()) as { locales?: unknown }
    return normalizeLocaleList(body?.locales)
  } catch {
    return null
  }
}