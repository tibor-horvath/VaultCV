import { readBrandingJson, writeBrandingJson } from './profileBlobStore'

/**
 * Site branding the admin can change at runtime: the tab icon and an optional brandmark in the
 * footer (e.g. a "Built by" badge).
 *
 * Images travel as base64 data URLs inside the JSON document, so the public site needs no extra
 * endpoints and the CSP (`img-src data:`) already allows them. The brandmark can instead be an HTML
 * snippet; that is stored as-is here and sanitized by the browser right before it is rendered.
 */

export type Brandmark =
  | { type: 'image'; src: string; srcDark?: string; alt?: string; href?: string }
  | { type: 'html'; html: string; htmlDark?: string }

export type Branding = {
  favicon?: string
  brandmark?: Brandmark
}

export const MAX_FAVICON_BYTES = 64 * 1024
export const MAX_BRANDMARK_IMAGE_BYTES = 256 * 1024
export const MAX_BRANDMARK_HTML_CHARS = 32 * 1024
const MAX_ALT_CHARS = 200
const MAX_HREF_CHARS = 2048

const FAVICON_TYPES = ['image/png', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/jpeg']
const BRANDMARK_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml']

const dataUrlPattern = /^data:([a-z0-9.+/-]+);base64,([A-Za-z0-9+/]+={0,2})$/i

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string }

function startsWithBytes(buffer: Buffer, bytes: number[]) {
  return bytes.every((b, i) => buffer[i] === b)
}

/** Checks the bytes really are the declared type, so a mislabelled upload cannot slip through. */
function matchesMagic(mimeType: string, buffer: Buffer) {
  switch (mimeType) {
    case 'image/png':
      return startsWithBytes(buffer, [0x89, 0x50, 0x4e, 0x47])
    case 'image/jpeg':
      return startsWithBytes(buffer, [0xff, 0xd8, 0xff])
    case 'image/x-icon':
    case 'image/vnd.microsoft.icon':
      return startsWithBytes(buffer, [0x00, 0x00, 0x01, 0x00])
    case 'image/svg+xml':
      return /<svg[\s>]/i.test(buffer.toString('utf8'))
    default:
      return false
  }
}

function parseImageDataUrl(value: unknown, field: string, allowedTypes: string[], maxBytes: number): Parsed<string> {
  if (typeof value !== 'string') return { ok: false, error: `${field} must be a data URL.` }
  const match = dataUrlPattern.exec(value.trim())
  if (!match) return { ok: false, error: `${field} must be a base64 data URL.` }

  const mimeType = match[1]!.toLowerCase()
  if (!allowedTypes.includes(mimeType)) {
    return { ok: false, error: `${field} must be one of: ${allowedTypes.join(', ')}.` }
  }

  const buffer = Buffer.from(match[2]!, 'base64')
  if (buffer.byteLength === 0) return { ok: false, error: `${field} is empty.` }
  if (buffer.byteLength > maxBytes) {
    return { ok: false, error: `${field} exceeds the maximum size of ${Math.round(maxBytes / 1024)} KB.` }
  }
  if (!matchesMagic(mimeType, buffer)) return { ok: false, error: `${field} content does not match ${mimeType}.` }

  return { ok: true, value: `data:${mimeType};base64,${match[2]}` }
}

function parseOptionalText(value: unknown, field: string, maxChars: number): Parsed<string | undefined> {
  if (value === undefined || value === null) return { ok: true, value: undefined }
  if (typeof value !== 'string') return { ok: false, error: `${field} must be a string.` }
  const trimmed = value.trim()
  if (trimmed.length > maxChars) return { ok: false, error: `${field} is too long.` }
  return { ok: true, value: trimmed || undefined }
}

function parseOptionalHref(value: unknown): Parsed<string | undefined> {
  const text = parseOptionalText(value, 'brandmark.href', MAX_HREF_CHARS)
  if (!text.ok || !text.value) return text
  let url: URL
  try {
    url = new URL(text.value)
  } catch {
    return { ok: false, error: 'brandmark.href must be an absolute URL.' }
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return { ok: false, error: 'brandmark.href must be an http(s) URL.' }
  }
  return { ok: true, value: url.toString() }
}

