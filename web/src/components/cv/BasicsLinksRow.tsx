import { AtSign, ExternalLink, Globe } from 'lucide-react'
import { SiGithubIcon, SiLinkedinIcon, SiMastodonIcon, SiXIcon, SiYoutubeIcon } from '../icons/SimpleBrandIcons'
import { inferLinkKind } from '../../lib/cvPresentation'
import { LinkPill } from './LinkPill'
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
          <LinkPill
            key={`${l.label}:${l.url}`}
            href={l.url}
            icon={Icon}
            label={text}
            ariaLabel={`${l.label} (${t('opensInNewTab')})`}
          />
        )
      })}
    </div>
  )
}
