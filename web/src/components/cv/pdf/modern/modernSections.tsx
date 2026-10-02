import type { ReactNode } from 'react'
import { Link, Text, View } from '@react-pdf/renderer'
import type { CvAward, CvEducation, CvExperience, CvLink, CvProject } from '../../../../types/cv'
import { parseBasicsHeadline } from '../../../../lib/cvPresentation'
import { highlightChildKey, stableEducationKey, stableExperienceKey } from '../../../../lib/cvKeys'
import { pdfWebHref } from '../../../../lib/pdf/links'
import { m } from '../../../../lib/pdf/modernStyles'
import { pt } from '../../../../lib/pdf/tokens'
import { hasText } from '../../../../lib/pdf/text'
import { dateRange } from '../document/format'
import type { PdfT } from '../document/primitives'

/**
 * Unlike the print layout, every URL the CV carries becomes a link here: this PDF is read on a
 * screen, where clicking through to a profile or a credential is the point.
 */

/** Room for a heading plus the first lines of its first entry, so a heading is never stranded. */
const SECTION_HEADING_MIN_AHEAD = pt(140)

function SectionHeading({ children }: { children: string }) {
  return (
    <View style={m.sectionHead} minPresenceAhead={SECTION_HEADING_MIN_AHEAD}>
      <Text style={m.sectionTitle}>{children}</Text>
      <View style={m.sectionRule} />
    </View>
  )
}

/**
 * `atomic` keeps a short section on one page. `minPresenceAhead` alone does not hold a heading to
 * a grid of `wrap={false}` cards: react-pdf moved the cards and left the heading behind.
 */
function Section({ title, atomic = false, children }: { title: string; atomic?: boolean; children: ReactNode }) {
  return (
    <View style={m.section} wrap={!atomic}>
      <SectionHeading>{title}</SectionHeading>
      {children}
    </View>
  )
}

/** The company's own site is the most useful single link; otherwise the first usable one. */
function primaryHref(links: CvLink[] | undefined): string | undefined {
  const usable = (links ?? []).filter((l) => pdfWebHref(l.url))
  const website = usable.find((l) => /web|site|home/i.test(l.label))
  return pdfWebHref((website ?? usable[0])?.url)
}

function Tags({ items, card = false }: { items: string[]; card?: boolean }) {
  const visible = items.filter(hasText).map((v) => v.trim())
  if (!visible.length) return null
  return (
    <View style={m.tags}>
      {visible.map((tag, i) => (
        <View key={`${tag}:${i}`} style={card ? m.cardTag : m.tag}>
          <Text style={card ? m.cardTagText : m.tagText}>{tag}</Text>
        </View>
      ))}
    </View>
  )
}

