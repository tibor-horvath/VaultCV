type LinkLike = {
  label: string
  url: string
}

type BasicsLike = {
  name: string
  photoUrl?: string
}

function getFallbackPhotoDataUrl() {
  // CSP allows `img-src 'self' data:` so a data-url SVG is a safe default.
  return (
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#a855f7"/>
            <stop offset="0.5" stop-color="#6366f1"/>
            <stop offset="1" stop-color="#0ea5e9"/>
          </linearGradient>
        </defs>
        <rect width="256" height="256" rx="64" fill="url(#g)"/>
        <circle cx="128" cy="108" r="48" fill="rgba(255,255,255,0.92)"/>
        <path d="M56 220c10-44 44-68 72-68s62 24 72 68" fill="rgba(255,255,255,0.92)"/>
      </svg>`,
    )
  )
}

export function buildPhotoSrc(basics: BasicsLike) {
  if (basics.photoUrl) return basics.photoUrl

  return getFallbackPhotoDataUrl()
}

/**
 * True for http(s) or protocol-relative URLs. Use `crossOrigin="anonymous"` on `<img>` so
 * canvas-based capture (e.g. html2canvas) can read pixels; the image host must send CORS headers.
 */
export function isCrossOriginImageUrl(src: string): boolean {
  return /^https?:\/\//i.test(src) || src.startsWith('//')
}

/**
 * Headlines like "Role · React · Azure" are split: the role is shown as plain text;
 * the rest stays in the skills chip. A single segment (no middle dot) is only the role.
 */
export function parseBasicsHeadline(headline: string): { role: string; chip: string | null } {
  const trimmed = headline.trim()
  if (!trimmed) return { role: '', chip: null }

  const parts = trimmed
    .split(/\s*·\s*/)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length <= 1) {
    return { role: trimmed, chip: null }
  }

  return { role: parts[0]!, chip: parts.slice(1).join(' · ') }
}

export function inferLinkKind(link: LinkLike): 'github' | 'linkedin' | 'other' {
  const label = link.label.toLowerCase()
  if (label.includes('github')) return 'github'
  if (label.includes('linkedin')) return 'linkedin'

  try {
    const host = new URL(link.url).hostname.toLowerCase()
    if (host === 'github.com' || host.endsWith('.github.com')) return 'github'
    if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) return 'linkedin'
  } catch {
    // ignore invalid URLs
  }

  return 'other'
}

/**
 * Project links with labels `github` or `web` (case-insensitive) render as icons next to the project name.
 */
export function inferProjectLinkLabelKind(link: LinkLike): 'github' | 'web' | 'other' {
  const label = link.label.trim().toLowerCase()
  if (label === 'github') return 'github'
  if (label === 'web') return 'web'
  return 'other'
}
