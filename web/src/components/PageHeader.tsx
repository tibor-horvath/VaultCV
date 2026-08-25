import type { ReactNode } from 'react'

/**
 * Standard page heading: title (with an optional icon), a line of context under it, and the
 * page-level actions on the right. A rule underneath separates it from the content without
 * needing a card around everything.
 */
export type PageHeaderProps = {
  /** Main title text */
  title: string
  /** Optional icon displayed next to title */
  icon?: ReactNode
  /** Optional subtitle or email displayed below title (supports ReactNode for formatting) */
  subtitle?: ReactNode
  /** Action buttons displayed on the right (responsive) */
  actions?: ReactNode
  /** Semantic heading level for the title */
  headingLevel?: 'h1' | 'h2' | 'h3'
}

export function PageHeader(props: PageHeaderProps) {
  const { title, icon, subtitle, actions, headingLevel = 'h1' } = props
  const HeadingTag = headingLevel
  return (
    <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="flex min-w-0 flex-col gap-0.5">
        <div className="flex items-center gap-2 text-ink">
          {icon ? <span className="shrink-0">{icon}</span> : null}
          <HeadingTag className="truncate text-lg font-semibold">{title}</HeadingTag>
        </div>
        {subtitle ? <div className="truncate text-xs text-ink-subtle">{subtitle}</div> : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div>
      ) : null}
    </div>
  )
}
