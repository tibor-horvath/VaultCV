import { useEffect } from 'react'

/** First + last word initials, or first two letters of a single word. Empty when no usable name. */
export function initialsFromName(name: string): string {
  const trimmed = name.trim()
  if (!trimmed || trimmed.toLowerCase() === 'cv') return ''

  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''

  const letter = (word: string) => {
    for (const ch of word) {
      if (/\p{L}/u.test(ch)) return ch.toUpperCase()
    }
    return ''
  }

  if (parts.length === 1) {
    const w = parts[0]!
    const letters = [...w].filter((ch) => /\p{L}/u.test(ch))
    if (letters.length >= 2) return letters[0]!.toUpperCase() + letters[1]!.toUpperCase()
    if (letters.length === 1) return letters[0]!.toUpperCase()
    return ''
  }

  const first = letter(parts[0]!)
  const last = letter(parts[parts.length - 1]!)
  return first + last
}

function escapeSvgText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Slate "CV" icon when initials are unavailable; keep in sync with `web/index.html` favicon link. */
const genericFaviconSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1e293b"/><text x="16" y="16" text-anchor="middle" dominant-baseline="central" fill="#f1f5f9" font-family="ui-sans-serif,system-ui,sans-serif" font-size="14" font-weight="700">CV</text></svg>'

export const GENERIC_FAVICON_HREF = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(genericFaviconSvg)}`

export function faviconHrefFromName(name: string): string {
  const initials = initialsFromName(name)
  if (!initials) return GENERIC_FAVICON_HREF

  const fontSize = initials.length === 1 ? '27' : '20'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1e293b"/><text x="16" y="16" text-anchor="middle" dominant-baseline="central" fill="#f1f5f9" font-family="ui-sans-serif,system-ui,sans-serif" font-size="${fontSize}" font-weight="700">${escapeSvgText(initials)}</text></svg>`

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function useDocumentFavicon(displayName: string) {
  useEffect(() => {
    const link =
      document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
      (() => {
        const el = document.createElement('link')
        el.rel = 'icon'
        el.type = 'image/svg+xml'
        document.head.appendChild(el)
        return el
      })()

    link.href = faviconHrefFromName(displayName)
  }, [displayName])
}
