import type { ComponentType } from 'react'
import { BookOpenText, FlaskConical, Globe, ScanSearch } from 'lucide-react'
import { inferProjectLinkLabelKind } from '../../lib/cvPresentation'
import type { CvProject } from '../../types/cv'
import { SiAppstoreIcon, SiGithubIcon, SiGitlabIcon, SiGoogleplayIcon, SiNpmIcon, SiPypiIcon, SiYoutubeIcon } from '../icons/SimpleBrandIcons'
import { LinkPill } from './LinkPill'
import { SkillsChips } from './SkillsChips'
import { useI18n } from '../../lib/i18n'

type ProjectLinkKind = ReturnType<typeof inferProjectLinkLabelKind>
type ChipIcon = ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>

/** `web` and `other` (custom labels) are absent on purpose: both fall back to the globe. */
const PROJECT_LINK_ICONS: Partial<Record<ProjectLinkKind, ChipIcon>> = {
  github: SiGithubIcon,
  gitlab: SiGitlabIcon,
  docs: BookOpenText,
  video: SiYoutubeIcon,
  demo: FlaskConical,
  'case-study': ScanSearch,
  npm: SiNpmIcon,
  pypi: SiPypiIcon,
  'app-store': SiAppstoreIcon,
  'play-store': SiGoogleplayIcon,
}

const PROJECT_LINK_TEXT: Partial<Record<ProjectLinkKind, string>> = {
  github: 'GitHub',
  gitlab: 'GitLab',
  docs: 'Docs',
  video: 'Video',
  demo: 'Demo',
  'case-study': 'Case study',
  npm: 'NPM',
  pypi: 'PyPI',
  'app-store': 'App Store',
  'play-store': 'Play Store',
}

export function ProjectsGrid({ items }: { items: CvProject[] }) {
  const { t } = useI18n()
  return (
    <div className="divide-y divide-line">
      {items.map((p) => {
        const links = p.links ?? []

        return (
          <article
            key={p.name}
            className="py-4 first:pt-0 last:pb-0"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
              <h3 className="min-w-0 text-sm font-semibold text-ink">{p.name}</h3>
              {links.map((l) => {
                const kind = inferProjectLinkLabelKind(l)
                const Icon = PROJECT_LINK_ICONS[kind] ?? Globe
                // A custom link carries its own label; presets use the fixed chip text.
                const text = kind === 'other' ? (l.label ?? '').trim() || t('web') : PROJECT_LINK_TEXT[kind] ?? t('web')
                return (
                  <LinkPill
                    key={`${p.name}:${kind}:${l.label}:${l.url}`}
                    href={l.url}
                    icon={Icon}
                    label={text}
                    ariaLabel={`${p.name}: ${text} (${t('opensInNewTab')})`}
                  />
                )
              })}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{p.description}</p>
            {p.tags?.length ? (
              <div className="mt-3">
                <SkillsChips items={p.tags} />
              </div>
            ) : null}
          </article>
        )
      })}
    </div>
  )
}
