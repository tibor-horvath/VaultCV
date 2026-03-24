import { Lock, ShieldCheck, Timer } from 'lucide-react'

export function SessionStatusBadge({
  isLocked,
  lockedText,
  unlockedText,
  size = 'sm',
  minWidthClass = 'min-w-[13.5rem]',
}: {
  isLocked: boolean
  lockedText: string
  unlockedText: string
  size?: 'sm' | 'xs'
  minWidthClass?: string
}) {
  const sizeClasses = size === 'xs' ? 'text-xs px-3 py-1' : 'text-sm px-3 py-1'
  const iconClass = size === 'xs' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <div
      className={`inline-flex ${minWidthClass} items-center justify-center gap-1.5 rounded-full border font-semibold ${sizeClasses} ${
        isLocked
          ? 'border-rose-200/80 bg-rose-50/90 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/40 dark:text-rose-300'
          : 'border-emerald-200/80 bg-emerald-50/90 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/40 dark:text-emerald-300'
      }`}
    >
      {isLocked ? (
        <Lock className={`${iconClass} opacity-80`} aria-hidden="true" />
      ) : size === 'xs' ? (
        <Timer className={`${iconClass} opacity-80`} aria-hidden="true" />
      ) : (
        <ShieldCheck className={`${iconClass} opacity-80`} aria-hidden="true" />
      )}
      <span className="whitespace-nowrap">{isLocked ? lockedText : unlockedText}</span>
    </div>
  )
}

