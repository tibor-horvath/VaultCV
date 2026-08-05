const IMAGE_FETCH_TIMEOUT_MS = 15000
const DATA_URL_IMAGE_TIMEOUT_MS = 8000

/** react-pdf `<Image>` decodes JPEG and PNG only — an SVG data URL must fall back to vector art. */
const PROFILE_PHOTO_RASTER = { maxSidePx: 768, mimeType: 'image/jpeg', quality: 0.9 } as const

export type PdfProfilePhoto = { kind: 'image'; src: string } | { kind: 'fallback' }

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

function isSameOrigin(absolute: string) {
  try {
    return new URL(absolute).origin === window.location.origin
  } catch {
    return false
  }
}

async function fetchImageAsDataUrl(absolute: string): Promise<string | null> {
  const controller = typeof AbortController === 'function' ? new AbortController() : undefined
  const timer = setTimeout(() => controller?.abort(), IMAGE_FETCH_TIMEOUT_MS)
  // `/api/private-profile/image` authenticates with the HttpOnly `cv_session` cookie, so the
  // same-origin fetch has to carry credentials or it comes back 401 and the photo silently
  // degrades to the fallback avatar. Cross-origin blob URLs are public and stay uncredentialed —
  // a credentialed request is rejected against `Access-Control-Allow-Origin: *`.
  const sameOrigin = isSameOrigin(absolute)
  try {
    const res = await fetch(absolute, {
      mode: sameOrigin ? 'same-origin' : 'cors',
      credentials: sameOrigin ? 'same-origin' : 'omit',
      ...(controller ? { signal: controller.signal } : {}),
    })
    if (!res.ok) return null
    const blob = await res.blob()
    return await readBlobAsDataUrl(blob)
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function rasterizeLoadedImageToDataUrl(
  img: HTMLImageElement,
  opts: { maxSidePx?: number; mimeType?: string; quality?: number } = {},
): string | null {
  if (!img.complete || img.naturalWidth === 0) return null
  try {
    const maxSidePx = opts.maxSidePx ?? 0
    const longest = Math.max(img.naturalWidth, img.naturalHeight)
    const scale = maxSidePx > 0 && longest > maxSidePx ? maxSidePx / longest : 1
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL(opts.mimeType ?? 'image/png', opts.quality)
  } catch {
    return null
  }
}

function downscaleDataUrlImage(
  dataUrl: string,
  opts: { maxSidePx: number; mimeType: string; quality?: number },
): Promise<string | null> {
  return new Promise((resolve) => {
    let done = false
    const finish = (value: string | null) => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve(value)
    }
    const img = new Image()
    img.decoding = 'sync'
    const timer = setTimeout(() => finish(null), DATA_URL_IMAGE_TIMEOUT_MS)
    img.onload = () => finish(rasterizeLoadedImageToDataUrl(img, opts))
    img.onerror = () => finish(null)
    img.src = dataUrl
  })
}

/**
 * Resolves the profile photo to something react-pdf can embed, ahead of rendering.
 *
 * Letting `<Image src="https://…">` fetch for itself would abort the *whole* render on any CORS
 * or network failure, and would embed the full-resolution original. Pre-resolving keeps the
 * existing CSP surface (`connect-src https://*.blob.core.windows.net`), downscales to keep the
 * file small, and degrades to the vector fallback avatar instead of losing the PDF.
 */
export async function resolvePdfProfilePhoto(src: string): Promise<PdfProfilePhoto> {
  if (!src) return { kind: 'fallback' }
  // The built-in placeholder is an SVG data URL, which react-pdf cannot decode.
  if (src.startsWith('data:image/svg+xml')) return { kind: 'fallback' }
  if (src.startsWith('data:')) return { kind: 'image', src }

  let absolute: string
  try {
    absolute = new URL(src, window.location.href).href
  } catch {
    return { kind: 'fallback' }
  }

  const dataUrl = await fetchImageAsDataUrl(absolute)
  if (!dataUrl) return { kind: 'fallback' }

  const downscaled = await downscaleDataUrlImage(dataUrl, PROFILE_PHOTO_RASTER)
  return { kind: 'image', src: downscaled ?? dataUrl }
}
