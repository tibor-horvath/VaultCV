import { useCallback, useEffect, useState } from 'react'

/**
 * Tracks whether an element has scrolled up past `offset` pixels from the top of the viewport.
 *
 * Returns a callback ref to put on the element you want to watch, plus the boolean.
 *
 * Deliberately *not* `IntersectionObserver`. With the implicit root, how faithfully an engine
 * clips the target through intermediate scroll containers varies — which is how the CV top bar
 * came to work in local development and never appear in production. `getBoundingClientRect()` is
 * viewport-relative everywhere and does not care which element is doing the scrolling, and the
 * capture-phase scroll listener catches scrolling in nested containers as well as on the document.
 */
export function useScrolledPast(offset = 0): [(node: HTMLElement | null) => void, boolean] {
  const [node, setNode] = useState<HTMLElement | null>(null)
  const [scrolledPast, setScrolledPast] = useState(false)

  useEffect(() => {
    if (!node) return

    let frame = 0

    const measure = () => {
      frame = 0
      setScrolledPast(node.getBoundingClientRect().bottom <= offset)
    }

    // Coalesce bursts of scroll events into one measurement per frame. The first measurement goes
    // through the same path, so the effect body itself never sets state.
    const schedule = () => {
      if (frame) return
      frame = requestAnimationFrame(measure)
    }

    schedule()

    window.addEventListener('scroll', schedule, { passive: true, capture: true })
    window.addEventListener('resize', schedule)

    // The element's own height changes when the profile photo loads or the summary reflows.
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    resizeObserver?.observe(node)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule, { capture: true })
      window.removeEventListener('resize', schedule)
      resizeObserver?.disconnect()
    }
  }, [node, offset])

  const ref = useCallback((next: HTMLElement | null) => setNode(next), [])

  // Gate on `node` rather than resetting state when it unmounts: with nothing to measure the
  // answer is "not scrolled past", and deriving it keeps the effect free of state writes.
  return [ref, node ? scrolledPast : false]
}
