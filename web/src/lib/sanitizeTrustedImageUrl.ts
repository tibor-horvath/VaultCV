export function sanitizeTrustedImageUrl(value: string | null | undefined): string | null {
  if (!value || typeof window === 'undefined') return null

  try {
    const resolved = new URL(value, window.location.origin)

    if (resolved.protocol === 'blob:' && value.startsWith(`blob:${window.location.origin}/`)) {
      return value
    }

    const isSameOriginHttp =
      (resolved.protocol === 'http:' || resolved.protocol === 'https:') &&
      resolved.origin === window.location.origin

    if (isSameOriginHttp && resolved.pathname.startsWith('/api/')) {
      return `${resolved.pathname}${resolved.search}${resolved.hash}`
    }
  } catch {
    // Ignore malformed URLs and fall through to null.
  }

  return null
}
