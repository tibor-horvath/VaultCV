import { StyleSheet } from '@react-pdf/renderer'
import { A4, color, font, leading, pt } from './tokens'

/**
 * Port of the Tailwind classes in the former `CvPdfLayout.tsx`. Values run through `pt()` so the
 * proportions match the layout that was previously rasterized at 794px.
 *
 * Deliberately dropped (no react-pdf equivalent, and screen-only chrome anyway):
 * the card drop shadow, the photo `ring`/`shadow-md`, and the full-card rounded border — a PDF
 * page has no surrounding canvas, so the page itself is the card.
 *
 * NOTE — no `lineHeight` on `page`, and none on the footer styles. react-pdf re-resolves styles on
 * every relayout pass, and `transformLineHeight` multiplies a unitless `lineHeight` by `fontSize`
 * each time it runs. Nodes carrying a `render` prop are the only ones re-laid out per pass, so the
 * value compounds exponentially for them (7 → 49 → … → ~7^10 for the 7pt footer) and the text lands
 * millions of points below the page. Every text style therefore states its own leading, keeping the
 * footer's inheritance chain (page → footer view → footer text) free of unitless line heights.
 * No value is safe there: numbers, `'7pt'` and `'100%'` all compound the same way — react-pdf has
 * no absolute-leading form, so an "already in points" number is multiplied just like a ratio.
 *
 * Restating the leading per element also fixes what the page-level value quietly did: it resolved
 * once against the *page* font size and handed every descendant a flat 14.33pt, so `role` and
 * `skillsLabel` were effectively tighter than the `leading-relaxed` they port. They now get the
 * 1.625 ratio the Tailwind source intended, which is why the header is ~6mm taller than before.
 */
export const s = StyleSheet.create({
  page: {
    paddingTop: A4.marginPt,
    paddingBottom: A4.marginPt * 2,
    paddingHorizontal: A4.marginPt,
    fontFamily: font.sans,
    fontSize: pt(13),
    color: color.slate800,
    backgroundColor: color.white,
  },

  // --- header -------------------------------------------------------------
  header: {
    backgroundColor: color.indigo50,
    borderBottomWidth: 0.75,
    borderBottomColor: color.indigo100,
    borderTopLeftRadius: pt(24),
    borderTopRightRadius: pt(24),
    paddingHorizontal: pt(32),
    paddingTop: pt(40),
    paddingBottom: pt(32),
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerPhoto: {
    width: pt(160),
    height: pt(160),
    borderRadius: pt(24),
    objectFit: 'cover',
    objectPositionY: 0,
  },
  headerBody: { flex: 1, marginLeft: pt(32) },
  name: {
    fontSize: pt(36),
    fontWeight: 700,
    lineHeight: 1.1,
    color: color.slate900,
  },
  role: {
    marginTop: pt(8),
    fontSize: pt(16),
    fontWeight: 600,
    lineHeight: leading.relaxed,
    color: color.slate600,
  },
  headlineChip: {
    marginTop: pt(12),
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.75,
    borderColor: color.indigo100,
    backgroundColor: color.white,
    borderRadius: pt(999),
    paddingHorizontal: pt(12),
    paddingVertical: pt(5),
  },
  headlineChipText: {
    fontSize: pt(12),
    fontWeight: 600,
    lineHeight: leading.relaxed,
    color: color.slate600,
    marginLeft: pt(8),
  },
  headerLocation: { marginTop: pt(16), fontSize: pt(14), color: color.slate600 },
  /** Matches every other icon row (`urlLine`, `metaText`): tight leading keeps the glyphs centred
      against the icon, which `leading.relaxed` pushes above it. */
  headerLocationText: { lineHeight: leading.none },
  headerContacts: {
    marginTop: pt(20),
    borderTopWidth: 0.75,
    borderTopColor: color.slate200,
    paddingTop: pt(8),
  },

  // --- shared -------------------------------------------------------------
  body: { paddingHorizontal: pt(32), paddingTop: pt(32) },
  section: { marginBottom: pt(24) },
  sectionHeading: {
    borderBottomWidth: 0.75,
    borderBottomColor: color.indigo200,
    paddingBottom: pt(8),
  },
  sectionHeadingText: {
    fontSize: pt(11),
    fontWeight: 600,
    letterSpacing: pt(2),
    color: color.indigo700,
    lineHeight: leading.none,
    textTransform: 'uppercase',
  },
  summary: { fontSize: pt(13), color: color.slate700, lineHeight: leading.relaxed },

  iconRow: { flexDirection: 'row', alignItems: 'center', marginTop: pt(8) },
  iconRowText: { marginLeft: pt(8), flex: 1 },
  /** Icons sit marginally low against Inter's cap height; nudged rather than transformed. */
  iconNudge: { marginTop: pt(1) },

  urlLine: {
    fontFamily: font.mono,
    fontSize: pt(10),
    lineHeight: leading.none,
    color: color.slate600,
    textDecoration: 'none',
  },

  article: {
    paddingVertical: pt(16),
    borderTopWidth: 0.5,
    borderTopColor: color.slate100,
  },
  articleFirst: { borderTopWidth: 0 },
  articleTitle: { fontWeight: 600, color: color.slate900, lineHeight: leading.none },
  metaRow: {
    marginTop: pt(4),
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    fontSize: pt(12),
    color: color.slate600,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: pt(12), marginTop: pt(4) },
  metaText: { marginLeft: pt(4), fontSize: pt(12), color: color.slate600, lineHeight: leading.none },

  bulletList: { marginTop: pt(12) },
  bulletRow: { flexDirection: 'row', marginTop: pt(4), paddingRight: pt(4) },
  bulletDot: { width: pt(16), fontSize: pt(13), lineHeight: leading.relaxed, color: color.slate700 },
  bulletText: { flex: 1, fontSize: pt(13), color: color.slate700, lineHeight: leading.relaxed },

  chipRow: { marginTop: pt(12), flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    borderWidth: 0.75,
    borderColor: color.slate200,
    backgroundColor: color.slate50,
    borderRadius: pt(999),
    paddingHorizontal: pt(10),
    paddingVertical: pt(4),
    marginRight: pt(8),
    marginTop: pt(8),
  },
  chipText: { fontSize: pt(11), fontWeight: 600, color: color.slate600, lineHeight: leading.none },

  subHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: pt(16),
  },
  subHeadingText: {
    marginLeft: pt(8),
    fontSize: pt(10),
    fontWeight: 600,
    letterSpacing: pt(1),
    color: color.slate500,
    lineHeight: leading.none,
    textTransform: 'uppercase',
  },
  skillsLabel: {
    marginTop: pt(12),
    fontSize: pt(10),
    fontWeight: 600,
    letterSpacing: pt(1),
    lineHeight: leading.relaxed,
    color: color.slate600,
    textTransform: 'uppercase',
  },

  // --- footer -------------------------------------------------------------
  footer: {
    position: 'absolute',
    bottom: A4.marginPt,
    left: A4.marginPt,
    right: A4.marginPt,
    textAlign: 'center',
  },
  footerText: { fontSize: 7, color: color.footer },
  footerLink: { fontSize: 7, color: '#2563eb', textDecoration: 'none' },
})
