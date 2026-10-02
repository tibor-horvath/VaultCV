import { Image, Text, View } from '@react-pdf/renderer'
import type { CvData } from '../../../../types/cv'
import { parseBasicsHeadline } from '../../../../lib/cvPresentation'
import type { PdfProfilePhoto } from '../../../../lib/pdf/pdfImage'
import { s } from '../../../../lib/pdf/styles'
import { hasText, initialsOf, joinDot } from '../../../../lib/pdf/text'

/**
 * Contact details print as plain text: on paper a URL can't be clicked, and an employer only needs
 * a way to reach the candidate. Profile links (GitHub, LinkedIn, …) stay on the web CV.
 */
export function PdfHeader({ cv, photo }: { cv: CvData; photo: PdfProfilePhoto }) {
  const basics = cv.basics
  const contacts = [basics.email, basics.mobile, basics.location].filter(hasText).map((v) => v.trim())

  return (
    <View style={s.header}>
      {photo.kind === 'image' ? (
        <Image src={photo.src} style={s.photo} />
      ) : (
        <View style={s.monogram}>
          <Text style={s.monogramText}>{initialsOf(basics.name)}</Text>
        </View>
      )}

      <View style={s.headerBody}>
        <Text style={s.name}>{basics.name}</Text>
        {hasText(basics.headline) ? <Text style={s.headline}>{basics.headline.trim()}</Text> : null}
      </View>

      {contacts.length ? (
        <View style={s.contacts}>
          {contacts.map((line) => (
            <Text key={line} style={s.contactLine}>
              {line}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  )
}

/** Name and one way to reach the candidate on every page after the first, in case pages separate. */
export function PdfRunningHead({ cv }: { cv: CvData }) {
  const { role } = parseBasicsHeadline(cv.basics.headline)
  const meta = joinDot([role, cv.basics.email])
  return (
    <View
      fixed
      style={s.runningHead}
      render={({ pageNumber }) =>
        pageNumber === 1 ? null : (
          <View style={s.runningHeadInner}>
            <Text style={s.runningHeadName}>{cv.basics.name}</Text>
            {meta ? <Text style={s.runningHeadMeta}>{meta}</Text> : null}
          </View>
        )
      }
    />
  )
}
