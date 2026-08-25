import { FileText } from 'lucide-react'
import { SpinnerRing } from './SpinnerRing'
import { usePageLoadingMarker } from '../lib/pageLoading'

type LoadingSpinnerProps = {
  /** Announced to screen readers, and shown under the spinner unless `labelHidden` is set. */
  label: string
  labelHidden?: boolean
  className?: string
}

/**
 * Compact loader for waits with nothing to preview — the admin session check, the landing session
 * probe, the PDF route. A thin ring with a single round-capped arc around a muted document glyph.
 *
 * Where the CV itself is loading, `CvLoadingScreen` uses a smaller inline ring beside its label,
 * so the big glyph does not sit on top of the skeleton.
 *
 * Mounting this marks the page as loading, which hides the shell footer for the duration. That
 * also covers `CvLoadingScreen`, which renders this.
 */
export function LoadingSpinner({ label, labelHidden = false, className = 'py-24' }: LoadingSpinnerProps) {
  usePageLoadingMarker()

  return (
    <div
      className={`mx-auto flex w-full flex-col items-center justify-center gap-5 ${className}`}
      aria-busy="true"
      role="status"
    >
      <span className="relative inline-flex h-14 w-14 items-center justify-center">
        <SpinnerRing className="absolute inset-0 h-full w-full" />
        <FileText className="h-5 w-5 text-slate-400 dark:text-slate-500" aria-hidden="true" />
      </span>
      <p className={`text-center text-sm text-slate-600 dark:text-slate-400${labelHidden ? ' sr-only' : ''}`}>
        {label}
      </p>
    </div>
  )
}
