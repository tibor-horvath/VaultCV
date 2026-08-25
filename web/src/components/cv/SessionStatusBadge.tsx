import { Lock, ShieldCheck } from 'lucide-react'
import { useI18n } from '../../lib/i18n'
import { Badge } from '../ui/Badge'

/**
 * State of the reader's access, as a single pill.
 *
 * Tone does the talking: green while the session is comfortable, amber inside the last hour so an
 * expiry is not a surprise, red once it is gone.
 */
export function SessionStatusBadge({
  isLocked,
  lockedText,
  unlockedText,
  activeTooltipText,
  expiresInSeconds,
  size = 'sm',
  minWidthClass = '',
}: {
  isLocked: boolean
  lockedText: string
  unlockedText: string
  activeTooltipText?: string
  expiresInSeconds?: number
  size?: 'sm' | 'xs'
  minWidthClass?: string
}) {
  const { t } = useI18n()

  const derivedIsLocked = isLocked || (expiresInSeconds !== undefined && expiresInSeconds <= 0)
  const isExpiringSoon = !derivedIsLocked && expiresInSeconds !== undefined && expiresInSeconds < 60 * 60

  const formatTimeRemaining = (totalSeconds: number) => {
    const clamped = Math.max(0, Math.floor(totalSeconds))
    if (clamped < 3600) {
      const minutes = Math.floor(clamped / 60)
      const seconds = clamped % 60
      return t('durationMinutesSeconds')
        .replace('{minutes}', String(minutes))
        .replace('{seconds}', String(seconds))
    }
    const hours = Math.floor(clamped / 3600)
    const minutes = Math.floor((clamped % 3600) / 60)
    return t('durationHoursMinutes').replace('{hours}', String(hours)).replace('{minutes}', String(minutes))
  }

  const activeLabel =
    !derivedIsLocked && expiresInSeconds !== undefined
      ? `${t('accessActive')} · ${formatTimeRemaining(expiresInSeconds)}`
      : unlockedText

  const iconClass = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5'

  return (
    <Badge
      tone={derivedIsLocked ? 'critical' : isExpiringSoon ? 'caution' : 'positive'}
      title={derivedIsLocked ? undefined : activeTooltipText}
      className={minWidthClass}
      icon={
        derivedIsLocked ? (
          <Lock className={iconClass} aria-hidden="true" />
        ) : (
          <ShieldCheck className={iconClass} aria-hidden="true" />
        )
      }
    >
      {/*
        Fixed-width digits: the countdown ticks every second, and proportional figures would make
        the pill twitch as the numbers change width.
      */}
      <span className="whitespace-nowrap tabular-nums">{derivedIsLocked ? lockedText : activeLabel}</span>
    </Badge>
  )
}
