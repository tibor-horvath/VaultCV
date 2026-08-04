import { Image, Text, View } from '@react-pdf/renderer'
import type { CvData } from '../../../../types/cv'
import { inferLinkKind } from '../../../../lib/cvPresentation'
import { hasPdfUrl } from '../../../../lib/pdfLinks'
import { s } from '../../../../lib/pdf/styles'
import { color, pt } from '../../../../lib/pdf/tokens'
import { parseBasicsHeadline } from '../../../../lib/cvPresentation'
import type { PdfProfilePhoto } from '../../../../lib/pdf/pdfImage'
import { PdfIcon } from '../icons/PdfIcon'
import type { PdfIconName } from '../icons/pdfIcons'
import { PdfFallbackAvatar, PdfIconRow, PdfUrlLine } from './primitives'

const PHOTO_SIZE = pt(160)

const LINK_ICONS: Record<string, PdfIconName> = {
  github: 'github',
  linkedin: 'linkedin',
  youtube: 'youtube',
  email: 'atSign',
  x: 'x',
  mastodon: 'mastodon',
}

export function PdfHeader({ cv, photo }: { cv: CvData; photo: PdfProfilePhoto }) {
  const basics = cv.basics
  const { role, chip } = parseBasicsHeadline(basics.headline)
  const visibleLinks = (cv.links ?? []).filter((l) => hasPdfUrl(l.url) && inferLinkKind(l) !== 'other')
  const hasEmail = hasPdfUrl(basics.email)

  return (
    <View style={s.header}>
      {photo.kind === 'image' ? (
        <Image src={photo.src} style={s.headerPhoto} />
      ) : (
        <PdfFallbackAvatar size={PHOTO_SIZE} />
      )}

      <View style={s.headerBody}>
        <Text style={s.name}>{basics.name}</Text>
        {role ? <Text style={s.role}>{role}</Text> : null}
        {chip ? (
          <View style={s.headlineChip}>
            <PdfIcon name="sparkles" size={pt(13)} color={color.indigo500} />
            <Text style={s.headlineChipText}>{chip}</Text>
          </View>
        ) : null}
        {basics.location ? (
          <View style={s.headerLocation}>
            <PdfIconRow icon="mapPin" iconColor={color.indigo500}>
              <Text style={s.headerLocationText}>{basics.location}</Text>
            </PdfIconRow>
          </View>
        ) : null}

        {hasEmail || visibleLinks.length ? (
          <View style={s.headerContacts}>
            {hasEmail ? (
              <PdfIconRow icon="mail">
                <PdfUrlLine href={`mailto:${String(basics.email).trim()}`} />
              </PdfIconRow>
            ) : null}
            {visibleLinks.map((l) => (
              <PdfIconRow key={`${l.label}:${l.url}`} icon={LINK_ICONS[inferLinkKind(l)] ?? 'globe'}>
                <PdfUrlLine href={l.url} />
              </PdfIconRow>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  )
}
