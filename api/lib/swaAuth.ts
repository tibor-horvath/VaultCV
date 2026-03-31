import { getHeaderInsensitive } from './httpHeaders'

type ClientPrincipal = {
  identityProvider?: string
  userId?: string
  userDetails?: string
  userRoles?: string[]
  roles?: string[]
  claims?: { typ: string; val: string }[]
}

function decodeBase64(input: string) {
  return Buffer.from(input, 'base64').toString('utf8')
}

export function readClientPrincipal(headers: Record<string, string | undefined> | undefined): ClientPrincipal | null {
  const raw = getHeaderInsensitive(headers, 'x-ms-client-principal')
  if (!raw?.trim()) return null
  try {
    const json = decodeBase64(raw.trim())
    return JSON.parse(json) as ClientPrincipal
  } catch {
    return null
  }
}

export function hasRole(principal: ClientPrincipal | null, role: string) {
  const target = role.toLowerCase()
  const directRoles = [...(principal?.userRoles ?? []), ...(principal?.roles ?? [])]
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean)
  if (directRoles.includes(target)) return true

  const roleClaimTypes = new Set(['role', 'roles', 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'])
  const claimRoles = (principal?.claims ?? [])
    .filter((c) => roleClaimTypes.has((c.typ ?? '').trim().toLowerCase()))
    .flatMap((c) =>
      (c.val ?? '')
        .split(',')
        .map((r) => r.trim().toLowerCase())
        .filter(Boolean),
    )
  return claimRoles.includes(target)
}

export function requireAdmin(headers: Record<string, string | undefined> | undefined) {
  const principal = readClientPrincipal(headers)
  if (!principal || !hasRole(principal, 'admin')) {
    return { ok: false as const }
  }
  return { ok: true as const, principal }
}

