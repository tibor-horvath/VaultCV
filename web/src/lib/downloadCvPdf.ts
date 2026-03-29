import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export type PdfLinkRect = {
  href: string
  top: number
  bottom: number
  left: number
  right: number
}

export function a4LayoutMm() {
  const pageW = 210
  const pageH = 297
  const margin = 10
  return { pageW, pageH, margin, contentW: pageW - 2 * margin, contentH: pageH - 2 * margin }
}

export function clipVerticalToPage(
  rectTop: number,
  rectBottom: number,
  pageTop: number,
  pageBottom: number,
): { top: number; bottom: number } | null {
  const t = Math.max(rectTop, pageTop)
  const b = Math.min(rectBottom, pageBottom)
  if (b <= t) return null
  return { top: t, bottom: b }
}

/** Y positions (root-relative CSS px, same space as link rects) where a new PDF page may start. */
export function collectPdfPageBreakTops(root: HTMLElement): number[] {
  const rootRect = root.getBoundingClientRect()
  const scrollY = root.scrollTop
  const nodes = root.querySelectorAll<HTMLElement>('[data-pdf-page-break]')
  const tops: number[] = []
  nodes.forEach((el) => {
    const r = el.getBoundingClientRect()
    tops.push(r.top - rootRect.top + scrollY)
  })
  tops.sort((a, b) => a - b)
  const deduped: number[] = []
  for (const t of tops) {
    if (deduped.length === 0 || Math.abs(t - deduped[deduped.length - 1]!) > 0.5) deduped.push(t)
  }
  return deduped
}

type VerticalRange = { top: number; bottom: number }

/**
 * Areas where a hard raster cut should be avoided. Used for list items so a page break
 * is moved to the item's start instead of slicing text in the middle.
 */
export function collectPdfNoSplitRanges(root: HTMLElement): VerticalRange[] {
  const rootRect = root.getBoundingClientRect()
  const scrollY = root.scrollTop
  const nodes = root.querySelectorAll<HTMLElement>('[data-pdf-no-split]')
  const ranges: VerticalRange[] = []
  nodes.forEach((el) => {
    const r = el.getBoundingClientRect()
    const top = r.top - rootRect.top + scrollY
    const bottom = r.bottom - rootRect.top + scrollY
    if (bottom - top > 0.5) ranges.push({ top, bottom })
  })
  ranges.sort((a, b) => a.top - b.top)
  return ranges
}

/**
 * Vertical slice end positions in canvas px so cuts fall on page-break markers when possible.
 * If no marker fits within maxSlicePx, falls back to a hard cut (single item taller than one page).
 */
export function computePdfSliceEnds(
  canvasHeight: number,
  maxSlicePx: number,
  breakTopsCanvas: number[],
  noSplitRangesCanvas: VerticalRange[] = [],
): number[] {
  const breaks = [...new Set([0, ...breakTopsCanvas, canvasHeight])].sort((a, b) => a - b)

  const ends: number[] = []
  let y = 0
  while (y < canvasHeight - 0.01) {
    const limit = Math.min(y + maxSlicePx, canvasHeight)
    if (limit >= canvasHeight - 0.01) {
      ends.push(canvasHeight)
      break
    }
    const inRange = breaks.filter((c) => c > y && c <= limit)
    let end = inRange.length > 0 ? Math.max(...inRange) : limit
    if (noSplitRangesCanvas.length) {
      // Never cut inside a protected range: move the cut up to the range start
      // (or an earlier break marker), unless the range itself starts at the page top.
      for (let guard = 0; guard < 8; guard += 1) {
        const blocking = noSplitRangesCanvas.find((r) => end > r.top + 0.5 && end < r.bottom - 0.5)
        if (!blocking) break
        const before = breaks.filter((c) => c > y + 0.5 && c <= blocking.top + 0.5)
        const fallback = before.length > 0 ? Math.max(...before) : blocking.top
        if (fallback > y + 0.5) {
          end = fallback
          continue
        }
        // Item starts exactly at page start (or is too tall): unavoidable.
        end = limit
        break
      }
    }
    ends.push(end)
    y = end
  }
  return ends
}

export function collectPdfLinkRects(root: HTMLElement): PdfLinkRect[] {
  const rootRect = root.getBoundingClientRect()
  const scrollX = root.scrollLeft
  const scrollY = root.scrollTop
  const nodes = root.querySelectorAll<HTMLAnchorElement>('a[data-pdf-link]')
  const out: PdfLinkRect[] = []
  nodes.forEach((el) => {
    const href = el.getAttribute('href')
    if (!href) return
    const r = el.getBoundingClientRect()
    const left = r.left - rootRect.left + scrollX
    const top = r.top - rootRect.top + scrollY
    const right = r.right - rootRect.left + scrollX
    const bottom = r.bottom - rootRect.top + scrollY
    out.push({ href, left, top, right, bottom })
  })
  return out
}

