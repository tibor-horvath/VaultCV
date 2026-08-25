import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

type IconButtonProps = {
  /** Required: the control has no visible text, so this is its only accessible name. */
  label: string
  children: ReactNode
  size?: 'sm' | 'md'
  variant?: 'ghost' | 'outline'
}

const SIZE = {
  sm: 'h-7 w-7 rounded-field',
  md: 'h-9 w-9 rounded-field',
}

const VARIANT = {
  ghost: 'border border-transparent text-ink-muted hover:bg-surface-muted hover:text-ink',
  outline: 'border border-line bg-surface text-ink-muted shadow-card hover:border-line-strong hover:text-ink',
}

const BASE = 'vc-focusable inline-flex shrink-0 items-center justify-center disabled:pointer-events-none disabled:opacity-55'

/** Square control for a bare icon. Never renders visible text, so `label` is mandatory. */
export function IconButton({
  label,
  children,
  size = 'md',
  variant = 'ghost',
  className,
  type = 'button',
  ...rest
}: IconButtonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(BASE, SIZE[size], VARIANT[variant], className)}
      {...rest}
    >
      {children}
    </button>
  )
}

export function IconLink({
  label,
  children,
  size = 'md',
  variant = 'outline',
  className,
  ...rest
}: IconButtonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a aria-label={label} title={label} className={cn(BASE, SIZE[size], VARIANT[variant], className)} {...rest}>
      {children}
    </a>
  )
}
