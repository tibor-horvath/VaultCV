export function getHeaderInsensitive(headers: Record<string, string | undefined> | undefined, name: string) {
  if (!headers) return undefined
  const lower = name.toLowerCase()
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower && typeof v === 'string') return v
  }
  return undefined
}

/** First language tag from an Accept-Language header (RFC 7231). */
export function firstLanguageTagFromAcceptLanguage(header: string | undefined) {
  if (!header?.trim()) return undefined
  const first = header.split(',')[0]?.split(';')[0]?.trim()
  return first || undefined
}
