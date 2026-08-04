/**
 * The print layout was authored at 794 CSS px wide (A4 content at ~96dpi) and mapped onto
 * 190mm of A4 content width. Keeping that exact scale means the react-pdf output has the same
 * proportions as the raster output it replaces.
 *
 * 190mm = 538.58pt over 794 authored px.
 */
export const PT_PER_AUTHORED_PX = 538.58 / 794

/** Convert an authored CSS px value (as used in the Tailwind print layout) to PDF points. */
export function pt(px: number): number {
  return Math.round(px * PT_PER_AUTHORED_PX * 100) / 100
}

export const A4 = {
  /** 10mm margin, matching the previous `a4LayoutMm()`. */
  marginPt: 28.35,
  contentWidthPt: 538.58,
} as const

/** Tailwind palette values used by the print layout, resolved to hex (react-pdf has no class names). */
export const color = {
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50: '#f8fafc',
  indigo700: '#4338ca',
  indigo500: '#6366f1',
  indigo200: '#c7d2fe',
  indigo100: '#e0e7ff',
  indigo50: '#eef2ff',
  violet50: '#f5f3ff',
  white: '#ffffff',
  footer: '#646464',
} as const

export const font = {
  sans: 'Inter',
  mono: 'RobotoMono',
} as const

export const iconSize = {
  base: pt(14),
  sm: pt(12),
} as const

/** Tailwind line-height utilities used in the print layout, as unitless multipliers. */
export const leading = {
  none: 1,
  relaxed: 1.625,
} as const
