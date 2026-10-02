import DOMPurify, { type DOMPurify as DOMPurifyInstance } from 'dompurify'

/**
 * Admin-managed branding: a custom tab icon and a footer brandmark. Mirrors `api/lib/branding.ts`,
 * which validates and stores it; images arrive as base64 data URLs.
 */
export type Brandmark =
  | { type: 'image'; src: string; srcDark?: string; alt?: string; href?: string }
  | { type: 'html'; html: string; htmlDark?: string }

export type SiteBranding = {
  favicon?: string
  brandmark?: Brandmark
}

export const MAX_FAVICON_BYTES = 64 * 1024
export const MAX_BRANDMARK_IMAGE_BYTES = 256 * 1024
export const MAX_BRANDMARK_HTML_CHARS = 32 * 1024
export const FAVICON_TYPES = ['image/png', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/jpeg']
export const BRANDMARK_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']

const imageDataUrlPattern = /^data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/]+={0,2}$/i

function isImageDataUrl(value: unknown): value is string {
  return typeof value === 'string' && imageDataUrlPattern.test(value)
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** Defensive parse of a response or cached copy; anything unexpected is dropped, never thrown. */
export function parseSiteBranding(value: unknown): SiteBranding {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const raw = value as Record<string, unknown>
  const branding: SiteBranding = {}
  if (isImageDataUrl(raw.favicon)) branding.favicon = raw.favicon

  const mark = raw.brandmark as Record<string, unknown> | undefined
  if (mark && typeof mark === 'object') {
    if (mark.type === 'image' && isImageDataUrl(mark.src)) {
      branding.brandmark = {
        type: 'image',
        src: mark.src,
        srcDark: isImageDataUrl(mark.srcDark) ? mark.srcDark : undefined,
        alt: optionalString(mark.alt),
        href: optionalString(mark.href),
      }
    } else if (mark.type === 'html' && optionalString(mark.html)) {
      branding.brandmark = { type: 'html', html: mark.html as string, htmlDark: optionalString(mark.htmlDark) }
    }
  }
  return branding
}

/** MIME type of a data URL, e.g. `image/svg+xml`. */
export function dataUrlMimeType(dataUrl: string): string {
  return /^data:([^;,]+)/i.exec(dataUrl)?.[1]?.toLowerCase() ?? ''
}

/** Decoded byte length of a base64 data URL, without decoding it. */
export function dataUrlByteLength(dataUrl: string): number {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - padding
}

const STORAGE_KEY = 'vc_branding'

/** Last branding seen, so the favicon and footer do not flash the defaults on every load. */
export function readCachedBranding(): SiteBranding {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? parseSiteBranding(JSON.parse(raw)) : {}
  } catch {
    return {}
  }
}

export function writeCachedBranding(branding: SiteBranding) {
  try {
    if (branding.favicon || branding.brandmark) localStorage.setItem(STORAGE_KEY, JSON.stringify(branding))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage full or blocked: the cache is only a nicety
  }
}

export async function fetchSiteBranding(): Promise<SiteBranding | null> {
  try {
    const res = await fetch('/api/branding', { credentials: 'same-origin', headers: { accept: 'application/json' } })
    if (!res.ok) return null
    return parseSiteBranding(await res.json())
  } catch {
    return null
  }
}

/** SMIL animation elements. DOMPurify drops `animate`/`set` by default; they are allowed back with a guard. */
const ANIMATION_TAGS = new Set(['animate', 'animatetransform', 'animatemotion', 'set'])

let purifier: DOMPurifyInstance | null = null

function getPurifier(): DOMPurifyInstance {
  if (purifier) return purifier
  const instance = DOMPurify(window)

  instance.addHook('uponSanitizeElement', (node, data) => {
    if (!ANIMATION_TAGS.has(data.tagName) || !(node instanceof Element)) return
    // Animating `href` (or an event handler) is a classic way to smuggle a `javascript:` URL past
    // a sanitizer, so animations may only touch presentation attributes.
    const target = (node.getAttribute('attributeName') ?? '').trim().toLowerCase()
    if (target.includes('href') || target.startsWith('on')) node.remove()
  })

  instance.addHook('afterSanitizeAttributes', (node) => {
    if (node.nodeName.toLowerCase() !== 'a' || !node.hasAttribute('href')) return
    // The brandmark always leaves the CV in a new tab, without handing it a window reference.
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  })

  purifier = instance
  return instance
}

/**
 * Makes an admin-supplied brandmark snippet safe to inject: markup and inline SVG (including SMIL
 * animation) survive; scripts, event handlers, `<style>`, forms, frames, and `style`/`class`
 * attributes do not, so the snippet cannot restyle or overlay the rest of the page.
 */
export function sanitizeBrandmarkHtml(html: string): string {
  return getPurifier().sanitize(html, {
    USE_PROFILES: { html: true, svg: true, svgFilters: true },
    ADD_TAGS: ['animate', 'set'],
    // `target` is overwritten by the link hook; the rest are SMIL timing attributes DOMPurify omits.
    ADD_ATTR: ['target', 'from', 'to', 'by', 'calcMode', 'repeatCount', 'repeatDur', 'restart', 'attributeType', 'keyPoints', 'accumulate', 'end'],
    FORBID_TAGS: ['style', 'form', 'input', 'button', 'textarea', 'select', 'option', 'iframe', 'object', 'embed', 'foreignObject'],
    FORBID_ATTR: ['style', 'class'],
  }) as string
}
