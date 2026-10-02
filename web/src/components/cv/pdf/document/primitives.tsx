import type { ReactNode } from 'react'
import { Text, View } from '@react-pdf/renderer'
import type { MessageKey } from '../../../../i18n/messages'
import { s } from '../../../../lib/pdf/styles'
import { pt } from '../../../../lib/pdf/tokens'
import { hasText } from '../../../../lib/pdf/text'

/** `useI18n` is unavailable inside react-pdf's reconciler, so `t` is threaded through as a prop. */
export type PdfT = (key: MessageKey) => string

export function PdfLabel({ children }: { children: ReactNode }) {
  return <Text style={s.label}>{children}</Text>
}

/**
 * Demanded free space below a full-width section heading: enough for the heading plus the opening
 * lines of its first entry, so a heading is never stranded at the foot of a page.
 */
const SECTION_HEADING_MIN_AHEAD = pt(140)

/** Full-width label above dated entries, whose gutter is taken by the dates. */
export function PdfSectionHeading({ children }: { children: ReactNode }) {
  return (
    <View minPresenceAhead={SECTION_HEADING_MIN_AHEAD}>
      <PdfLabel>{children}</PdfLabel>
    </View>
  )
}

/** Label in the gutter, content beside it. */
export function PdfGutterRow({
  label,
  spaced = false,
  children,
}: {
  label: ReactNode
  spaced?: boolean
  children: ReactNode
}) {
  return (
    <View style={spaced ? s.gutterRowSpaced : s.gutterRow}>
      <View style={s.gutterCell}>
        <PdfLabel>{label}</PdfLabel>
      </View>
      <View style={s.mainCell}>{children}</View>
    </View>
  )
}

/** `list-disc` has no react-pdf equivalent; the marker is an explicit column. */
export function PdfBullets({ items, keyFor }: { items: string[]; keyFor: (index: number) => string }) {
  const visible = items.filter(hasText)
  if (!visible.length) return null
  return (
    <View style={s.bulletList}>
      {visible.map((item, i) => (
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
 * Dates and place in the gutter; title, detail and bullets beside them. The title demands room for
 * its first lines of detail so it never sits alone at the foot of a page.
 */
export function PdfDatedEntry({
  dates,
  place,
  title,
  children,
}: {
  dates: string
  place?: string
  title: ReactNode
  children?: ReactNode
}) {
  return (
    <View style={s.entry}>
      <View style={s.gutterCell}>
        {hasText(dates) ? <Text style={s.entryDates}>{dates}</Text> : null}
        {hasText(place) ? <Text style={s.entryPlace}>{place}</Text> : null}
      </View>
      <View style={s.mainCell}>
        <View minPresenceAhead={pt(48)}>
          <Text style={s.entryTitle}>{title}</Text>
        </View>
        {children}
      </View>
    </View>
  )
}

/** A compact row with the name on the left and a date pinned right (credentials, awards). */
export function PdfListRow({
  strong,
  detail,
  date,
  first,
  last,
}: {
  strong: string
  detail?: string
  date?: string
  first: boolean
  last: boolean
}) {
  return (
    <View style={[s.listRow, ...(first ? [s.listRowFirst] : []), ...(last ? [s.listRowLast] : [])]} wrap={false}>
      <Text style={s.listRowText}>
        <Text style={s.listRowStrong}>{strong}</Text>
        {hasText(detail) ? ` · ${detail}` : ''}
      </Text>
      {hasText(date) ? <Text style={s.listRowDate}>{date}</Text> : null}
    </View>
  )
}
