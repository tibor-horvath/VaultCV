import type { ComponentProps, ReactNode } from 'react'
import { Image, Link, Text, View } from '@react-pdf/renderer'
import type { CvCredential, CvData } from '../../../../types/cv'
import { parseBasicsHeadline } from '../../../../lib/cvPresentation'
import { displayUrl, pdfMailHref, pdfTelHref, pdfWebHref } from '../../../../lib/pdf/links'
import { m } from '../../../../lib/pdf/modernStyles'
import type { PdfProfilePhoto } from '../../../../lib/pdf/pdfImage'
import { hasText, initialsOf, splitLanguageLevel } from '../../../../lib/pdf/text'
import { credentialDates, credentialKey, issuerDetail, orderCredentials } from '../document/format'
import type { PdfT } from '../document/primitives'

type PdfStyle = ComponentProps<typeof Link>['style']

function SideSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={m.sideSection}>
      <View minPresenceAhead={40}>
        <Text style={m.sideLabel}>{label}</Text>
      </View>
      {children}
    </View>
  )
}

/** Text that is a link when there is a safe href for it, plain text otherwise. */
function MaybeLink({ href, style, children }: { href: string | undefined; style: PdfStyle; children: string }) {
  return href ? (
    <Link src={href} style={style}>
      {children}
    </Link>
  ) : (
    <Text style={style}>{children}</Text>
  )
}

function Contact({ cv, t }: { cv: CvData; t: PdfT }) {
  const { email, mobile, location } = cv.basics
  const rows = [
    hasText(email) ? { key: 'email', text: email.trim(), href: pdfMailHref(email) } : null,
    hasText(mobile) ? { key: 'mobile', text: mobile.trim(), href: pdfTelHref(mobile) } : null,
    hasText(location) ? { key: 'location', text: location.trim(), href: undefined } : null,
  ].filter((r) => r != null)
  if (!rows.length) return null
  return (
    <SideSection label={t('pdfContact')}>
      {rows.map((r, i) => (
        <View key={r.key} style={i === 0 ? m.sideItemFirst : m.sideItem}>
          <MaybeLink href={r.href} style={r.href ? m.sideLink : m.sideText}>
            {r.text}
          </MaybeLink>
        </View>
      ))}
    </SideSection>
  )
}

function Profiles({ cv, t }: { cv: CvData; t: PdfT }) {
  const links = (cv.links ?? []).flatMap((l) => {
    const href = pdfWebHref(l.url)
    return href && hasText(l.label) ? [{ label: l.label.trim(), href }] : []
  })
  if (!links.length) return null
  return (
    <SideSection label={t('pdfProfiles')}>
      {links.map((l, i) => (
        <View key={`${l.label}:${l.href}`} style={i === 0 ? m.sideItemFirst : m.sideItem} wrap={false}>
          <Link src={l.href} style={m.sideStrong}>
            {`${l.label} ↗`}
          </Link>
          <Link src={l.href} style={m.sideUrl}>
            {displayUrl(l.href)}
          </Link>
        </View>
      ))}
    </SideSection>
  )
}

function Chips({ items }: { items: string[] }) {
  return (
    <View style={m.chips}>
      {items.map((item, i) => (
        <View key={`${item}:${i}`} style={m.sideChip}>
          <Text style={m.sideChipText}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

function Credentials({ credentials, t }: { credentials: CvCredential[]; t: PdfT }) {
  return (
    <SideSection label={t('credentials')}>
      {orderCredentials(credentials).map((c, i) => {
        const href = pdfWebHref(c.url)
        const meta = [issuerDetail(c.issuer), credentialDates(c, t)].filter(hasText).join(' · ')
        return (
          <View key={credentialKey(c, i)} style={i === 0 ? m.sideItemFirst : m.sideCredential} wrap={false}>
            <MaybeLink href={href} style={m.sideStrong}>
              {c.label}
            </MaybeLink>
            {meta || href ? (
              <Text style={m.sideMeta}>
                {meta}
                {meta && href ? '   ' : ''}
                {href ? (
                  <Link src={href} style={m.sideUrl}>
                    {`${t('pdfVerify')} ↗`}
                  </Link>
                ) : null}
              </Text>
            ) : null}
          </View>
        )
      })}
    </SideSection>
  )
}

export function ModernSidebar({
  cv,
  photo,
  credentials,
  t,
}: {
  cv: CvData
  photo: PdfProfilePhoto
  /** Already filtered to unexpired ones; see `printableCredentials`. */
  credentials: CvCredential[]
  t: PdfT
}) {
  const skills = (cv.skills ?? []).filter(hasText).map((s) => s.trim())
  const languages = (cv.languages ?? []).filter(hasText).map(splitLanguageLevel)

  return (
    <View style={m.sidebar}>
      {photo.kind === 'image' ? (
        <Image src={photo.src} style={m.photo} />
      ) : (
        <View style={m.monogram}>
          <Text style={m.monogramText}>{initialsOf(cv.basics.name)}</Text>
        </View>
      )}

      <Contact cv={cv} t={t} />
      <Profiles cv={cv} t={t} />

      {skills.length ? (
        <SideSection label={t('skills')}>
          <Chips items={skills} />
        </SideSection>
      ) : null}

      {languages.length ? (
        <SideSection label={t('languages')}>
          {languages.map((l, i) => (
            <View key={`${l.name}:${i}`} style={[m.sideRow, i === 0 ? m.sideItemFirst : m.sideItem]} wrap={false}>
              <Text style={m.sideText}>{l.name}</Text>
              {l.level ? <Text style={m.sideMeta}>{l.level}</Text> : null}
            </View>
          ))}
        </SideSection>
      ) : null}

      {credentials.length ? <Credentials credentials={credentials} t={t} /> : null}
    </View>
  )
}

/** Name, role and email at the foot of the sidebar on every page after the first. */
export function ModernSidebarRunningHead({ cv }: { cv: CvData }) {
  const { role } = parseBasicsHeadline(cv.basics.headline)
  const email = cv.basics.email?.trim()
  const mail = pdfMailHref(email)
  return (
    <View
      fixed
      style={m.sideRunning}
      render={({ pageNumber }) =>
        pageNumber === 1 ? null : (
          <View>
            <Text style={m.sideRunningName}>{cv.basics.name}</Text>
            {hasText(role) ? <Text style={m.sideRunningMeta}>{role}</Text> : null}
            {/* A bare `Link` under a `render` prop is not drawn; nested in a `Text` it is. */}
            {email && mail ? (
              <Text style={m.sideRunningMeta}>
                <Link src={mail} style={m.sideRunningLink}>
                  {email}
                </Link>
              </Text>
            ) : null}
          </View>
        )
      }
    />
  )
}
