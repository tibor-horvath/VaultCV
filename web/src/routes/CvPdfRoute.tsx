import { useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CircleAlert, FileDown, Hourglass, Lock } from 'lucide-react'
import { CvPdfLayout } from '../components/cv/pdf/CvPdfLayout'
import { Section } from '../components/cv/Section'
import { downloadCvPdf } from '../lib/downloadCvPdf'
import { getMockCv } from '../lib/mockCv'
import { useI18n } from '../lib/i18n'
import { clearStoredAccessCode, getStoredAccessCode } from '../lib/accessSession'
import { useCvRouteState } from '../hooks/useCvRouteState'

export function CvPdfRoute() {
  const { locale, t } = useI18n()
  const [params] = useSearchParams()
  const accessCode = getStoredAccessCode()
  const state = useCvRouteState(accessCode, locale)
  const captureRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)

  /** Dev-only: `/cv/pdf?preview=1` shows mock CV layout without unlocking (for layout testing). */
  const pdfDevPreview = import.meta.env.DEV && params.get('preview') === '1'
  const previewCv = pdfDevPreview ? getMockCv(locale) : null
  const cvReady = pdfDevPreview ? Boolean(previewCv) : state.kind === 'ready'
  const cvData = pdfDevPreview && previewCv ? previewCv : state.kind === 'ready' ? state.cv : null

  async function handleDownload() {
    const el = captureRef.current
    if (!el || !cvReady || !cvData) return
    setBusy(true)
    try {
      const name = cvData.basics.name?.trim().replace(/\s+/g, '-') || 'cv'
      await downloadCvPdf({ root: el, fileBaseName: name })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full pb-8">
      {pdfDevPreview ? (
        <p className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
          {t('pdfDevPreviewBanner')}
        </p>
      ) : null}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-700/70 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('backToCv')}
        </Link>
        {cvReady ? (
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileDown className="h-4 w-4" aria-hidden="true" />
            {busy ? t('generatingPdf') : t('downloadPdf')}
          </button>
        ) : null}
      </div>

      {!pdfDevPreview && state.kind === 'locked' ? (
        <Section title={t('locked')} icon={<Lock className="h-4 w-4" />}>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {t('lockedHintPrefix')}{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-100">
              /?s=SHARE_ID
              {locale !== 'en' ? `&lang=${locale}` : ''}
            </code>
          </p>
          <button
            type="button"
            onClick={() => clearStoredAccessCode()}
            className="mt-3 rounded-lg border border-slate-300/70 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900/60"
          >
            Clear stored access
          </button>
        </Section>
      ) : null}

      {!pdfDevPreview && state.kind === 'expired' ? (
        <Section title={t('unableToLoad')} icon={<CircleAlert className="h-4 w-4" />}>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{t('pdfSessionExpiredHint')}</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300/70 bg-white/90 px-4 py-2 text-sm font-medium text-slate-800 shadow-sm transition hover:bg-white dark:border-slate-600 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-900"
          >
            {t('openCv')}
          </Link>
        </Section>
      ) : null}

      {!pdfDevPreview && state.kind === 'loading' ? (
        <Section title={t('loading')} icon={<Hourglass className="h-4 w-4" />}>
          <div className="text-sm text-slate-700 dark:text-slate-300">{t('loadingCv')}</div>
        </Section>
      ) : null}

      {!pdfDevPreview && state.kind === 'error' ? (
        <Section title={t('unableToLoad')} icon={<CircleAlert className="h-4 w-4" />}>
          <div className="text-sm text-slate-700 dark:text-slate-300">
            {t(state.messageKey)}
            {state.messageKey === 'requestFailed' && state.status ? ` (${state.status})` : ''}
            {state.details ? ` ${state.details}` : ''}
          </div>
        </Section>
      ) : null}

      {cvReady && cvData ? <CvPdfLayout ref={captureRef} cv={cvData} /> : null}
    </div>
  )
}
