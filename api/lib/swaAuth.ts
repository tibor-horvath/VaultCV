type ClientPrincipal = {
  identityProvider?: string
  userId?: string
  userDetails?: string
  userRoles?: string[]
  claims?: { typ: string; val: string }[]
}

function decodeBase64(input: string) {
  return Buffer.from(input, 'base64').toString('utf8')
}

export function readClientPrincipal(headers: Record<string, string | undefined> | undefined): ClientPrincipal | null {
  const raw = headers?.['x-ms-client-principal'] ?? headers?.['X-MS-CLIENT-PRINCIPAL']
  if (!raw?.trim()) return null
  try {
    const json = decodeBase64(raw.trim())
    return JSON.parse(json) as ClientPrincipal
  } catch {
    return null
  }
}

export function hasRole(principal: ClientPrincipal | null, role: string) {
  const roles = principal?.userRoles ?? []
  return roles.map((r) => r.toLowerCase()).includes(role.toLowerCase())
}

export function requireAdmin(headers: Record<string, string | undefined> | undefined) {
  const principal = readClientPrincipal(headers)
  if (!principal || !hasRole(principal, 'admin')) {
    return { ok: false as const }
  }
  return { ok: true as const, principal }
}

