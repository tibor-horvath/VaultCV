import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { isCrossOriginImageUrl } from './cvPresentation'

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

/**
 * Vertical slice end positions in canvas px so cuts fall on page-break markers when possible.
 * If no marker fits within maxSlicePx, falls back to a hard cut (single item taller than one page).
 */
export function computePdfSliceEnds(canvasHeight: number, maxSlicePx: number, breakTopsCanvas: number[]): number[] {
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
    const end = inRange.length > 0 ? Math.max(...inRange) : limit
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

/**
 * Fetches remote http(s) images and replaces `src` with a data URL so html2canvas does not rely
 * on a second load (problematic on mobile / iOS). Requires blob CORS and CSP `connect-src`
 * for the image host.
 */
export async function inlineRemoteImagesForPdfCapture(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll('img'))
  for (const img of imgs) {
    const srcAttr = img.getAttribute('src') ?? ''
    if (!srcAttr || srcAttr.startsWith('data:')) continue
    if (!isCrossOriginImageUrl(srcAttr)) continue
    let absolute: string
    try {
      absolute = new URL(srcAttr, window.location.href).href
    } catch {
      continue
    }
    try {
      const res = await fetch(absolute, { mode: 'cors', credentials: 'omit' })
      if (!res.ok) continue
      const blob = await res.blob()
      const dataUrl = await readBlobAsDataUrl(blob)
      img.src = dataUrl
      img.removeAttribute('crossorigin')
    } catch {
      // CORS, CSP, or network
    }
  }
}

/** Mobile Safari often hits canvas/memory limits at scale 2; slightly lower scale keeps photos in the raster. */
function defaultHtml2canvasScale(requested?: number): number {
  if (requested != null) return requested
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return 1.5
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
  await waitForImages(root)
  await inlineRemoteImagesForPdfCapture(root)
  await waitForImages(root)
  const rootW = root.offsetWidth
  const rootH = root.offsetHeight

  const canvas = await html2canvas(root, {
    scale: captureScale,
    useCORS: true,
    allowTaint: false,
    imageTimeout: 30000,
    logging: false,
    backgroundColor: '#ffffff',
    scrollX: 0,
    scrollY: 0,
    windowWidth: root.scrollWidth,
    windowHeight: root.scrollHeight,
    onclone(clonedDoc) {
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

  const rectsDom = collectPdfLinkRects(root)
  const rects = mapRectsToCanvas(rectsDom, rootW, rootH, canvas.width, canvas.height)

  const breakTopsDom = collectPdfPageBreakTops(root)
  const sy = canvas.height / rootH
  const breakTopsCanvas = breakTopsDom.map((t) => t * sy)

  const mmPerPx = contentW / canvas.width
  const pageSlicePx = canvasPageSliceHeightPx(contentH, contentW, canvas.width)
  const sliceEnds = computePdfSliceEnds(canvas.height, pageSlicePx, breakTopsCanvas)

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
