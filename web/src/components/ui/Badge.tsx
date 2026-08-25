import type { ReactNode } from 'react'
import { cn } from './cn'

export type BadgeTone = 'neutral' | 'accent' | 'positive' | 'caution' | 'critical'

const TONE: Record<BadgeTone, string> = {
  neutral: 'border-line bg-surface-muted text-ink-muted',
  accent: 'border-accent/25 bg-accent-soft text-accent-soft-ink',
  positive: 'border-positive/25 bg-positive-soft text-positive-soft-ink',
  caution: 'border-caution/30 bg-caution-soft text-caution-soft-ink',
  critical: 'border-critical/25 bg-critical-soft text-critical-soft-ink',
}

/** Status pill. Tone carries the meaning, so the text never has to repeat "ok"/"error". */
export function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
  ...rest
}: {
  tone?: BadgeTone
  icon?: ReactNode
  children: ReactNode
  className?: string
} & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-2xs font-semibold',
        TONE[tone],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  )
}

/** Read-only tag for skills, languages, tech stacks — quieter than a Badge, and repeatable. */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-line bg-surface-muted px-2 py-1 text-2xs font-medium leading-none text-ink-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}
