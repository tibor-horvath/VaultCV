import { useEffect, useRef, useState } from 'react'
import { usePageLoadingMarker } from './pageLoading'

/**
 * Waits this long before showing a loader. Anything that resolves faster renders its content
 * directly, so a quick load never flashes a skeleton the user cannot read.
 */
const SHOW_DELAY_MS = 200

/**
 * Once a loader is on screen it stays for at least this long, so a load that finishes just after
 * the delay elapsed cannot strobe it away in a frame or two.
 */
const MIN_VISIBLE_MS = 400

/**
 * Turns "is this request in flight?" into "should a loader be on screen?".
 *
 * Callers must render their loaded content only when this returns false, otherwise the content and
 * the loader overlap during the minimum-visible window.
 */
export function useLoadingIndicator(isLoading: boolean): boolean {
  const [visible, setVisible] = useState(false)
  const shownAtRef = useRef<number | null>(null)

  // Tied to the request, not to the loader: during the delay the route renders nothing, and a
  // footer left standing under that blank area flashes out again as soon as the loader mounts.
  usePageLoadingMarker(isLoading || visible)

  useEffect(() => {
    if (isLoading) {
      // Already showing: re-arming here would push `shownAtRef` forward on every render and
      // stretch the minimum-visible window past what the user actually saw.
      if (visible) return

      const timer = setTimeout(() => {
        shownAtRef.current = Date.now()
        setVisible(true)
      }, SHOW_DELAY_MS)
      return () => clearTimeout(timer)
    }

    if (!visible) return

    const elapsed = Date.now() - (shownAtRef.current ?? Date.now())
    // Always defer through a timer so this never sets state during the effect itself.
    const timer = setTimeout(() => {
      shownAtRef.current = null
      setVisible(false)
    }, Math.max(0, MIN_VISIBLE_MS - elapsed))
    return () => clearTimeout(timer)
  }, [isLoading, visible])

  return visible
}
