import { Lock, ShieldCheck } from 'lucide-react'

export function SessionStatusBadge({
  isLocked,
  lockedText,
  unlockedText,
  expiresInSeconds,
  size = 'sm',
  minWidthClass = 'min-w-[13.5rem]',
}: {
  isLocked: boolean
  lockedText: string
  unlockedText: string
  expiresInSeconds?: number
  size?: 'sm' | 'xs'
  minWidthClass?: string
}) {
  const sizeClasses = size === 'xs' ? 'text-xs px-3 py-1' : 'text-sm px-3 py-1'
  const iconClass = size === 'xs' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  const derivedIsLocked = isLocked || (expiresInSeconds !== undefined && expiresInSeconds <= 0)
  const isExpiringSoon = !derivedIsLocked && expiresInSeconds !== undefined && expiresInSeconds < 60 * 60

  const formatTimeRemaining = (totalSeconds: number) => {
    const clamped = Math.max(0, Math.floor(totalSeconds))
    if (clamped < 3600) {
      const minutes = Math.floor(clamped / 60)
      const seconds = clamped % 60
      return `${minutes}m ${seconds}s`
    }
    const hours = Math.floor(clamped / 3600)
    const minutes = Math.floor((clamped % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const activeLabel =
    !derivedIsLocked && expiresInSeconds !== undefined
      ? `Access active • ${formatTimeRemaining(expiresInSeconds)}`
      : unlockedText

  return (
    <div
      className={`inline-flex ${minWidthClass} items-center justify-center gap-1.5 rounded-full border font-semibold ${sizeClasses} ${
        derivedIsLocked
          ? 'border-rose-200/80 bg-rose-50/90 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/40 dark:text-rose-300'
          : isExpiringSoon
            ? 'border-amber-200/80 bg-amber-50/90 text-amber-800 dark:border-amber-800/70 dark:bg-amber-950/35 dark:text-amber-200'
            : 'border-emerald-200/80 bg-emerald-50/90 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/40 dark:text-emerald-300'
      }`}
    >
      {derivedIsLocked ? (
        <Lock className={`${iconClass} opacity-80`} aria-hidden="true" />
      ) : (
        <ShieldCheck className={`${iconClass} opacity-80`} aria-hidden="true" />
      )}
      <span className="whitespace-nowrap">{derivedIsLocked ? lockedText : activeLabel}</span>
    </div>
  )
}

