import type { CvCredential, CvCredentialIssuer } from '../../../../types/cv'
import { hasText } from '../../../../lib/pdf/text'
import type { PdfT } from './primitives'

/** Shared by the print and modern layouts, so both describe dates and credentials identically. */

/**
 * `cncf` was missing from the original print layout's issuer list, so CNCF credentials were
 * silently dropped from the PDF. Included here so no credential is lost.
 */
const CREDENTIAL_ISSUER_ORDER: CvCredentialIssuer[] = [
  'microsoft',
  'aws',
  'google',
  'cncf',
  'school',
  'language',
  'other',
]

export function orderCredentials(credentials: CvCredential[]): CvCredential[] {
  return CREDENTIAL_ISSUER_ORDER.flatMap((issuer) => credentials.filter((c) => c.issuer === issuer))
}

/** Vendor names add context to a certificate title; generic groups ("Other") would only add noise. */
export function issuerDetail(issuer: CvCredentialIssuer): string | undefined {
  if (issuer === 'microsoft') return 'Microsoft'
  if (issuer === 'aws') return 'AWS'
  if (issuer === 'google') return 'Google'
  if (issuer === 'cncf') return 'CNCF'
  return undefined
}

export function dateRange(start: string | undefined, end: string | undefined, t: PdfT): string {
  if (!hasText(start) && !hasText(end)) return ''
  if (!hasText(start)) return end!.trim()
  return `${start.trim()} – ${hasText(end) ? end.trim() : t('present')}`
}

export function credentialDates(c: CvCredential, t: PdfT): string {
  if (hasText(c.dateEarned) && hasText(c.dateExpires)) return `${c.dateEarned.trim()} – ${c.dateExpires.trim()}`
  if (hasText(c.dateEarned)) return c.dateEarned.trim()
  if (hasText(c.dateExpires)) return `${t('expires')} ${c.dateExpires.trim()}`
  return ''
}

export function credentialKey(c: CvCredential, i: number): string {
  return `${c.issuer}:${c.label}:${c.dateEarned ?? ''}:${c.dateExpires ?? ''}:${i}`
}
