import { useEffect, useMemo, useRef, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Share2 } from 'lucide-react'
import { useI18n } from '../lib/i18n'

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
  const [lang, setLang] = useState(initialLang)

  const url = useMemo(
    () => (lang ? `${shareUrlBase}&lang=${encodeURIComponent(lang)}` : shareUrlBase),
    [shareUrlBase, lang],
  )

  const showLangSelector = langOptions.length > 1

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const canShareFiles = typeof navigator !== 'undefined' && 'canShare' in navigator

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
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative z-10 flex flex-col items-center gap-4 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">
          {t('adminQrCode')}
        </div>

        {showLangSelector ? (
          <label className="flex w-full items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            {t('adminShareLanguage')}
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="ml-auto rounded-lg border border-slate-300/70 bg-white px-2 py-1 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              {langOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="rounded-xl border border-slate-200/70 bg-white p-3 dark:border-slate-700 dark:bg-white">
          <QRCodeCanvas
            ref={canvasRef}
            value={url}
            size={200}
            marginSize={1}
          />
        </div>

        <p className="max-w-[220px] break-all text-center font-mono text-[11px] text-slate-500 dark:text-slate-400">
          {url}
        </p>

        <div className="flex gap-2">
          {canShareFiles ? (
            <button
              type="button"
              onClick={() => void shareImage()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/70 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
            >
              <Share2 className="h-4 w-4" /> {t('adminQrShare')}
            </button>
          ) : null}
          <button
            type="button"
            onClick={downloadPng}
            className="rounded-xl border border-slate-300/70 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            {t('adminQrDownload')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            {t('adminQrClose')}
          </button>
        </div>
      </div>
    </div>
  )
}
