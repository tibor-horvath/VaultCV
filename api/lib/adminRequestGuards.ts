import { getHeaderInsensitive } from './httpHeaders'

export type GuardResult = { ok: true } | { ok: false; status: number; error: string }

function firstHeaderValue(headers: Record<string, string | undefined> | undefined, name: string) {
  const raw = getHeaderInsensitive(headers, name)
  if (!raw?.trim()) return undefined
  return raw.split(',')[0]?.trim() || undefined
}

function parseUrlOrNull(value: string | undefined) {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return null
  try {
    return new URL(trimmed)
  } catch {
    return null
  }
}

export function requireSameOriginMutation(
  headers: Record<string, string | undefined> | undefined,
  opts?: { allowedOrigins?: string[] },
): GuardResult {
  // Defend against CSRF for cookie-authenticated endpoints.
  // Prefer Origin; fall back to Referer when Origin is absent.
  const origin = parseUrlOrNull(getHeaderInsensitive(headers, 'origin'))
  const referer = parseUrlOrNull(getHeaderInsensitive(headers, 'referer'))

  const candidate = origin ?? referer
  if (!candidate) return { ok: false, status: 403, error: 'Missing Origin/Referer.' }

  const allowList = (opts?.allowedOrigins ?? [])
    .map((o) => o.trim())
    .filter(Boolean)
    .map((o) => {
      try {
        return new URL(o).origin
      } catch {
        return null
      }
    })
    .filter(Boolean) as string[]

  const forwardedProto = (firstHeaderValue(headers, 'x-forwarded-proto') ?? '').toLowerCase()
  const proto = forwardedProto === 'https' || forwardedProto === 'http' ? forwardedProto : 'https'
  const host = firstHeaderValue(headers, 'x-forwarded-host') ?? firstHeaderValue(headers, 'host') ?? ''
  const expectedOrigin = host ? `${proto}://${host}` : ''

  // Default: compare browser-supplied Origin to the request host.
  const allowed = allowList.length > 0 ? allowList : expectedOrigin ? [expectedOrigin] : []

  if (allowed.length === 0) return { ok: false, status: 500, error: 'Unable to determine expected origin.' }
  if (!allowed.includes(candidate.origin)) return { ok: false, status: 403, error: 'Cross-site request blocked.' }
  return { ok: true }
}

export function requireJsonContentType(headers: Record<string, string | undefined> | undefined): GuardResult {
  const ct = (getHeaderInsensitive(headers, 'content-type') ?? '').toLowerCase()
  // Azure Functions may include charset, etc.
  if (!ct.includes('application/json')) return { ok: false, status: 415, error: 'Content-Type must be application/json.' }
  return { ok: true }
}

export function requireAdminMutationHeader(headers: Record<string, string | undefined> | undefined): GuardResult {
  // Not a secret; blocks some CSRF vectors (simple form posts) and makes intent explicit.
  const v = (getHeaderInsensitive(headers, 'x-cv-admin') ?? '').trim()
  if (v !== '1') return { ok: false, status: 400, error: 'Missing x-cv-admin header.' }
  return { ok: true }
}

