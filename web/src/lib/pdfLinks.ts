/**
 * Bare `www.` / missing-scheme URLs would resolve as same-site paths. Add `https:` when needed.
 * `mailto:` / `tel:` are left as-is so the PDF viewer hands them to the OS.
 */
export function normalizePdfAnchorHref(raw: string): string {
  const s = raw.trim()
  if (!s) return s
  if (/^[a-z][a-z0-9+.-]*:/i.test(s) || s.startsWith('//')) return s
  if (/^www\./i.test(s)) return `https://${s}`
  return s
}

/** Visible text for a link: the scheme is noise for `mailto:`/`tel:`, meaningful otherwise. */
export function pdfLinkDisplayText(safeHref: string): string {
  const lower = safeHref.toLowerCase()
  if (lower.startsWith('mailto:')) return safeHref.replace(/^mailto:/i, '')
  if (lower.startsWith('tel:')) return safeHref.replace(/^tel:/i, '')
  return safeHref
}

export function hasPdfUrl(url: string | undefined | null): boolean {
  return url != null && String(url).trim() !== ''
}
