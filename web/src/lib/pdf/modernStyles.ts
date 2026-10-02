import { StyleSheet } from '@react-pdf/renderer'
import { font, modernColor as c, modernLayout as L, pt } from './tokens'

/**
 * Modern (screen) CV styles. Values are CSS px from the design comp, run through `pt()`.
 *
 * Same rule as `styles.ts`: no `lineHeight` on the page, on `fixed` nodes or on anything under a
 * `render` prop — react-pdf compounds it on every relayout pass. Flow text states its own leading.
 */
export const m = StyleSheet.create({
  page: {
    paddingTop: L.top,
    paddingBottom: L.bottom,
    fontFamily: font.sans,
    fontSize: pt(13),
    color: c.body,
    backgroundColor: c.white,
  },

  /** Painted behind every page, so the sidebar runs full height even where its content has ended. */
  sidebarBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: L.sidebarWidth,
    backgroundColor: c.sidebar,
  },

  columns: { flexDirection: 'row' },
  sidebar: { width: L.sidebarWidth, paddingHorizontal: L.sidebarPadX, color: c.sidebarText },
  main: { flex: 1, paddingLeft: L.mainPadLeft, paddingRight: L.mainPadRight },

  // --- sidebar --------------------------------------------------------------
  photo: {
    width: pt(104),
    height: pt(104),
    borderRadius: pt(52),
    objectFit: 'cover',
    objectPositionY: 0,
  },
  monogram: {
    width: pt(104),
    height: pt(104),
    borderRadius: pt(52),
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monogramText: { fontSize: pt(36), fontWeight: 700, lineHeight: 1, color: c.white },

  sideSection: { marginTop: pt(28) },
  sideLabel: {
    marginBottom: pt(10),
    fontSize: pt(10.5),
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: pt(1.4),
    textTransform: 'uppercase',
    color: c.sidebarLabel,
  },
  sideText: { fontSize: pt(12.5), lineHeight: 1.45, color: c.sidebarText },
  sideItem: { marginTop: pt(7) },
  sideItemFirst: { marginTop: 0 },
  sideLink: { fontSize: pt(12.5), lineHeight: 1.45, color: c.sidebarText, textDecoration: 'none' },
  sideStrong: { fontSize: pt(12.5), fontWeight: 600, lineHeight: 1.4, color: c.sidebarText, textDecoration: 'none' },
  sideUrl: { fontSize: pt(11), lineHeight: 1.4, color: c.sidebarLink, textDecoration: 'none' },
  sideMeta: { fontSize: pt(11), lineHeight: 1.4, color: c.sidebarMuted },
  sideRow: { flexDirection: 'row', justifyContent: 'space-between' },
  sideCredential: { marginTop: pt(12) },

  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  sideChip: {
    marginRight: pt(6),
    marginBottom: pt(6),
    paddingVertical: pt(3),
    paddingHorizontal: pt(10),
    borderWidth: 0.75,
    borderColor: c.sidebarChip,
    borderRadius: pt(12),
  },
  sideChipText: { fontSize: pt(11.5), lineHeight: 1.3, color: c.sidebarText },

  /** Who this page belongs to, at the foot of the sidebar on pages after the first. */
  sideRunning: {
    position: 'absolute',
    bottom: L.footerBottom,
    left: L.sidebarPadX,
    width: L.sidebarWidth - L.sidebarPadX * 2,
  },
  sideRunningName: { fontSize: pt(14), fontWeight: 700, color: c.sidebarText },
  sideRunningMeta: { marginTop: pt(3), fontSize: pt(11), color: c.sidebarMuted },
  sideRunningLink: { fontSize: pt(11), color: c.sidebarLink, textDecoration: 'none' },

  // --- main header ----------------------------------------------------------
  name: { fontSize: pt(42), fontWeight: 700, lineHeight: 1.1, letterSpacing: -0.8, color: c.ink },
  headlineRow: { marginTop: pt(8), flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' },
  role: { marginRight: pt(10), fontSize: pt(17), fontWeight: 600, lineHeight: 1.35, color: c.accent },
  headlineChip: { fontSize: pt(12.5), lineHeight: 1.6, color: c.muted },
  summary: { marginTop: pt(14), fontSize: pt(13.5), lineHeight: 1.6, color: c.body },

  // --- sections -------------------------------------------------------------
  section: { marginTop: pt(28) },
  sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: pt(14) },
  sectionTitle: { marginRight: pt(12), fontSize: pt(19), fontWeight: 700, lineHeight: 1.3, color: c.ink },
  sectionRule: { flex: 1, height: 0.75, backgroundColor: c.rule },

  // --- timeline entries (experience, education) ------------------------------
  entry: { flexDirection: 'row' },
  entryRail: { width: pt(12), marginRight: pt(14), alignItems: 'center', paddingTop: pt(5) },
  entryDot: {
    width: pt(10),
    height: pt(10),
    borderRadius: pt(5),
    borderWidth: 1.5,
    borderColor: c.accent,
    backgroundColor: c.white,
  },
  entryLine: { flex: 1, width: 1.5, marginTop: pt(4), backgroundColor: c.rule },
  entryBody: { flex: 1, paddingBottom: pt(18) },
  entryBodyLast: { paddingBottom: 0 },
  entryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  entryTitle: { flex: 1, marginRight: pt(12), fontSize: pt(15), fontWeight: 600, lineHeight: 1.35, color: c.ink },
  entryDates: { fontSize: pt(11.5), lineHeight: 1.5, color: c.muted },
  entryOrg: { flex: 1, marginRight: pt(12), fontSize: pt(13), fontWeight: 600, lineHeight: 1.5, color: c.accent },
  entryOrgLink: { color: c.accent, textDecoration: 'none' },
  entryPlace: { fontSize: pt(12), lineHeight: 1.5, color: c.muted },
  entryDetail: { marginTop: pt(4), fontSize: pt(13), lineHeight: 1.55, color: c.body },

  bulletList: { marginTop: pt(4) },
  bulletRow: { flexDirection: 'row', marginTop: pt(3) },
  bulletDot: { width: pt(14), fontSize: pt(13), lineHeight: 1.55, color: c.accent },
  bulletText: { flex: 1, fontSize: pt(13), lineHeight: 1.55, color: c.body },

  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: pt(8) },
  tag: {
    marginRight: pt(6),
    marginBottom: pt(4),
    paddingVertical: pt(2),
    paddingHorizontal: pt(8),
    borderRadius: pt(6),
    backgroundColor: c.tint,
  },
  tagText: { fontSize: pt(10.5), lineHeight: 1.4, color: c.accentDeep },

  // --- projects -------------------------------------------------------------
  card: {
    marginTop: pt(10),
    paddingVertical: pt(14),
    paddingHorizontal: pt(16),
    borderWidth: 0.75,
    borderColor: c.rule,
    borderRadius: pt(10),
    backgroundColor: c.surface,
  },
  cardFirst: { marginTop: 0 },
  cardLinks: { flexDirection: 'row' },
  cardLink: { marginLeft: pt(12), fontSize: pt(12), fontWeight: 600, lineHeight: 1.5, color: c.accent, textDecoration: 'none' },
  cardTag: {
    marginRight: pt(6),
    marginBottom: pt(4),
    paddingVertical: pt(2),
    paddingHorizontal: pt(8),
    borderWidth: 0.75,
    borderColor: c.rule,
    borderRadius: pt(6),
    backgroundColor: c.white,
  },
  cardTagText: { fontSize: pt(10.5), lineHeight: 1.4, color: c.body },

  // --- awards ---------------------------------------------------------------
  awardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  award: {
    width: '48.5%',
    marginBottom: pt(10),
    paddingVertical: pt(12),
    paddingHorizontal: pt(14),
    borderWidth: 0.75,
    borderColor: c.rule,
    borderRadius: pt(10),
    backgroundColor: c.surface,
  },
  awardYear: { fontSize: pt(11), lineHeight: 1.4, color: c.accentDeep },
  awardTitle: { marginTop: pt(2), fontSize: pt(13.5), fontWeight: 600, lineHeight: 1.4, color: c.ink },
  awardIssuer: { marginTop: pt(2), fontSize: pt(12), lineHeight: 1.4, color: c.muted },

  // --- interests ------------------------------------------------------------
  pill: {
    marginRight: pt(8),
    marginBottom: pt(8),
    paddingVertical: pt(4),
    paddingHorizontal: pt(14),
    borderWidth: 0.75,
    borderColor: c.chipBorder,
    borderRadius: pt(14),
  },
  pillText: { fontSize: pt(12.5), lineHeight: 1.4, color: c.body },

  // --- footer ---------------------------------------------------------------
  footer: {
    position: 'absolute',
    bottom: L.footerBottom,
    left: L.sidebarWidth + L.mainPadLeft,
    right: L.mainPadRight,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: pt(10.5), color: c.muted },
  /** Last page only, in its own band below the footer row so the row never moves. */
  footerGenerated: {
    position: 'absolute',
    bottom: pt(14),
    left: L.sidebarWidth + L.mainPadLeft,
    right: L.mainPadRight,
    fontSize: 7,
    color: c.muted,
  },
  footerLink: { fontSize: 7, color: c.accent, textDecoration: 'none' },
})
