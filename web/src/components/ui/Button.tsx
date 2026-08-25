import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * Buttons come in exactly four weights so a screen can only ever have one obvious primary action:
 *
 * - `primary`   filled accent — the single main action of a view
 * - `secondary` outlined surface — everything else that commits a change
 * - `ghost`     borderless — toolbar and icon-adjacent actions
 * - `danger`    destructive confirmations
 */
const VARIANT: Record<ButtonVariant, string> = {
  primary:
    'border border-transparent bg-accent text-accent-ink shadow-card hover:bg-accent-hover active:translate-y-px',
  secondary:
    'border border-line bg-surface text-ink shadow-card hover:border-line-strong hover:bg-surface-muted active:translate-y-px',
  ghost: 'border border-transparent bg-transparent text-ink-muted hover:bg-surface-muted hover:text-ink',
  danger:
    'border border-transparent bg-critical text-white shadow-card hover:brightness-110 active:translate-y-px',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-field px-2.5 text-xs',
  md: 'h-9 gap-2 rounded-field px-3.5 text-sm',
  lg: 'h-11 gap-2 rounded-field px-5 text-sm',
}

const BASE =
  'vc-focusable inline-flex shrink-0 items-center justify-center whitespace-nowrap font-semibold ' +
  'disabled:pointer-events-none disabled:opacity-55'

type CommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Stretches to the container width — use for the primary action in narrow/mobile layouts. */
  block?: boolean
  /** Swaps the leading icon for a spinner and blocks interaction. */
  busy?: boolean
  iconLeft?: ReactNode
  iconRight?: ReactNode
  children?: ReactNode
}

function buttonClass({ variant = 'secondary', size = 'md', block, className }: CommonProps & { className?: string }) {
  return cn(BASE, VARIANT[variant], SIZE[size], block && 'w-full', className)
}

export function Button({
  variant,
  size = 'md',
  block,
  busy = false,
  iconLeft,
  iconRight,
  children,
  className,
  disabled,
  type = 'button',
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <button
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={buttonClass({ variant, size, block, className })}
      {...rest}
    >
      {busy ? (
        <LoaderCircle className={cn(iconSize, 'shrink-0 motion-safe:animate-spin')} aria-hidden="true" />
      ) : (
        iconLeft
      )}
      {children}
      {busy ? null : iconRight}
    </button>
  )
}

/** Anchor styled as a button. Same weights, so links and buttons never look like two systems. */
export function ButtonLink({
  variant,
  size,
  block,
  iconLeft,
  iconRight,
  children,
  className,
  ...rest
}: CommonProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a className={buttonClass({ variant, size, block, className })} {...rest}>
      {iconLeft}
      {children}
      {iconRight}
    </a>
  )
}
