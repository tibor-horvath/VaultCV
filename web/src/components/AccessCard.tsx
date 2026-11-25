import { useState, type FormEvent } from 'react'
import { ArrowRight, Clock, Eye, EyeOff, Link2Off, Lock, QrCode, type LucideIcon } from 'lucide-react'
import { useI18n } from '../lib/i18n'
import type { MessageKey } from '../i18n/messages'
import { Button } from './ui/Button'
import { IconButton } from './ui/IconButton'
import { cn } from './ui/cn'

/** Why the full CV is not open: first visit, a session that ran out, or a code the server refused. */
export type AccessCardReason = 'locked' | 'expired' | 'invalid'

type ReasonStyle = {
  icon: LucideIcon
  /** Icon tile and status pill share one soft tone so the reason reads at a glance. */
  tone: string
  dot: string
  pill: MessageKey
  title: MessageKey
  body: MessageKey
}

const REASONS: Record<AccessCardReason, ReasonStyle> = {
  locked: {
    icon: Lock,
    tone: 'bg-accent-soft text-accent-soft-ink',
    dot: 'bg-accent',
    pill: 'accessCardLockedPill',
    title: 'accessCardLockedTitle',
    body: 'accessCardLockedBody',
  },
  expired: {
    icon: Clock,
    tone: 'bg-caution-soft text-caution-soft-ink',
    dot: 'bg-caution',
    pill: 'accessCardExpiredPill',
    title: 'accessCardExpiredTitle',
    body: 'accessCardExpiredBody',
  },
  invalid: {
    icon: Link2Off,
    tone: 'bg-critical-soft text-critical-soft-ink',
    dot: 'bg-critical',
    pill: 'accessCardInvalidPill',
    title: 'accessCardInvalidTitle',
    body: 'accessCardInvalidBody',
  },
}

type AccessCardProps = {
  reason: AccessCardReason
  onSubmit: (code: string) => void
  className?: string
}

/**
 * The lock screen. It sits beside the public profile rather than replacing it, and says why the
 * full CV is closed, so an expired or rejected session needs no separate error page or modal.
 */
export function AccessCard({ reason, onSubmit, className }: AccessCardProps) {
  const { t } = useI18n()
  const [code, setCode] = useState('')
  const [isCodeVisible, setIsCodeVisible] = useState(false)
  const style = REASONS[reason]
  const Icon = style.icon
  const trimmed = code.trim()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!trimmed) return
    onSubmit(trimmed)
  }

  return (
    <section aria-labelledby="access-heading" className={cn('vc-card p-5 sm:p-6', className)}>
      <div className="flex items-center justify-between gap-3">
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', style.tone)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span
          className={cn('inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold', style.tone)}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} aria-hidden="true" />
          {t(style.pill)}
        </span>
      </div>

      <h2 id="access-heading" className="mt-4 text-lg font-semibold text-ink">
        {t(style.title)}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{t(style.body)}</p>

      {/* A real form, so pasting a code and pressing Enter opens the CV. */}
      <form className="mt-5 flex flex-col gap-2" onSubmit={handleSubmit}>
        <label className="text-sm font-semibold text-ink" htmlFor="token">
          {t('accessCode')}
        </label>
        <div className="relative">
          <input
            id="token"
            type={isCodeVisible ? 'text' : 'password'}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('pasteAccessCode')}
            inputMode="text"
            autoComplete="off"
            aria-describedby={!trimmed ? 'token-hint' : undefined}
            aria-invalid={reason === 'invalid' && !trimmed ? true : undefined}
            className="vc-field h-11 pr-11 font-mono tracking-wide placeholder:font-sans placeholder:tracking-normal"
          />
          {trimmed ? (
            <IconButton
              label={isCodeVisible ? t('accessCodeHide') : t('accessCodeShow')}
              onClick={() => setIsCodeVisible((v) => !v)}
              aria-pressed={isCodeVisible}
              size="sm"
              className="absolute right-1.5 top-1/2 -translate-y-1/2"
            >
              {isCodeVisible ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </IconButton>
          ) : null}
        </div>
        {!trimmed ? (
          <p className="text-xs leading-relaxed text-ink-subtle" id="token-hint">
            {t('accessCodeHint')}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          block
          disabled={!trimmed}
          className="group mt-1"
          iconRight={
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
              aria-hidden="true"
            />
          }
        >
          {t('unlockCv')}
        </Button>
      </form>

      <p className="mt-5 flex gap-2.5 border-t border-line pt-4 text-xs leading-relaxed text-ink-subtle">
        <QrCode className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {t('accessCardShareLinkHint')}
      </p>
    </section>
  )
}
