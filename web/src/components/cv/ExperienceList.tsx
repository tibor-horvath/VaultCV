import type { CvExperience } from '../../types/cv'
import { highlightChildKey, stableExperienceKey } from '../../lib/cvKeys'
import { Calendar, ExternalLink, Globe, MapPin } from 'lucide-react'
import { SiLinkedinIcon } from '../icons/SimpleBrandIcons'
import { LinkPill } from './LinkPill'
import { SkillsChips } from './SkillsChips'
import { useI18n } from '../../lib/i18n'
import { inferLinkKind } from '../../lib/cvPresentation'

function ExperienceLinkPills({ x }: { x: CvExperience }) {
  const links = (x.links ?? []).filter((link) => (link.label ?? '').trim() && (link.url ?? '').trim())
  return (
    <>
      {links.map((link) => {
        const kind = inferLinkKind(link)
        const Icon = kind === 'linkedin' ? SiLinkedinIcon : kind === 'web' ? Globe : ExternalLink
        return (
          <LinkPill
            key={`${x.company}:${x.role}:${link.label}:${link.url}`}
            href={link.url}
            icon={Icon}
            label={link.label}
            ariaLabel={`${x.company} ${link.label}`}
          />
        )
      })}
    </>
  )
}

/**
 * One role: title line, then a metadata row of dates, location and company links, then the
 * highlights. A single responsive layout, where this used to be two full copies of the markup
 * behind `sm:hidden` / `hidden sm:flex`.
 */
function ExperienceItem({ x }: { x: CvExperience }) {
  const { t } = useI18n()
  const rowKey = stableExperienceKey(x)
  const hasCompanyLinks = Boolean((x.links ?? []).some((link) => (link.label ?? '').trim() && (link.url ?? '').trim()))

  return (
    <article className="py-4 first:pt-0 last:pb-0">
      <h3 className="text-sm font-semibold text-ink">
        {x.role}
        <span className="text-ink-subtle"> · </span>
        <span className="font-medium text-ink-muted">{x.company}</span>
      </h3>

      {/*
        Dates sit with the other metadata rather than floated to the opposite edge: on a wide
        column a right-aligned date ends up a long way from the role it belongs to.
      */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="inline-flex items-center gap-1.5 text-xs tabular-nums text-ink-subtle">
          <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {x.start} – {x.end ?? t('present')}
        </span>
        {x.location ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-subtle">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {x.location}
          </span>
        ) : null}
        {hasCompanyLinks ? <ExperienceLinkPills x={x} /> : null}
      </div>

      {x.highlights?.length ? (
        <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-ink-muted">
          {x.highlights.map((h, i) => (
            <li key={highlightChildKey(rowKey, i)} className="relative pl-4">
              {/* A small dot rather than a list marker: it aligns with the text baseline and
                  survives the wrap of a long highlight. */}
              <span className="absolute left-0 top-[0.5625rem] h-1 w-1 rounded-full bg-line-strong" aria-hidden="true" />
              {h}
            </li>
          ))}
        </ul>
      ) : null}

      {x.skills?.length ? (
        <div className="mt-3">
          <p className="vc-eyebrow mb-2">{t('skills')}</p>
          <SkillsChips items={x.skills} />
        </div>
      ) : null}
    </article>
  )
}

export function ExperienceList({ items }: { items: CvExperience[] }) {
  return (
    <div className="divide-y divide-line">
      {items.map((x) => (
        <ExperienceItem key={stableExperienceKey(x)} x={x} />
      ))}
    </div>
  )
}
