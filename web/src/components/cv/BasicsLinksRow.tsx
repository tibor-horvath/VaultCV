import { AtSign, ExternalLink, Globe } from 'lucide-react'
import { SiGithubIcon, SiLinkedinIcon, SiMastodonIcon, SiXIcon, SiYoutubeIcon } from '../icons/SimpleBrandIcons'
import { inferLinkKind } from '../../lib/cvPresentation'
import { useI18n } from '../../lib/i18n'

type LinkItem = { label: string; url: string }

export function BasicsLinksRow({
  links,
  className = 'mt-4 flex flex-wrap gap-2',
}: {
  links?: LinkItem[]
  className?: string
}) {
  const { t } = useI18n()
  const visibleLinks = (links ?? []).filter((l) => Boolean(l.url?.trim()))
  if (!visibleLinks.length) return null

  return (
    <div className={className}>
      {visibleLinks.map((l) => {
        const kind = inferLinkKind(l)
        const Icon =
          kind === 'github'
            ? SiGithubIcon
            : kind === 'linkedin'
              ? SiLinkedinIcon
              : kind === 'youtube'
                ? SiYoutubeIcon
                : kind === 'email'
                  ? AtSign
                  : kind === 'x'
                    ? SiXIcon
                    : kind === 'mastodon'
                      ? SiMastodonIcon
                      : kind === 'web'
                        ? Globe
                        : ExternalLink
        const text =
          kind === 'github'
            ? 'GitHub'
            : kind === 'linkedin'
              ? 'LinkedIn'
              : kind === 'youtube'
                ? 'YouTube'
                : kind === 'email'
                  ? 'Email'
                  : kind === 'x'
                    ? 'X'
                    : kind === 'mastodon'
                      ? 'Mastodon'
                      : kind === 'web'
                        ? l.label || t('web')
                        : l.label

        return (
          <a
            key={`${l.label}:${l.url}`}
            className="group inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:border-slate-700/70 dark:bg-slate-950/80 dark:text-slate-200 dark:hover:bg-slate-900 dark:focus:ring-offset-slate-950"
            href={l.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${l.label} (${t('opensInNewTab')})`}
          >
            <Icon
              className="h-3.5 w-3.5 shrink-0 opacity-80 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
            <span>{text}</span>
            <ExternalLink
              className="h-3.5 w-3.5 shrink-0 opacity-50 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </a>
        )
      })}
    </div>
  )
}
