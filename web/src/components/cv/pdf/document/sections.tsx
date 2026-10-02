import { Text, View } from '@react-pdf/renderer'
import type { CvAward, CvCredential, CvEducation, CvExperience, CvProject } from '../../../../types/cv'
import { highlightChildKey, stableEducationKey, stableExperienceKey } from '../../../../lib/cvKeys'
import { s } from '../../../../lib/pdf/styles'
import {
  PdfBullets,
  PdfDatedEntry,
  PdfGutterRow,
  PdfListRow,
  PdfSectionHeading,
  type PdfT,
} from './primitives'
import { hasText, joinDot } from '../../../../lib/pdf/text'
import { credentialDates, credentialKey, dateRange, issuerDetail, orderCredentials } from './format'

/**
 * Links are deliberately absent from every section: the printed CV is read on paper, where a URL
 * is noise. They remain on the web CV.
 */

export function PdfSummary({ summary, t }: { summary: string; t: PdfT }) {
  return (
    <View style={s.section}>
      <PdfGutterRow label={t('profile')}>
        <Text style={s.bodyText}>{summary}</Text>
      </PdfGutterRow>
    </View>
  )
}

export function PdfSkillsLanguages({ skills, languages, t }: { skills: string[]; languages: string[]; t: PdfT }) {
  const skillLine = joinDot(skills)
  const languageLine = joinDot(languages)
  if (!skillLine && !languageLine) return null
  return (
    <View style={s.section} wrap={false}>
      {skillLine ? (
        <PdfGutterRow label={t('skills')}>
          <Text style={s.bodyText}>{skillLine}</Text>
        </PdfGutterRow>
      ) : null}
      {languageLine ? (
        <PdfGutterRow label={t('languages')} spaced={Boolean(skillLine)}>
          <Text style={s.bodyText}>{languageLine}</Text>
        </PdfGutterRow>
      ) : null}
    </View>
  )
}

export function PdfInlineSection({ title, items }: { title: string; items: string[] }) {
  const line = joinDot(items)
  if (!line) return null
  return (
    <View style={s.section} wrap={false}>
      <PdfGutterRow label={title}>
        <Text style={s.bodyText}>{line}</Text>
      </PdfGutterRow>
    </View>
  )
}

export function PdfExperience({ experience, t }: { experience: CvExperience[]; t: PdfT }) {
  return (
    <View style={s.section}>
      <PdfSectionHeading>{t('experience')}</PdfSectionHeading>
      {experience.map((x) => {
        const rowKey = stableExperienceKey(x)
        const tags = joinDot(x.skills ?? [])
        return (
          <PdfDatedEntry
            key={rowKey}
            dates={dateRange(x.start, x.end, t)}
            place={x.location}
            title={
              <>
                <Text style={s.entryTitleStrong}>{x.role}</Text>
                {hasText(x.company) ? ` · ${x.company.trim()}` : ''}
              </>
            }
          >
            <PdfBullets items={x.highlights ?? []} keyFor={(idx) => highlightChildKey(rowKey, idx)} />
            {tags ? <Text style={s.tagLine}>{tags}</Text> : null}
          </PdfDatedEntry>
        )
      })}
    </View>
  )
}

function PdfProjectItem({ project: p, first }: { project: CvProject; first: boolean }) {
  const tags = joinDot(p.tags ?? [])
  return (
    <View style={first ? [s.project, s.projectFirst] : s.project} wrap={false}>
      <Text style={s.projectTitle}>{p.name}</Text>
      {hasText(p.description) ? <Text style={s.entryDetail}>{p.description}</Text> : null}
      {tags ? <Text style={s.tagLine}>{tags}</Text> : null}
    </View>
  )
}

export function PdfProjects({ projects, t }: { projects: CvProject[]; t: PdfT }) {
  return (
    <View style={s.section}>
      <PdfGutterRow label={t('projects')}>
        {projects.map((p, i) => (
          <PdfProjectItem key={`${p.name}:${i}`} project={p} first={i === 0} />
        ))}
      </PdfGutterRow>
    </View>
  )
}

export function PdfEducation({ education, t }: { education: CvEducation[]; t: PdfT }) {
  return (
    <View style={s.section}>
      <PdfSectionHeading>{t('education')}</PdfSectionHeading>
      {education.map((e) => {
        const rowKey = stableEducationKey(e)
        const qualification = [e.degree, e.field].filter(hasText).map((v) => v.trim()).join(' ')
        const detail = joinDot([e.program, hasText(e.gpa) ? `${t('adminGpa')} ${e.gpa.trim()}` : null, e.honors])
        return (
          <PdfDatedEntry
            key={rowKey}
            dates={dateRange(e.start, e.end, t)}
            place={e.location}
            title={
              qualification ? (
                <>
                  <Text style={s.entryTitleStrong}>{qualification}</Text>
                  {` · ${e.school}`}
                </>
              ) : (
                <Text style={s.entryTitleStrong}>{e.school}</Text>
              )
            }
          >
            {detail ? <Text style={s.entryDetail}>{detail}</Text> : null}
            {hasText(e.thesisTitle) ? (
              <Text style={s.entryDetail}>
                {t('educationThesis')}: {e.thesisTitle.trim()}
                {hasText(e.advisor) ? ` · ${t('educationAdvisor')}: ${e.advisor.trim()}` : ''}
              </Text>
            ) : null}
            <PdfBullets items={e.highlights ?? []} keyFor={(idx) => highlightChildKey(rowKey, idx)} />
          </PdfDatedEntry>
        )
      })}
    </View>
  )
}

/** Expects already-filtered (unexpired) credentials; see `printableCredentials`. */
export function PdfCredentials({ credentials, t }: { credentials: CvCredential[]; t: PdfT }) {
  const ordered = orderCredentials(credentials)
  return (
    <View style={s.section}>
      <PdfGutterRow label={t('credentials')}>
        {ordered.map((c, i) => (
          <PdfListRow
            key={credentialKey(c, i)}
            strong={c.label}
            detail={issuerDetail(c.issuer)}
            date={credentialDates(c, t)}
            first={i === 0}
            last={i === ordered.length - 1}
          />
        ))}
      </PdfGutterRow>
    </View>
  )
}

export function PdfAwards({ awards, t }: { awards: CvAward[]; t: PdfT }) {
  const awardKey = (a: CvAward, i: number) => a.id ?? `${a.title}:${a.issuer ?? ''}:${a.year ?? ''}:${i}`
  return (
    <View style={s.section}>
      <PdfGutterRow label={t('honorsAwards')}>
        {awards.map((a, i) => (
          <PdfListRow
            key={awardKey(a, i)}
            strong={a.title}
            detail={a.issuer}
            date={a.year}
            first={i === 0}
            last={i === awards.length - 1}
          />
        ))}
      </PdfGutterRow>
    </View>
  )
}
