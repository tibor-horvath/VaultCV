import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CircleAlert, FileDown, Lock } from 'lucide-react'
import { PDFViewer } from '@react-pdf/renderer'
import { CvPdfDocument } from '../components/cv/pdf/document/CvPdfDocument'
import { Section } from '../components/cv/Section'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { useLoadingIndicator } from '../lib/loadingIndicator'
import { downloadCvPdf } from '../lib/downloadCvPdf'
import { buildPhotoSrc } from '../lib/cvPresentation'
import { registerPdfFonts } from '../lib/pdf/fonts'
import { resolvePdfProfilePhoto, type PdfProfilePhoto } from '../lib/pdf/pdfImage'
import { getMockCv } from '../lib/mockCv'
import { useI18n } from '../lib/i18n'
import { clearStoredAccessCode, getStoredAccessCode } from '../lib/accessSession'
import { useCvRouteState } from '../hooks/useCvRouteState'

/**
 * Dev-only preview. `App.tsx` lazy-loads this route and redirects it in production, which is what
 * keeps `@react-pdf/renderer` (imported eagerly here for `PDFViewer`) out of the shipped bundle.
 */
export default function CvPdfRoute() {
  const { locale, t } = useI18n()
  const [params] = useSearchParams()
  const accessCode = getStoredAccessCode()
  const state = useCvRouteState(accessCode, locale)
  const [busy, setBusy] = useState(false)
  const [photo, setPhoto] = useState<PdfProfilePhoto | null>(null)

  /** Dev-only: `/cv/pdf?preview=1` shows mock CV layout without unlocking (for layout testing). */
  const pdfDevPreview = import.meta.env.DEV && params.get('preview') === '1'
  // Memoized: `getMockCv` returns a fresh object each call, which would otherwise retrigger the
  // photo effect below on every render.
  const previewCv = useMemo(() => (pdfDevPreview ? getMockCv(locale) : null), [pdfDevPreview, locale])
  const cvReady = pdfDevPreview ? Boolean(previewCv) : state.kind === 'ready'
  const cvData = pdfDevPreview && previewCv ? previewCv : state.kind === 'ready' ? state.cv : null
  const showLoader = useLoadingIndicator(!pdfDevPreview && state.kind === 'loading')

  useEffect(() => {
    registerPdfFonts()
  }, [])

  // `PDFViewer` takes a synchronous element, so the photo has to be resolved before mounting it.
  const photoSrc = cvData ? buildPhotoSrc(cvData.basics) : null
  useEffect(() => {
    let cancelled = false
    if (!photoSrc) {
      setPhoto(null)
      return
    }
    void resolvePdfProfilePhoto(photoSrc).then((resolved) => {
      if (!cancelled) setPhoto(resolved)
    })
    return () => {
      cancelled = true
    }
  }, [photoSrc])

  async function handleDownload() {
    if (!cvReady || !cvData) return
    setBusy(true)
    try {
      const name = cvData.basics.name?.trim().replace(/\s+/g, '-') || 'cv'
      await downloadCvPdf({ cv: cvData, t, locale, fileBaseName: name })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="w-full pb-8">
      {pdfDevPreview ? (
        <p className="mb-4 rounded-field border border-caution/30 bg-caution-soft px-3 py-2 text-xs text-caution-soft-ink">
          {t('pdfDevPreviewBanner')}
        </p>
      ) : null}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted shadow-card transition hover:bg-surface-muted"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t('backToCv')}
        </Link>
        {cvReady ? (
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={busy}
            className="vc-focusable inline-flex h-9 items-center gap-2 rounded-field bg-accent px-4 text-xs font-semibold text-accent-ink shadow-card hover:bg-accent-hover active:translate-y-px disabled:pointer-events-none disabled:opacity-55"
          >
            <FileDown className="h-4 w-4" aria-hidden="true" />
            {busy ? t('generatingPdf') : t('downloadPdf')}
          </button>
        ) : null}
      </div>

      {!pdfDevPreview && state.kind === 'locked' ? (
        <Section title={t('locked')} icon={<Lock className="h-4 w-4" />}>
          <p className="text-sm leading-relaxed text-ink-muted">
            {t('lockedHintPrefix')}{' '}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs text-ink">
              /?s=SHARE_ID
              {locale !== 'en' ? `&lang=${locale}` : ''}
            </code>
          </p>
          <button
            type="button"
            onClick={() => clearStoredAccessCode()}
            className="mt-3 rounded-field border border-line px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-muted"
          >
            Clear stored access
          </button>
        </Section>
      ) : null}

      {!pdfDevPreview && state.kind === 'expired' ? (
        <Section title={t('unableToLoad')} icon={<CircleAlert className="h-4 w-4" />}>
          <p className="text-sm leading-relaxed text-ink-muted">{t('pdfSessionExpiredHint')}</p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 rounded-field border border-line bg-surface px-4 py-2 text-sm font-medium text-ink shadow-card transition hover:bg-surface-muted"
          >
            {t('openCv')}
          </Link>
        </Section>
      ) : null}

      {showLoader ? <LoadingSpinner label={t('loadingCv')} /> : null}

      {!pdfDevPreview && state.kind === 'error' && !showLoader ? (
        <Section title={t('unableToLoad')} icon={<CircleAlert className="h-4 w-4" />}>
          <div className="text-sm text-ink-muted">
            {t(state.messageKey)}
            {state.messageKey === 'requestFailed' && state.status ? ` (${state.status})` : ''}
            {state.details ? ` ${state.details}` : ''}
          </div>
        </Section>
      ) : null}

      {cvReady && cvData && photo ? (
        <PDFViewer style={{ width: '100%', height: '90vh', border: 0 }} showToolbar>
          <CvPdfDocument cv={cvData} t={t} locale={locale} photo={photo} />
        </PDFViewer>
      ) : null}
    </div>
  )
}
