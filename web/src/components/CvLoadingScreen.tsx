import { SpinnerRing } from './SpinnerRing'
import { getBrand } from '../lib/brand'
import { usePageLoadingMarker } from '../lib/pageLoading'

/** Card chrome shared with `BasicsCard` / `Section`, so the skeleton lines up with the real CV. */
const cardClass =
  'relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 p-5 shadow-[0_20px_45px_-35px_rgba(15,23,42,0.55)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-900/35 sm:p-6'

function Bar({ className }: { className: string }) {
  return <div className={`rounded-md bg-slate-200/90 dark:bg-slate-700/50 ${className}`} />
}

/** Light sweeping across the placeholders — the motion cue that replaces a spinner. */
function Shimmer() {
  return (
    <div
      className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent motion-safe:animate-shimmer dark:via-slate-100/[0.10]"
      aria-hidden="true"
    />
  )
}

function SkeletonCard({ children }: { children: React.ReactNode }) {
  return (
    <div className={cardClass}>
      {children}
      <Shimmer />
    </div>
  )
}

type CvLoadingScreenProps = {
  label: string
  /**
   * False where the skeleton sits inside an already-drawn page (the landing public preview): the
   * label stays for screen readers only, and the shell footer is left alone.
   */
  fullPage?: boolean
}

/**
 * Loading state shaped like the CV itself — photo, name, contact lines, a text section and a chip
 * section — with light sweeping across it, so the wait previews what is coming. A small ring sits
 * beside the label: the sweep alone is too quiet to read as "still working".
 */
export function CvLoadingScreen({ label, fullPage = true }: CvLoadingScreenProps) {
  return (
    <div className="space-y-6" aria-busy="true" role="status">
      {fullPage ? <FullPageHeading label={label} /> : <span className="sr-only">{label}</span>}

      <div className="space-y-6" aria-hidden="true">
        <SkeletonCard>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="mx-auto flex-shrink-0 sm:mx-0">
              <div className="h-48 w-48 rounded-full bg-slate-200/90 dark:bg-slate-700/50 sm:h-56 sm:w-56" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <Bar className="h-8 w-3/4 max-w-sm" />
              <Bar className="h-4 w-1/2 max-w-xs" />
              <Bar className="h-4 w-2/3 max-w-sm" />
            </div>
          </div>
        </SkeletonCard>

        <SkeletonCard>
          <Bar className="h-5 w-36" />
          <div className="mt-4 space-y-2">
            <Bar className="h-4 w-full" />
            <Bar className="h-4 w-[92%]" />
            <Bar className="h-4 w-4/5" />
          </div>
        </SkeletonCard>

        <SkeletonCard>
          <Bar className="h-5 w-44" />
          <div className="mt-4 flex flex-wrap gap-2">
            <Bar className="h-6 w-16" />
            <Bar className="h-6 w-20" />
            <Bar className="h-6 w-[4.5rem]" />
          </div>
        </SkeletonCard>
      </div>
    </div>
  )
}

function FullPageHeading({ label }: { label: string }) {
  // Marks the page as loading so the shell drops its footer while the skeleton is up.
  usePageLoadingMarker()
  const brand = getBrand()

  return (
    <div className="flex flex-col items-center gap-2 pb-2 pt-6">
      <div className="flex items-center justify-center gap-2.5">
        {/* Small and inline: the skeleton already fills the page, so the ring only has to say
            "still working" — at 16px it needs a proportionally heavier stroke to stay visible. */}
        <SpinnerRing className="h-4 w-4" strokeWidth={7} />
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">{label}</p>
      </div>
      {/* The shell footer is hidden while loading, so the wordmark keeps the site identified. */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        {brand.name}
      </p>
    </div>
  )
}
