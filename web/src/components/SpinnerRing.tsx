/**
 * The shared loading ring: a faint track plus one round-capped arc, spinning.
 *
 * `strokeWidth` is in viewBox units (the ring is drawn at 56 and scaled by `className`), so small
 * sizes need a proportionally larger value to keep the stroke ~2px on screen.
 */
export function SpinnerRing({
  className = 'h-14 w-14',
  strokeWidth = 2.5,
}: {
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      className={`shrink-0 motion-safe:animate-spin ${className}`}
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="28" cy="28" r="25" strokeWidth={strokeWidth} className="stroke-line" />
      <circle
        cx="28"
        cy="28"
        r="25"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        /* One dash longer than the 156.07 circumference draws a single ~92° arc with no seam. */
        strokeDasharray="40 118"
        className="stroke-accent"
      />
    </svg>
  )
}
