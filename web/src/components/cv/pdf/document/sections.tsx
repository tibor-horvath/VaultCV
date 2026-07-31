import { Text, View } from '@react-pdf/renderer'
import type { CvAward, CvCredential, CvCredentialIssuer, CvEducation, CvExperience, CvProject } from '../../../../types/cv'
import { inferLinkKind, inferProjectLinkLabelKind } from '../../../../lib/cvPresentation'
import { hasPdfUrl } from '../../../../lib/pdfLinks'
import { highlightChildKey, stableEducationKey, stableExperienceKey } from '../../../../lib/cvKeys'
import { s } from '../../../../lib/pdf/styles'
import { color, iconSize } from '../../../../lib/pdf/tokens'
import { PdfIcon } from '../icons/PdfIcon'
import type { PdfIconName } from '../icons/pdfIcons'
import {
  PdfBullets,
  PdfChipRow,
  PdfIconRow,
  PdfMetaItem,
  PdfSectionHeading,
  PdfUrlLine,
  type PdfT,
} from './primitives'

/**
 * `cncf` was missing from the previous print layout's issuer list, so CNCF credentials were
 * silently dropped from the PDF. Included here so no credential is lost.
 */
const CREDENTIAL_ISSUER_ORDER: CvCredentialIssuer[] = [
  'microsoft',
  'aws',
  'google',
  'cncf',
  'school',
  'language',
  'other',
]

const ISSUER_ICONS: Record<CvCredentialIssuer, PdfIconName> = {
  microsoft: 'microsoft',
  aws: 'aws',
  google: 'google',
  cncf: 'shieldCheck',
  school: 'graduationCap',
  language: 'languages',
  other: 'shieldCheck',
}

function issuerLabel(issuer: CvCredentialIssuer, t: PdfT): string {
  if (issuer === 'language') return t('languageExams')
  if (issuer === 'school') return t('education')
  if (issuer === 'other') return t('other')
  if (issuer === 'aws') return 'AWS'
  if (issuer === 'cncf') return 'CNCF'
  return issuer.charAt(0).toUpperCase() + issuer.slice(1)
}

const PROJECT_LINK_ICONS: Record<string, PdfIconName> = {
  github: 'github',
  gitlab: 'gitlab',
  docs: 'bookOpenText',
  video: 'youtube',
  demo: 'flaskConical',
  'case-study': 'scanSearch',
  npm: 'npm',
  pypi: 'pypi',
  'app-store': 'appstore',
  'play-store': 'googleplay',
}

/** `divide-y` has no react-pdf equivalent; the separator is a top border, suppressed on the first row. */
function articleStyle(index: number) {
  return index === 0 ? [s.article, s.articleFirst] : s.article
}

function educationCredentialLine(e: CvEducation): string {
  return [e.degree, e.field, e.program].filter((v) => v != null && String(v).trim() !== '').join(' · ')
}

export function PdfSummary({ summary }: { summary: string }) {
  return (
    <View style={s.section}>
      <Text style={s.summary}>{summary}</Text>
    </View>
  )
}

function credentialKey(c: CvCredential): string {
  return `${c.issuer}:${c.label}:${c.url}:${c.dateEarned ?? ''}:${c.dateExpires ?? ''}`
}