function parseHtml(value: unknown, field: string, required: boolean): Parsed<string | undefined> {
  const text = parseOptionalText(value, field, MAX_BRANDMARK_HTML_CHARS)
  if (!text.ok) return text
  if (required && !text.value) return { ok: false, error: `${field} is required.` }
  return text
}

function parseBrandmark(value: unknown): Parsed<Brandmark | undefined> {
  if (value === undefined || value === null) return { ok: true, value: undefined }
  if (typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'brandmark must be an object.' }
  const raw = value as Record<string, unknown>

  if (raw.type === 'image') {
    const src = parseImageDataUrl(raw.src, 'brandmark.src', BRANDMARK_IMAGE_TYPES, MAX_BRANDMARK_IMAGE_BYTES)
    if (!src.ok) return src
    let srcDark: string | undefined
    if (raw.srcDark !== undefined && raw.srcDark !== null && raw.srcDark !== '') {
      const parsed = parseImageDataUrl(raw.srcDark, 'brandmark.srcDark', BRANDMARK_IMAGE_TYPES, MAX_BRANDMARK_IMAGE_BYTES)
      if (!parsed.ok) return parsed
      srcDark = parsed.value
    }
    const alt = parseOptionalText(raw.alt, 'brandmark.alt', MAX_ALT_CHARS)
    if (!alt.ok) return alt
    const href = parseOptionalHref(raw.href)
    if (!href.ok) return href

    const brandmark: Brandmark = { type: 'image', src: src.value }
    if (srcDark) brandmark.srcDark = srcDark
    if (alt.value) brandmark.alt = alt.value
    if (href.value) brandmark.href = href.value
    return { ok: true, value: brandmark }
  }

  if (raw.type === 'html') {
    const html = parseHtml(raw.html, 'brandmark.html', true)
    if (!html.ok) return html
    const htmlDark = parseHtml(raw.htmlDark, 'brandmark.htmlDark', false)
    if (!htmlDark.ok) return htmlDark

    const brandmark: Brandmark = { type: 'html', html: html.value! }
    if (htmlDark.value) brandmark.htmlDark = htmlDark.value
    return { ok: true, value: brandmark }
  }

  return { ok: false, error: 'brandmark.type must be "image" or "html".' }
}

/** Validates an admin-submitted branding document and returns its normalized form. */
export function parseBranding(value: unknown): Parsed<Branding> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'Body must be a JSON object.' }
  const raw = value as Record<string, unknown>

  const branding: Branding = {}
  if (raw.favicon !== undefined && raw.favicon !== null && raw.favicon !== '') {
    const favicon = parseImageDataUrl(raw.favicon, 'favicon', FAVICON_TYPES, MAX_FAVICON_BYTES)
    if (!favicon.ok) return favicon
    branding.favicon = favicon.value
  }

  const brandmark = parseBrandmark(raw.brandmark)
  if (!brandmark.ok) return brandmark
  if (brandmark.value) branding.brandmark = brandmark.value

  return { ok: true, value: branding }
}

const BRANDING_CACHE_TTL_MS = 60_000
const brandingCache = new Map<string, { value: Branding; expiresAt: number }>()

/** Reads the stored branding. A missing or unreadable document means "no branding", not an error. */
export async function readBranding(slug: string): Promise<Branding> {
  const jsonText = await readBrandingJson({ slugFromName: slug })
  if (!jsonText.trim()) return {}
  try {
    const parsed = parseBranding(JSON.parse(jsonText))
    return parsed.ok ? parsed.value : {}
  } catch {
    return {}
  }
}

export async function readBrandingCached(slug: string): Promise<Branding> {
  const now = Date.now()
  const cached = brandingCache.get(slug)
  if (cached && cached.expiresAt > now) return cached.value

  const value = await readBranding(slug)
  brandingCache.set(slug, { value, expiresAt: now + BRANDING_CACHE_TTL_MS })
  return value
}

export async function writeBranding(slug: string, branding: Branding) {
  await writeBrandingJson({ slugFromName: slug, jsonText: JSON.stringify(branding) })
  brandingCache.delete(slug)
}

export function invalidateBrandingCache() {
  brandingCache.clear()
}
