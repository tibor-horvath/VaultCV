/**
 * The print layout is specified in CSS px against the full A4 sheet (794 × 1123 px at 96dpi), the
 * same units as its design comp. `pt()` maps those px onto PDF points 1:1 with the paper.
 */
export const PT_PER_CSS_PX = 0.75

/** Convert a CSS px value from the print design to PDF points. */
export function pt(px: number): number {
  return Math.round(px * PT_PER_CSS_PX * 100) / 100
}

export const A4 = {
  widthPt: 595.28,
  heightPt: 841.89,
} as const

/**
 * Sheet margins. The top margin also clears the running head on continuation pages, and the
 * bottom one the footer band, both of which are positioned absolutely inside it.
 */
export const margin = {
  top: pt(72),
  side: pt(64),
  bottom: pt(96),
  runningHeadTop: pt(30),
  footerBottom: pt(40),
  generatedBottom: pt(22),
} as const

/**
 * Print palette: near-black text on white, one dark accent that still reads as solid ink in
 * grayscale, and nothing lighter than #767676 for text.
 */
export const color = {
  ink: '#111111',
  text: '#1a1a1a',
  body: '#2a2a2a',
  muted: '#555555',
  contact: '#333333',
  footer: '#5f5f5f',
  rule: '#d4d4d4',
  hairline: '#e2e2e2',
  monogramFill: '#ececec',
  accent: '#1f4a7a',
  white: '#ffffff',
  link: '#2563eb',
} as const

export const font = {
  sans: 'Inter',
} as const

/** Width of the label/date column that runs down the left of every section. */
export const gutter = {
  width: pt(124),
  gap: pt(28),
} as const