function mapRectsToCanvas(rects: PdfLinkRect[], rootW: number, rootH: number, canvasW: number, canvasH: number): PdfLinkRect[] {
  const sx = canvasW / rootW
  const sy = canvasH / rootH
  return rects.map((r) => ({
    href: r.href,
    left: r.left * sx,
    right: r.right * sx,
    top: r.top * sy,
    bottom: r.bottom * sy,
  }))
}

export type DownloadCvPdfOptions = {
  root: HTMLElement
  scale?: number
  fileBaseName?: string
}

/** Wait until all `<img>` under `root` have finished loading (or failed). */
export async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'))
  await Promise.all(
    imgs.map((img) => {
      if (img.complete) return Promise.resolve()
      return new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true })
        img.addEventListener('error', () => resolve(), { once: true })
      })
    }),
  )
  await Promise.all(
    imgs.map((img) => (img.decode ? img.decode().catch(() => undefined) : Promise.resolve())),
  )
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

async function fetchImageAsDataUrl(absolute: string): Promise<string | null> {
  try {
    const res = await fetch(absolute, { mode: 'cors', credentials: 'omit' })
    if (!res.ok) return null
    const blob = await res.blob()
    return await readBlobAsDataUrl(blob)
  } catch {
    return null
  }
}

/**
 * When fetch fails but pixels are already available (CORS-safe), copy to PNG data URL for html2canvas.
 */
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

async function downscaleDataUrlImage(
  dataUrl: string,
  opts: { maxSidePx: number; mimeType: string; quality?: number },
): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'sync'
    img.onload = () => resolve(rasterizeLoadedImageToDataUrl(img, opts))
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

/**
 * Replaces every non-data `img` src with a data URL so html2canvas does not re-fetch in its clone
 * (unreliable on mobile Edge / Safari). Profile photo is processed first.
 */
export async function inlineRemoteImagesForPdfCapture(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'))
  const profile = root.querySelector<HTMLImageElement>('img[data-pdf-profile-photo]')
  const ordered = profile ? [profile, ...imgs.filter((n) => n !== profile)] : imgs

  for (const img of ordered) {
    const isProfilePhoto = img === profile
    const srcAttr = img.getAttribute('src') ?? ''
    if (!srcAttr || srcAttr.startsWith('data:')) continue
    let absolute: string
    try {
      absolute = new URL(srcAttr, window.location.href).href
    } catch {
      continue
    }
    let dataUrl = await fetchImageAsDataUrl(absolute)
    if (isProfilePhoto && dataUrl) {
      // Mobile Edge may drop very large decoded profile images during html2canvas capture.
      const downscaled = await downscaleDataUrlImage(dataUrl, {
        maxSidePx: 768,
        mimeType: 'image/jpeg',
        quality: 0.9,
      })
      if (downscaled) dataUrl = downscaled
    }
    if (!dataUrl) {
      dataUrl = rasterizeLoadedImageToDataUrl(img, {
        ...(isProfilePhoto ? { maxSidePx: 768, mimeType: 'image/jpeg', quality: 0.9 } : {}),
      })
    }
    if (dataUrl) {
      img.src = dataUrl
      img.removeAttribute('crossorigin')
    }
  }
}

/**
 * Off-screen capture (e.g. `left: -10000px`) can prevent decode on mobile browsers. During capture,
 * move the wrapper into the viewport; restore after html2canvas.
 */
