import { hasText } from './text'

/**
 * Only web URLs become link annotations. A PDF reader hands the URI to the OS, so anything else
 * (`javascript:`, `file:`, custom schemes) is dropped and the text prints without a link.
 */
export function pdfWebHref(url: string | undefined | null): string | undefined {
  if (!hasText(url)) return undefined
  try {
    const parsed = new URL(url.trim())
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : undefined
  } catch {
    return undefined
  }
}

export function pdfMailHref(email: string | undefined | null): string | undefined {
  if (!hasText(email)) return undefined
  const trimmed = email.trim()
  return /^[^\s@:/?#]+@[^\s@:/?#]+$/.test(trimmed) ? `mailto:${trimmed}` : undefined
}

/** `tel:` URIs take digits and a leading `+` only; spaces and punctuation are for humans. */
export function pdfTelHref(phone: string | undefined | null): string | undefined {
  if (!hasText(phone)) return undefined
  const digits = phone.trim().replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
  return /\d{3,}/.test(digits) ? `tel:${digits}` : undefined
}

/** `https://www.linkedin.com/in/x/` → `linkedin.com/in/x`: what a reader needs to recognise it. */
export function displayUrl(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '')
}
