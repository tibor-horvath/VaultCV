type LoadingSpinnerProps = {
  /** Announced to screen readers, and shown under the spinner unless `labelHidden` is set. */
  label: string
  labelHidden?: boolean
  className?: string
}

/**
 * Centered spinner used for every "waiting for the CV/session" state, so slow loads show motion
 * instead of a static card that reads as a stuck page.
 */
export function LoadingSpinner({ label, labelHidden = false, className = 'py-24' }: LoadingSpinnerProps) {
  return (
    <div
      className={`mx-auto flex w-full flex-1 flex-col items-center justify-center gap-4 ${className}`}
      aria-busy="true"
      role="status"
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700 dark:border-slate-600 dark:border-t-slate-200"
        aria-hidden
      />
      <p className={`text-center text-sm text-slate-600 dark:text-slate-400${labelHidden ? ' sr-only' : ''}`}>
        {label}
      </p>
    </div>
  )
}
