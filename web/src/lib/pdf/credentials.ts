import type { CvCredential } from '../../types/cv'

/**
 * Last instant a credential is still valid, from a free-text expiry like "2026", "2026-11" or
 * "2026-11-30". Partial dates run to the end of the period they name: "2026-03" is valid
 * throughout March. Returns `null` when the value is missing or not a recognisable date.
 */
export function credentialValidUntil(dateExpires: string | undefined | null): Date | null {
  const m = /^\s*(\d{4})(?:-(\d{1,2}))?(?:-(\d{1,2}))?/.exec(dateExpires ?? '')
  if (!m) return null
  const year = Number(m[1])
  const month = m[2] ? Number(m[2]) : null
  const day = m[3] ? Number(m[3]) : null
  if (month != null && (month < 1 || month > 12)) return null

  if (month == null) return new Date(year, 11, 31, 23, 59, 59, 999)
  if (day == null) return new Date(year, month, 0, 23, 59, 59, 999)
  return new Date(year, month - 1, day, 23, 59, 59, 999)
}

/** Unparseable expiry dates are treated as still valid: hiding a real credential is the worse failure. */
export function isCredentialExpired(c: CvCredential, now: Date): boolean {
  const until = credentialValidUntil(c.dateExpires)
  return until != null && until.getTime() < now.getTime()
}

/** Employers reading a printed CV only care about credentials that are currently valid. */
export function printableCredentials(credentials: CvCredential[] | undefined, now: Date): CvCredential[] {
  return (credentials ?? []).filter((c) => !isCredentialExpired(c, now))
}
