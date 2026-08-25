import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Share2 } from 'lucide-react'
import { useI18n } from '../lib/i18n'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type LangOption = { value: string; label: string }

type QrCodeModalProps = {
  shareUrlBase: string
  initialLang: string
  langOptions: LangOption[]
  onClose: () => void
}

export function QrCodeModal({ shareUrlBase, initialLang, langOptions, onClose }: QrCodeModalProps) {
  const { t } = useI18n()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [lang, setLang] = useState(initialLang)

  const url = useMemo(
    () => (lang ? `${shareUrlBase}&lang=${encodeURIComponent(lang)}` : shareUrlBase),
    [shareUrlBase, lang],
  )

  const showLangSelector = langOptions.filter((o) => o.value !== '').length > 1

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Move focus into the dialog on open, and return it to the trigger on close.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()
    return () => {
      previouslyFocused?.focus?.()
    }
  }, [])

  // Keep Tab inside the dialog while it is open.
  function handleTabKey(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key !== 'Tab') return
    const card = cardRef.current
    if (!card) return
    const focusables = Array.from(card.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    if (!focusables.length) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const active = document.activeElement
    const isInside = active instanceof Node && card.contains(active)

    if (e.shiftKey && (!isInside || active === first)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (!isInside || active === last)) {
      e.preventDefault()
      first.focus()
    }
  }

  const canShareFiles =
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function'

  function downloadPng() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'qr-code.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async function shareImage() {
    const canvas = canvasRef.current
    if (!canvas) return
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return
    const file = new File([blob], 'qr-code.png', { type: 'image/png' })
    if (!navigator.canShare?.({ files: [file] })) return
    try {
      await navigator.share({ files: [file] })
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      console.error('Failed to share QR code image', e)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('adminQrCodeFor').replace('{url}', url)}
      onKeyDown={handleTabKey}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm motion-safe:animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        ref={cardRef}
        className="vc-card relative z-10 flex w-full max-w-xs flex-col items-center gap-4 p-5 shadow-overlay motion-safe:animate-fade-in"
      >
        <h2 className="text-sm font-semibold text-ink">{t('adminQrCode')}</h2>

        {showLangSelector ? (
          <label className="flex w-full items-center gap-2 text-xs font-medium text-ink-muted">
            {t('adminShareLanguage')}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="vc-field ml-auto w-auto py-1 text-xs"
            >
              {langOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {/* White plate regardless of theme: a QR code has to stay high-contrast to scan. */}
        <div className="rounded-field border border-line bg-white p-3">
          <QRCodeCanvas
            ref={canvasRef}
            value={url}
            size={200}
            marginSize={1}
          />
        </div>

        <p className="max-w-[220px] break-all text-center font-mono text-[11px] text-ink-subtle">
          {url}
        </p>

        <div className="flex flex-wrap justify-center gap-2">
          {canShareFiles ? (
            <button
              type="button"
              onClick={() => void shareImage()}
              className="vc-focusable inline-flex h-9 items-center gap-1.5 rounded-field border border-line bg-surface px-3 text-sm font-medium text-ink-muted shadow-card hover:border-line-strong hover:bg-surface-muted hover:text-ink"
            >
              <Share2 className="h-4 w-4" /> {t('adminQrShare')}
            </button>
          ) : null}
          <button
            type="button"
            onClick={downloadPng}
            className="vc-focusable inline-flex h-9 items-center rounded-field border border-line bg-surface px-3 text-sm font-medium text-ink-muted shadow-card hover:border-line-strong hover:bg-surface-muted hover:text-ink"
          >
            {t('adminQrDownload')}
          </button>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="vc-focusable inline-flex h-9 items-center rounded-field bg-accent px-3 text-sm font-semibold text-accent-ink shadow-card hover:bg-accent-hover"
          >
            {t('adminQrClose')}
          </button>
        </div>
      </div>
    </div>
  )
}
