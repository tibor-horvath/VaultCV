import type { ComponentType } from 'react'
import { BookOpenText, ExternalLink, FlaskConical, Globe, ScanSearch } from 'lucide-react'
import { inferProjectLinkLabelKind } from '../../lib/cvPresentation'
import type { CvProject } from '../../types/cv'
import { SiAppstoreIcon, SiGithubIcon, SiGitlabIcon, SiGoogleplayIcon, SiNpmIcon, SiPypiIcon, SiYoutubeIcon } from '../icons/SimpleBrandIcons'
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
    <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
      {items.map((p) => {
        const links = p.links ?? []

        return (
          <article
            key={p.name}
            className="py-3.5"
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
              <div className="min-w-0 font-semibold text-slate-900 dark:text-slate-100">{p.name}</div>
              {links.map((l) => {
                const kind = inferProjectLinkLabelKind(l)
                const Icon = PROJECT_LINK_ICONS[kind] ?? Globe
                // A custom link carries its own label; presets use the fixed chip text.
                const text = kind === 'other' ? (l.label ?? '').trim() || t('web') : PROJECT_LINK_TEXT[kind] ?? t('web')
                return (
                  <a
                    key={`${p.name}:${kind}:${l.label}:${l.url}`}
                    className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700/70 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900 dark:focus:ring-offset-slate-950"
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${p.name}: ${text} (${t('opensInNewTab')})`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-80 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                    <span>{text}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-50 transition-opacity group-hover:opacity-100" aria-hidden="true" />
                  </a>
                )
              })}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{p.description}</p>
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
