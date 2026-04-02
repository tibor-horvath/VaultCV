export type ClientPrincipal = {
  identityProvider?: string
  userId?: string
  userDetails?: string
  userRoles?: string[]
  roles?: string[]
  claims?: { typ: string; val: string }[]
}

export async function fetchAuthMe(): Promise<ClientPrincipal | null> {
  try {
    const res = await fetch('/.auth/me', { credentials: 'same-origin' })
    if (!res.ok) return null
    const text = await res.text()
    if (!text.trim()) return null
    const data = JSON.parse(text) as { clientPrincipal?: ClientPrincipal }
    return data?.clientPrincipal ?? null
  } catch {
    return null
  }
}

export function extractEmailFromPrincipal(principal: ClientPrincipal | null): string {
  if (!principal) return ''
  const claims = principal.claims ?? []
  const byType = (t: string) =>
    claims
      .filter((c) => (c.typ ?? '').trim().toLowerCase() === t)
      .map((c) => (c.val ?? '').trim())
      .find(Boolean) ?? ''

  return (
    byType('http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress') ||
    byType('email') ||
    byType('emails') ||
    byType('preferred_username') ||
    (principal.userDetails ?? '').trim()
  )
}

export async function readJsonOrNull<T>(res: Response): Promise<T | null> {
  try {
    const text = await res.text()
    if (!text.trim()) return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && typeof error.message === 'string' && error.message.trim()) return error.message
  return fallback
}
