import type { ReactNode } from 'react'
import { cn } from './cn'

/**
 * The one surface in the app. Everything that used to hand-roll
 * a translucent card out of raw slate utilities with a `dark:` twin on every one of them
 * uses this instead, so surfaces cannot drift apart.
 */
export function Card({
  as: Tag = 'div',
  padding = 'md',
  className,
  children,
  ...rest
}: {
  as?: 'div' | 'section' | 'article' | 'aside'
  padding?: 'none' | 'sm' | 'md'
  className?: string
  children: ReactNode
} & React.HTMLAttributes<HTMLElement>) {
  const pad = padding === 'none' ? '' : padding === 'sm' ? 'p-4' : 'p-4 sm:p-6'
  return (
    <Tag className={cn('vc-card', pad, className)} {...rest}>
      {children}
    </Tag>
  )
}

/**
 * Card heading: an optional icon tile, the title, and room for actions on the right.
 * The icon tile is decorative — the title carries the meaning.
 */
export function CardHeader({
  title,
  icon,
  description,
  actions,
  headingLevel: Heading = 'h2',
  className,
}: {
  title: string
  icon?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  headingLevel?: 'h1' | 'h2' | 'h3'
  className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        {icon ? (
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-field border border-line bg-surface-muted text-ink-muted"
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          <Heading className="vc-eyebrow">{title}</Heading>
          {description ? <p className="mt-0.5 text-xs text-ink-subtle">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}