function PdfCredentialItem({ credential: c, index, t }: { credential: CvCredential; index: number; t: PdfT }) {
  return (
    <View style={articleStyle(index)} wrap={false}>
      <Text style={s.articleTitle}>{c.label}</Text>
      {hasPdfUrl(c.url) ? (
        <PdfIconRow icon="globe">
          <PdfUrlLine href={c.url} />
        </PdfIconRow>
      ) : null}
      {c.dateEarned || c.dateExpires ? (
        <View style={s.metaRow}>
          {c.dateEarned ? (
            <PdfMetaItem icon="calendar">
              {t('earned')} {c.dateEarned}
            </PdfMetaItem>
          ) : null}
          {c.dateExpires ? (
            <PdfMetaItem icon="calendar">
              {t('expires')} {c.dateExpires}
            </PdfMetaItem>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

export function PdfCredentials({ credentials, t }: { credentials: CvCredential[]; t: PdfT }) {
  const groups = CREDENTIAL_ISSUER_ORDER.map((issuer) => ({
    issuer,
    items: credentials.filter((c) => c.issuer === issuer),
  })).filter((g) => g.items.length)

  return (
    <View style={s.section}>
      {groups.map(({ issuer, items }, groupIndex) => {
        const [first, ...rest] = items
        return (
          <View key={issuer}>
            {/* Heading and its first card form one unwrappable unit, so a heading can never be
                stranded at the foot of a page. `minPresenceAhead` cannot guarantee this on its
                own: it only says how much room to demand, not how tall the next card really is.
                The section heading joins the first group's block for the same reason. */}
            <View wrap={false}>
              {groupIndex === 0 ? (
                <PdfSectionHeading minPresenceAhead={0}>{t('credentials')}</PdfSectionHeading>
              ) : null}
              <View style={s.subHeading}>
                <PdfIcon name={ISSUER_ICONS[issuer]} size={iconSize.sm} color={color.slate600} />
                <Text style={s.subHeadingText}>{issuerLabel(issuer, t)}</Text>
              </View>
              {first ? <PdfCredentialItem credential={first} index={0} t={t} /> : null}
            </View>
            {rest.map((c, i) => (
              <PdfCredentialItem key={credentialKey(c)} credential={c} index={i + 1} t={t} />
            ))}
          </View>
        )
      })}
    </View>
  )
}

export function PdfChipSection({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={s.section}>
      <PdfSectionHeading>{title}</PdfSectionHeading>
      <PdfChipRow items={items} />
    </View>
  )
}

export function PdfExperience({ experience, t }: { experience: CvExperience[]; t: PdfT }) {
  return (
    <View style={s.section}>
      <PdfSectionHeading>{t('experience')}</PdfSectionHeading>
      {experience.map((x, i) => {
        const rowKey = stableExperienceKey(x)
        const links = (x.links ?? []).filter((l) => hasPdfUrl(l.url) && String(l.label ?? '').trim())
        return (
          <View key={rowKey} style={articleStyle(i)}>
            {/* Identity block stays together; highlights below may flow to the next page. */}
            <View wrap={false}>
              <Text style={s.articleTitle}>{x.role}</Text>
              <PdfIconRow icon="atSign" iconColor={color.slate400} size={iconSize.sm}>
                <Text style={s.articleTitle}>{x.company}</Text>
              </PdfIconRow>
              <View style={s.metaRow}>
                <PdfMetaItem icon="calendar">
                  {x.start} – {x.end ?? t('present')}
                </PdfMetaItem>
                {x.location ? <PdfMetaItem icon="mapPin">{x.location}</PdfMetaItem> : null}
              </View>
            </View>
            {links.map((l) => (
              <PdfIconRow key={`${x.company}:${x.role}:${l.label}:${l.url}`} icon={inferLinkKind(l) === 'linkedin' ? 'linkedin' : 'globe'}>
                <PdfUrlLine href={l.url} />
              </PdfIconRow>
            ))}
            <PdfBullets items={x.highlights ?? []} keyFor={(idx) => highlightChildKey(rowKey, idx)} />
            {x.skills?.length ? (
              <View>
                <Text style={s.skillsLabel}>{t('skills')}</Text>
                <PdfChipRow items={x.skills} />
              </View>
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

function PdfProjectItem({ project: p, index }: { project: CvProject; index: number }) {
  const links = (p.links ?? []).filter((l) => hasPdfUrl(l.url))
  return (
    <View style={articleStyle(index)} wrap={false}>
      <Text style={s.articleTitle}>{p.name}</Text>
      {links.map((l) => (
        <PdfIconRow key={`${p.name}:${l.url}`} icon={PROJECT_LINK_ICONS[inferProjectLinkLabelKind(l)] ?? 'globe'}>
          <PdfUrlLine href={l.url} />
        </PdfIconRow>
      ))}
      {p.description ? <Text style={[s.summary, { marginTop: 4 }]}>{p.description}</Text> : null}
      <PdfChipRow items={p.tags ?? []} />
    </View>
  )
}

export function PdfProjects({ projects, t }: { projects: CvProject[]; t: PdfT }) {
  const [first, ...rest] = projects
  return (
    <View style={s.section}>
      {/* Project cards are atomic already, so heading + first card can be bound exactly. */}
      <View wrap={false}>
        <PdfSectionHeading minPresenceAhead={0}>{t('projects')}</PdfSectionHeading>
        {first ? <PdfProjectItem project={first} index={0} /> : null}
      </View>
      {rest.map((p, i) => (
        <PdfProjectItem key={p.name} project={p} index={i + 1} />
      ))}
    </View>
  )
}

export function PdfEducation({ education, t }: { education: CvEducation[]; t: PdfT }) {
  return (
    <View style={s.section}>
      <PdfSectionHeading>{t('education')}</PdfSectionHeading>
      {education.map((e, i) => {
        const rowKey = stableEducationKey(e)
        const credential = educationCredentialLine(e)
        return (
          <View key={rowKey} style={articleStyle(i)}>
            <View wrap={false}>
              {credential ? <Text style={s.articleTitle}>{credential}</Text> : null}
              <Text style={s.articleTitle}>{e.school}</Text>
              {hasPdfUrl(e.schoolUrl) ? (
                <PdfIconRow icon="globe">
                  <PdfUrlLine href={e.schoolUrl} />
                </PdfIconRow>
              ) : null}
              <View style={s.metaRow}>
                {e.location ? <PdfMetaItem icon="mapPin">{e.location}</PdfMetaItem> : null}
                {e.start || e.end ? (
                  <PdfMetaItem icon="calendar">
                    {e.start ?? ''}
                    {e.start && e.end ? ' – ' : ''}
                    {e.end ?? t('present')}
                  </PdfMetaItem>
                ) : null}
              </View>
            </View>
            <PdfBullets items={e.highlights ?? []} keyFor={(idx) => highlightChildKey(rowKey, idx)} />
          </View>
        )
      })}
    </View>
  )
}

function PdfAwardItem({ award: a, index }: { award: CvAward; index: number }) {
  return (
    <View style={articleStyle(index)} wrap={false}>
      <Text style={s.articleTitle}>{a.title}</Text>
      {a.issuer || a.year ? <Text style={s.metaText}>{[a.issuer, a.year].filter(Boolean).join(' · ')}</Text> : null}
    </View>
  )
}

export function PdfAwards({ awards, t }: { awards: CvAward[]; t: PdfT }) {
  const awardKey = (a: CvAward, i: number) => a.id ?? `${a.title}:${a.issuer ?? ''}:${a.year ?? ''}:${i}`
  const [first, ...rest] = awards
  return (
    <View style={s.section}>
      <View wrap={false}>
        <PdfSectionHeading minPresenceAhead={0}>{t('honorsAwards')}</PdfSectionHeading>
        {first ? <PdfAwardItem award={first} index={0} /> : null}
      </View>
      {rest.map((a, i) => (
        <PdfAwardItem key={awardKey(a, i + 1)} award={a} index={i + 1} />
      ))}
    </View>
  )
}
