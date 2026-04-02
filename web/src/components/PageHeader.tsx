import type { ReactNode } from 'react'

/**
 * Generic page header component used across the app.
 * Displays a title with optional icon, subtitle/email, and action buttons.
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white">
          {icon ? <span className="shrink-0">{icon}</span> : null}
          <HeadingTag className="text-lg font-semibold">{title}</HeadingTag>
        </div>
        {subtitle ? (
          <div className="truncate text-xs text-slate-600 dark:text-slate-300">
            {subtitle}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">{actions}</div>
      ) : null}
    </div>
  )
}