function Bullets({ items, keyFor }: { items: string[]; keyFor: (index: number) => string }) {
  const visible = items.filter(hasText)
  if (!visible.length) return null
  return (
    <View style={m.bulletList}>
      {visible.map((item, i) => (
        // Atomic at bullet granularity only: `wrap={false}` clips anything taller than a page.
        <View key={keyFor(i)} style={m.bulletRow} wrap={false}>
          <Text style={m.bulletDot}>•</Text>
          <Text style={m.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  )
}

/** One stop on the timeline: a dot, the rail down to the next entry, and the entry itself. */
function TimelineEntry({
  title,
  dates,
  org,
  orgHref,
  place,
  last,
  children,
}: {
  title: string
  dates: string
  org?: string
  orgHref?: string
  place?: string
  last: boolean
  children?: ReactNode
}) {
  return (
    <View style={m.entry}>
      <View style={m.entryRail}>
        <View style={m.entryDot} />
        {last ? null : <View style={m.entryLine} />}
      </View>
      <View style={last ? [m.entryBody, m.entryBodyLast] : m.entryBody}>
        <View minPresenceAhead={pt(48)}>
          <View style={m.entryRow}>
            <Text style={m.entryTitle}>{title}</Text>
            {hasText(dates) ? <Text style={m.entryDates}>{dates}</Text> : null}
          </View>
          {hasText(org) || hasText(place) ? (
            <View style={m.entryRow}>
              <Text style={m.entryOrg}>
                {hasText(org) && orgHref ? (
                  <Link src={orgHref} style={m.entryOrgLink}>
                    {`${org.trim()} ↗`}
                  </Link>
                ) : (
                  (org?.trim() ?? '')
                )}
              </Text>
              {hasText(place) ? <Text style={m.entryPlace}>{place.trim()}</Text> : null}
            </View>
          ) : null}
        </View>
        {children}
      </View>
    </View>
  )
}

export function ModernHeader({ name, headline, summary }: { name: string; headline: string; summary?: string }) {
  const { role, chip } = parseBasicsHeadline(headline)
  return (
    <View>
      <Text style={m.name}>{name}</Text>
      {hasText(role) ? (
        <View style={m.headlineRow}>
          <Text style={m.role}>{role}</Text>
          {hasText(chip) ? <Text style={m.headlineChip}>{chip}</Text> : null}
        </View>
      ) : null}
      {hasText(summary) ? <Text style={m.summary}>{summary.trim()}</Text> : null}
    </View>
  )
}

export function ModernExperience({ experience, t }: { experience: CvExperience[]; t: PdfT }) {
  return (
    <Section title={t('experience')}>
      {experience.map((x, i) => {
        const rowKey = stableExperienceKey(x)
        return (
          <TimelineEntry
            key={rowKey}
            title={x.role}
            dates={dateRange(x.start, x.end, t)}
            org={x.company}
            orgHref={primaryHref(x.links)}
            place={x.location}
            last={i === experience.length - 1}
          >
            <Bullets items={x.highlights ?? []} keyFor={(idx) => highlightChildKey(rowKey, idx)} />
            <Tags items={x.skills ?? []} />
          </TimelineEntry>
        )
      })}
    </Section>
  )
}

export function ModernEducation({ education, t }: { education: CvEducation[]; t: PdfT }) {
  return (
    <Section title={t('education')}>
      {education.map((e, i) => {
        const rowKey = stableEducationKey(e)
        const qualification = [e.degree, e.field].filter(hasText).map((v) => v.trim()).join(', ')
        const badges = [hasText(e.gpa) ? `${t('adminGpa')} ${e.gpa.trim()}` : null, e.honors].filter(hasText)
        return (
          <TimelineEntry
            key={rowKey}
            title={qualification || e.school}
            dates={dateRange(e.start, e.end, t)}
            org={qualification ? e.school : undefined}
            orgHref={pdfWebHref(e.schoolUrl)}
            place={e.location}
            last={i === education.length - 1}
          >
            {hasText(e.program) ? <Text style={m.entryDetail}>{e.program.trim()}</Text> : null}
            {hasText(e.thesisTitle) ? (
              <Text style={m.entryDetail}>
                {t('educationThesis')}: {e.thesisTitle.trim()}
                {hasText(e.advisor) ? ` · ${t('educationAdvisor')}: ${e.advisor.trim()}` : ''}
              </Text>
            ) : null}
            <Bullets items={e.highlights ?? []} keyFor={(idx) => highlightChildKey(rowKey, idx)} />
            <Tags items={badges} />
          </TimelineEntry>
        )
      })}
    </Section>
  )
}

export function ModernProjects({ projects, t }: { projects: CvProject[]; t: PdfT }) {
  return (
    <Section title={t('projects')}>
      {projects.map((p, i) => {
        const links = (p.links ?? []).flatMap((l) => {
          const href = pdfWebHref(l.url)
          return href && hasText(l.label) ? [{ label: l.label.trim(), href }] : []
        })
        return (
          <View key={`${p.name}:${i}`} style={i === 0 ? [m.card, m.cardFirst] : m.card} wrap={false}>
            <View style={m.entryRow}>
              <Text style={m.entryTitle}>{p.name}</Text>
              {links.length ? (
                <View style={m.cardLinks}>
                  {links.map((l) => (
                    <Link key={`${l.label}:${l.href}`} src={l.href} style={m.cardLink}>
                      {`${l.label} ↗`}
                    </Link>
                  ))}
                </View>
              ) : null}
            </View>
            {hasText(p.description) ? <Text style={m.entryDetail}>{p.description.trim()}</Text> : null}
            <Tags items={p.tags ?? []} card />
          </View>
        )
      })}
    </Section>
  )
}

export function ModernAwards({ awards, t }: { awards: CvAward[]; t: PdfT }) {
  const awardKey = (a: CvAward, i: number) => a.id ?? `${a.title}:${a.issuer ?? ''}:${a.year ?? ''}:${i}`
  return (
    <Section title={t('honorsAwards')} atomic>
      <View style={m.awardGrid}>
        {awards.map((a, i) => (
          <View key={awardKey(a, i)} style={m.award} wrap={false}>
            {hasText(a.year) ? <Text style={m.awardYear}>{a.year.trim()}</Text> : null}
            <Text style={m.awardTitle}>{a.title}</Text>
            {hasText(a.issuer) ? <Text style={m.awardIssuer}>{a.issuer.trim()}</Text> : null}
          </View>
        ))}
      </View>
    </Section>
  )
}

export function ModernInterests({ title, items }: { title: string; items: string[] }) {
  const visible = items.filter(hasText).map((v) => v.trim())
  if (!visible.length) return null
  return (
    <Section title={title} atomic>
      <View style={m.chips}>
        {visible.map((item, i) => (
          <View key={`${item}:${i}`} style={m.pill}>
            <Text style={m.pillText}>{item}</Text>
          </View>
        ))}
      </View>
    </Section>
  )
}
