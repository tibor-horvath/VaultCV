import { getBrand } from './brand'

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatLocalTimestamp(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = pad2(date.getMonth() + 1)
  const dd = pad2(date.getDate())
  const hh = pad2(date.getHours())
  const min = pad2(date.getMinutes())
  const ss = pad2(date.getSeconds())
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`
}

export function buildPdfGeneratedAtFooter(date?: Date, brand = getBrand()): string {
  return `Generated on ${formatLocalTimestamp(date ?? new Date())} by ${brand.displayName} (${brand.repoUrl})`
}

/**
 * The repo URL is rendered as its own `<Link>`, so the footer is composed from three parts.
 * (The raster pipeline needed this split for manual text-width math; react-pdf just needs the pieces.)
 */
export function buildPdfGeneratedAtFooterParts(date?: Date, brand = getBrand()) {
  return {
    prefix: `Generated on ${formatLocalTimestamp(date ?? new Date())} by ${brand.displayName} (`,
    url: brand.repoUrl,
    suffix: ')',
  }
}
