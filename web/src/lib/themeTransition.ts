/**
 * Cross-fades the whole page when the theme flips.
 *
 * Uses the View Transitions API rather than CSS transitions: the shell's backdrop is a
 * `radial-gradient` (a background-image, which cannot be transitioned), so a colour-only approach
 * would snap the backdrop while the cards faded. A view transition cross-fades a snapshot of the
 * rendered page, so gradients, shadows and images all come along.
 *
 * Where the API is missing, or the user asked for reduced motion, the change is applied directly
 * and the theme simply switches instantly — the behaviour before this existed.
 */
type ViewTransitionApi = {
  startViewTransition?: (callback: () => void) => unknown
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export function startThemeTransition(applyChange: () => void): void {
  const doc = document as Document & ViewTransitionApi

  if (typeof doc.startViewTransition !== 'function' || prefersReducedMotion()) {
    applyChange()
    return
  }

  doc.startViewTransition(applyChange)
}