function normalizePdfCaptureViewport(root: HTMLElement): () => void {
  const parent = root.parentElement
  if (!parent) return () => {}

  if (parent.getBoundingClientRect().left > -200) return () => {}

  const props = ['position', 'left', 'top', 'z-index', 'transform'] as const
  const prev: Array<[string, string]> = props.map((k) => [k, parent.style.getPropertyValue(k)])

  parent.style.setProperty('position', 'fixed', 'important')
  parent.style.setProperty('left', '0', 'important')
  parent.style.setProperty('top', '0', 'important')
  parent.style.setProperty('z-index', '-9999', 'important')
  parent.style.setProperty('transform', 'none', 'important')

  return () => {
    for (const [k, v] of prev) {
      if (v) parent.style.setProperty(k, v)
      else parent.style.removeProperty(k)
    }
  }
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

/** Narrow or touch UIs: lower scale avoids huge canvases that drop image layers on mobile Edge/Chromium. */
function defaultHtml2canvasScale(requested?: number): number {
  if (requested != null) return requested
  if (typeof window === 'undefined') return 2
  const minDim = Math.min(window.innerWidth, window.innerHeight)
  const coarse =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches
  if (minDim < 768 || (coarse && minDim < 1024)) {
    return 1.25
  }
  return 2
}

/**
 * Single scale from canvas pixels → mm: fit content width to printable width.
 * Using one mmPerPx for both axes keeps aspect ratio (avoids squeezed/stretched PDF).
 * Tall content is split across multiple A4 pages using vertical slices of at most `contentH` mm each.
 */
export function canvasPageSliceHeightPx(contentH_mm: number, contentW_mm: number, canvasWidthPx: number): number {
  const mmPerPx = contentW_mm / canvasWidthPx
  return contentH_mm / mmPerPx
}

/**
 * html2canvas raster + jsPDF with link annotations. CORS: useCORS for remote photos.
 */
export async function downloadCvPdf({ root, scale, fileBaseName = 'cv' }: DownloadCvPdfOptions): Promise<void> {
  const { margin, contentW, contentH } = a4LayoutMm()
  const captureScale = defaultHtml2canvasScale(scale)
  const restoreViewport = normalizePdfCaptureViewport(root)
  let rootW = 0
  let rootH = 0
  let canvas: HTMLCanvasElement
  try {
    await nextFrame()
    await nextFrame()
    await waitForImages(root)
    await inlineRemoteImagesForPdfCapture(root)
    await waitForImages(root)
    await nextFrame()
    rootW = root.offsetWidth
    rootH = root.offsetHeight
    canvas = await html2canvas(root, {
      scale: captureScale,
      useCORS: true,
      allowTaint: false,
      foreignObjectRendering: false,
      imageTimeout: 60000,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: root.scrollWidth,
      windowHeight: root.scrollHeight,
      onclone(clonedDoc) {
        const livePhoto = root.querySelector<HTMLImageElement>('img[data-pdf-profile-photo]')
        const clonePhoto = clonedDoc.querySelector<HTMLImageElement>('img[data-pdf-profile-photo]')
        if (livePhoto && clonePhoto) {
          const src = livePhoto.currentSrc || livePhoto.getAttribute('src') || livePhoto.src
          if (src.startsWith('data:')) {
            clonePhoto.setAttribute('src', src)
          }
        }
        const style = clonedDoc.createElement('style')
        style.textContent = `
        .pdf-print-chip {
          display: inline-grid !important;
          box-sizing: border-box !important;
          align-content: center !important;
          justify-items: center !important;
          text-align: center !important;
          line-height: 1 !important;
          margin: 0 !important;
          -webkit-font-smoothing: antialiased;
        }
        .pdf-print-chip:not(.pdf-print-chip--sm) {
          min-height: 28px;
          padding: 0 calc(12px * 1.05) !important;
        }
        .pdf-print-chip--sm {
          min-height: 24px;
          padding: 0 calc(10px * 1.05) !important;
          font-size: 11px !important;
        }
      `
        clonedDoc.head.appendChild(style)
      },
    })
  } finally {
    restoreViewport()
  }

  const rectsDom = collectPdfLinkRects(root)
  const rects = mapRectsToCanvas(rectsDom, rootW, rootH, canvas.width, canvas.height)

  const breakTopsDom = collectPdfPageBreakTops(root)
  const sy = canvas.height / rootH
  const breakTopsCanvas = breakTopsDom.map((t) => t * sy)
  const noSplitRangesDom = collectPdfNoSplitRanges(root)
  const noSplitRangesCanvas = noSplitRangesDom.map((r) => ({ top: r.top * sy, bottom: r.bottom * sy }))

  const mmPerPx = contentW / canvas.width
  const pageSlicePx = canvasPageSliceHeightPx(contentH, contentW, canvas.width)
  const sliceEnds = computePdfSliceEnds(canvas.height, pageSlicePx, breakTopsCanvas, noSplitRangesCanvas)

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  let pageStartY = 0
  let first = true

  for (const sliceEnd of sliceEnds) {
    const sliceH = sliceEnd - pageStartY
    if (sliceH <= 0) continue
    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvas.width
    sliceCanvas.height = Math.ceil(sliceH)
    const ctx = sliceCanvas.getContext('2d')
    if (!ctx) throw new Error('2d context unavailable')
    ctx.drawImage(canvas, 0, pageStartY, canvas.width, sliceH, 0, 0, canvas.width, sliceH)

    const sliceH_mm = sliceH * mmPerPx
    const imgData = sliceCanvas.toDataURL('image/png')

    if (!first) pdf.addPage()
    first = false
    pdf.addImage(imgData, 'PNG', margin, margin, contentW, sliceH_mm)

    const pageTop = pageStartY
    const pageBottom = pageStartY + sliceH

    for (const r of rects) {
      const clipped = clipVerticalToPage(r.top, r.bottom, pageTop, pageBottom)
      if (!clipped) continue

      const xMm = margin + r.left * mmPerPx
      const wMm = Math.max(0, (r.right - r.left) * mmPerPx)
      const yMm = margin + (clipped.top - pageTop) * mmPerPx
      const hMm = Math.max(0, (clipped.bottom - clipped.top) * mmPerPx)
      if (wMm < 0.5 || hMm < 0.5) continue

      pdf.link(xMm, yMm, wMm, hMm, { url: r.href })
    }

    pageStartY = sliceEnd
  }

  const safe = fileBaseName.replace(/[^\w-]+/g, '_').slice(0, 80) || 'cv'
  pdf.save(`${safe}.pdf`)
}

/** @internal */
export function _mapRectsToCanvas(
  rects: PdfLinkRect[],
  rootW: number,
  rootH: number,
  canvasW: number,
  canvasH: number,
): PdfLinkRect[] {
  return mapRectsToCanvas(rects, rootW, rootH, canvasW, canvasH)
}
