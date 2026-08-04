import type { ReactNode } from 'react'
import { Circle, Defs, LinearGradient, Link, Path, Rect, Stop, Svg, Text, View } from '@react-pdf/renderer'
import type { MessageKey } from '../../../../i18n/messages'
import { normalizePdfAnchorHref, pdfLinkDisplayText } from '../../../../lib/pdfLinks'
import { s } from '../../../../lib/pdf/styles'
import { color, iconSize, pt } from '../../../../lib/pdf/tokens'
import { PdfIcon } from '../icons/PdfIcon'
import type { PdfIconName } from '../icons/pdfIcons'

/** `useI18n` is unavailable inside react-pdf's reconciler, so `t` is threaded through as a prop. */
export type PdfT = (key: MessageKey) => string

/**
 * A real PDF link annotation bound to the text run — it follows the text across page breaks,
 * unlike the coordinate-projected rectangles this replaces.
 */
export function PdfUrlLine({ href }: { href: string | undefined | null }) {
  if (href == null || String(href).trim() === '') return null
  const safe = normalizePdfAnchorHref(String(href))
  return (
    <Link src={safe} style={s.urlLine}>
      {pdfLinkDisplayText(safe)}
    </Link>
  )
}

/** Icon + content row, replacing the `flex items-center gap-2` rows in the old DOM layout. */
export function PdfIconRow({
  icon,
  iconColor = color.slate600,
  size = iconSize.base,
  children,
}: {
  icon: PdfIconName
  iconColor?: string
  size?: number
  children: ReactNode
}) {
  return (
    <View style={s.iconRow}>
      <View style={s.iconNudge}>
        <PdfIcon name={icon} size={size} color={iconColor} />
      </View>
      <View style={s.iconRowText}>{children}</View>
    </View>
  )
}

/** Compact icon + label used in date/location meta rows. */
export function PdfMetaItem({ icon, children }: { icon: PdfIconName; children: ReactNode }) {
  return (
    <View style={s.metaItem}>
      <PdfIcon name={icon} size={iconSize.sm} color={color.slate600} />
      <Text style={s.metaText}>{children}</Text>
    </View>
  )
}

/**
 * Demanded free space below a standalone section heading. Sized to clear a heading plus the
 * opening lines of its first entry — a smaller value strands the heading at the page foot while
 * its first (atomic) card jumps to the next page.
 *
 * Sections whose first card is short bind heading and card in a `wrap={false}` group instead,
 * which is exact rather than heuristic; this is the fallback for sections that must stay wrappable.
 */
const SECTION_HEADING_MIN_AHEAD = pt(150)

export function PdfSectionHeading({ children, minPresenceAhead = SECTION_HEADING_MIN_AHEAD }: { children: ReactNode; minPresenceAhead?: number }) {
  return (
    <View style={s.sectionHeading} minPresenceAhead={minPresenceAhead}>
      <Text style={s.sectionHeadingText}>{children}</Text>
    </View>
  )
}

export function PdfChipRow({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <View style={s.chipRow}>
      {items.map((item) => (
        <View key={item} style={s.chip}>
          <Text style={s.chipText}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

/** `list-disc` has no react-pdf equivalent; the marker is an explicit column. */
export function PdfBullets({ items, keyFor }: { items: string[]; keyFor: (index: number) => string }) {
  if (!items.length) return null
  return (
    <View style={s.bulletList}>
      {items.map((item, i) => (
        // Bullets are short enough to keep atomic. Note `wrap={false}` *clips* anything taller
        // than a page in react-pdf, so it is only ever applied at this granularity.
        <View key={keyFor(i)} style={s.bulletRow} wrap={false}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

/**
 * Vector port of `getFallbackPhotoDataUrl` in `cvPresentation.ts`. That helper returns an SVG
 * data URL, which react-pdf's `<Image>` cannot decode (JPEG/PNG only) — rendering it natively
 * keeps the placeholder working instead of failing the whole document.
 */
export function PdfFallbackAvatar({ size }: { size: number }) {
  return (
    <Svg viewBox="0 0 256 256" style={{ width: size, height: size }}>
      <Defs>
        <LinearGradient id="pdfAvatar" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#a855f7" />
          <Stop offset="0.5" stopColor="#6366f1" />
          <Stop offset="1" stopColor="#0ea5e9" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="256" height="256" rx="64" fill="url(#pdfAvatar)" />
      {/* rgba() is unreliable in react-pdf's SVG parser; opacity is a separate prop. */}
      <Circle cx="128" cy="108" r="48" fill="#ffffff" fillOpacity={0.92} />
      <Path d="M56 220c10-44 44-68 72-68s62 24 72 68" fill="#ffffff" fillOpacity={0.92} />
    </Svg>
  )
}
