import { StyleSheet } from '@react-pdf/renderer'
import { color, font, gutter, margin, pt } from './tokens'

/**
 * Printed CV styles. Values are CSS px from the design comp, run through `pt()`.
 *
 * NOTE — no `lineHeight` on `page`, the running head or the footer. react-pdf re-resolves styles on
 * every relayout pass, and `transformLineHeight` multiplies a unitless `lineHeight` by `fontSize`
 * each time it runs. Nodes carrying a `render` prop are the only ones re-laid out per pass, so the
 * value compounds exponentially for them and the text lands millions of points below the page.
 * No value is safe there: numbers, `'7pt'` and `'100%'` all compound the same way. Every text style
 * in the flow therefore states its own leading instead of inheriting one from the page.
 */
export const s = StyleSheet.create({
  page: {
    paddingTop: margin.top,
    paddingBottom: margin.bottom,
    paddingHorizontal: margin.side,
    fontFamily: font.sans,
    fontSize: pt(14),
    color: color.text,
    backgroundColor: color.white,
  },

  // --- header -------------------------------------------------------------
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: pt(20),
    borderBottomWidth: 1.5,
    borderBottomColor: color.accent,
  },
  photo: {
    width: pt(84),
    height: pt(84),
    borderRadius: pt(6),
    objectFit: 'cover',
    objectPositionY: 0,
    marginRight: pt(24),
  },
  monogram: {
    width: pt(84),
    height: pt(84),
    borderRadius: pt(6),
    backgroundColor: color.monogramFill,
    marginRight: pt(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: { fontSize: pt(26), fontWeight: 600, lineHeight: 1, color: color.muted },
  headerBody: { flex: 1 },
  name: {
    fontSize: pt(34),
    fontWeight: 600,
    lineHeight: 1.15,
    letterSpacing: -0.4,
    color: color.ink,
  },
  headline: {
    marginTop: pt(4),
    fontSize: pt(16),
    fontWeight: 600,
    lineHeight: 1.4,
    color: color.accent,
  },
  contacts: { marginLeft: pt(24), alignItems: 'flex-end' },
  contactLine: { fontSize: pt(13), lineHeight: 1.5, color: color.contact, textAlign: 'right' },

  // --- running head (continuation pages) ------------------------------------
  runningHead: {
    position: 'absolute',
    top: margin.runningHeadTop,
    left: margin.side,
    right: margin.side,
  },
  /** Borders live here, not on the fixed wrapper, so page 1 (which renders nothing) gets no rule. */
  runningHeadInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: pt(8),
    borderBottomWidth: 0.75,
    borderBottomColor: color.accent,
  },
  runningHeadName: { fontSize: pt(12), fontWeight: 600, color: color.ink },
  runningHeadMeta: { fontSize: pt(12), color: color.muted },

  // --- sections -----------------------------------------------------------
  body: { paddingTop: pt(26) },
  section: { marginBottom: pt(26) },
  /** Label in the gutter, content beside it. */
  gutterRow: { flexDirection: 'row' },
  gutterRowSpaced: { flexDirection: 'row', marginTop: pt(8) },
  gutterCell: { width: gutter.width, marginRight: gutter.gap },
  mainCell: { flex: 1 },
  /** Matches the 21px line box of body text so labels sit on the first line of their content. */
  label: {
    fontSize: pt(12),
    fontWeight: 600,
    lineHeight: 1.75,
    letterSpacing: pt(1.2),
    textTransform: 'uppercase',
    color: color.accent,
  },
  bodyText: { fontSize: pt(14), lineHeight: 1.5, color: color.body },

  // --- dated entries (experience, education) --------------------------------
  entry: { flexDirection: 'row', marginTop: pt(16) },
  entryDates: { fontSize: pt(13), fontWeight: 600, lineHeight: 1.62, color: color.text },
  entryPlace: { fontSize: pt(13), lineHeight: 1.5, color: color.muted },
  entryTitle: { fontSize: pt(15), lineHeight: 1.4, color: color.muted },
  entryTitleStrong: { fontWeight: 600, color: color.ink },
  entryDetail: { marginTop: pt(4), fontSize: pt(14), lineHeight: 1.5, color: color.body },
  tagLine: { marginTop: pt(6), fontSize: pt(13), lineHeight: 1.5, color: color.muted },

  bulletList: { marginTop: pt(4) },
  bulletRow: { flexDirection: 'row', marginTop: pt(3) },
  bulletDot: { width: pt(14), fontSize: pt(14), lineHeight: 1.5, color: color.body },
  bulletText: { flex: 1, fontSize: pt(14), lineHeight: 1.5, color: color.body },

  // --- projects -----------------------------------------------------------
  project: { marginTop: pt(14) },
  projectFirst: { marginTop: 0 },
  projectTitle: { fontSize: pt(15), fontWeight: 600, lineHeight: 1.4, color: color.ink },

  // --- compact rows (credentials, awards) ----------------------------------
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: pt(7),
    borderBottomWidth: 0.75,
    borderBottomColor: color.hairline,
  },
  listRowFirst: { paddingTop: 0 },
  listRowLast: { borderBottomWidth: 0 },
  listRowText: { flex: 1, fontSize: pt(14), lineHeight: 1.5, color: color.muted },
  listRowStrong: { fontWeight: 600, color: color.text },
  listRowDate: { marginLeft: pt(16), fontSize: pt(13), lineHeight: 1.62, color: color.muted },

  // --- footer -------------------------------------------------------------
  footer: {
    position: 'absolute',
    bottom: margin.footerBottom,
    left: margin.side,
    right: margin.side,
    paddingTop: pt(10),
    borderTopWidth: 0.75,
    borderTopColor: color.rule,
  },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: pt(12), color: color.footer },
  /** Its own fixed band below the footer row, so the row sits at the same height on every page. */
  footerGenerated: {
    position: 'absolute',
    bottom: margin.generatedBottom,
    left: margin.side,
    right: margin.side,
    fontSize: 7,
    color: color.footer,
  },
  footerLink: { fontSize: 7, color: color.link, textDecoration: 'none' },
})
