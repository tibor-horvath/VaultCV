import { ExternalLink } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '../ui/cn'

type IconType = ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>

/**
 * The small outbound link used throughout the CV — profile links, company links, project links.
 * One component so those three never drift into three slightly different pills.
 */
export function LinkPill({
  href,
  icon: Icon,
  label,
  ariaLabel,
  className,
}: {
  href: string
  icon: IconType
  label: string
  ariaLabel: string
  className?: string
}) {
  return (
    <a
      className={cn(
        'vc-focusable group inline-flex shrink-0 items-center gap-1.5 rounded-field border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink-muted shadow-card hover:border-line-strong hover:bg-surface-muted hover:text-ink',
        className,
      )}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
      <ExternalLink className="h-3 w-3 shrink-0 text-ink-subtle" aria-hidden="true" />
    </a>
  )
}
