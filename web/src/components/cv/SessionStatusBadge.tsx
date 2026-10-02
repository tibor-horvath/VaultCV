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
  variant = 'pill',
}: {
  isLocked: boolean
  lockedText: string
  unlockedText: string
  activeTooltipText?: string
  expiresInSeconds?: number
  size?: 'sm' | 'xs'
  minWidthClass?: string
  /**
   * `pill` is the compact badge. `stacked` is an icon tile beside a label/countdown pair, sized to
   * sit at the start of the mobile toolbar where the pill alone would read as a stray chip.
   */
  variant?: 'pill' | 'stacked'
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

  if (variant === 'stacked') {
    const tone = derivedIsLocked ? STACKED_TONE.critical : isExpiringSoon ? STACKED_TONE.caution : STACKED_TONE.positive
    const value =
      derivedIsLocked
        ? null
        : expiresInSeconds !== undefined
          ? t('timeLeft').replace('{time}', formatTimeRemaining(expiresInSeconds))
          : unlockedText
    const Icon = derivedIsLocked ? Lock : ShieldCheck

    return (
      <div
        className={`flex min-w-0 items-center gap-2.5 ${minWidthClass}`}
        title={derivedIsLocked ? lockedText : activeTooltipText}
      >
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-field ${tone.tile}`}>
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
            {derivedIsLocked ? t('locked') : t('accessActive')}
          </span>
          {value ? (
            <span className={`truncate text-[15px] font-semibold tabular-nums ${tone.text}`}>{value}</span>
          ) : null}
        </span>
      </div>
    )
  }

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

// Spelled out in full so Tailwind's scanner sees every class.
const STACKED_TONE = {
  positive: { tile: 'bg-positive-soft text-positive', text: 'text-positive-soft-ink' },
  caution: { tile: 'bg-caution-soft text-caution', text: 'text-caution-soft-ink' },
  critical: { tile: 'bg-critical-soft text-critical', text: 'text-critical-soft-ink' },
}
