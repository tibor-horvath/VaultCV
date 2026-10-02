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

/**
 * Modern (screen) layout. The sidebar runs the full height of every page; the main column sits
 * beside it. Values are px from the design comp, like everything above.
 */
export const modernLayout = {
  sidebarWidth: pt(262),
  sidebarPadX: pt(28),
  mainPadLeft: pt(40),
  mainPadRight: pt(48),
  top: pt(48),
  bottom: pt(76),
  footerBottom: pt(32),
} as const

/**
 * Modern palette: VaultCV's Vault Ink sidebar and Key Indigo accent. Every text color clears
 * 4.5:1 against the surface it sits on.
 */
export const modernColor = {
  ink: '#0B1020',
  body: '#343A4F',
  muted: '#5A6178',
  rule: '#E4E6F0',
  chipBorder: '#D5D8E6',
  surface: '#F7F8FB',
  accent: '#4F46E5',
  accentDeep: '#3730A3',
  tint: '#EEF0FF',
  white: '#FFFFFF',
  sidebar: '#0B1020',
  sidebarText: '#E8EAF3',
  sidebarMuted: '#9AA3BD',
  sidebarLabel: '#A5ACF8',
  sidebarLink: '#A5B4FC',
  sidebarChip: '#3A4160',
} as const
