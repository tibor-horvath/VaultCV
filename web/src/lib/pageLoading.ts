import { useEffect, useSyncExternalStore } from 'react'

/**
 * Tracks whether a full-page loader is on screen, so `AppShell` can drop chrome (the footer) that
 * looks stranded under a page that has not drawn yet.
 *
 * Kept in a module-level store rather than context so a loader can register itself on mount,
 * instead of every route having to thread a flag up to the shell.
 */
let activeLoaders = 0
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return activeLoaders > 0
}

/** True while at least one full-page loader is mounted. */
export function useIsPageLoading() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/**
 * Marks the page as loading while `active`, defaulting to the calling component's whole lifetime.
 *
 * Registrations are counted, so overlapping callers (a route's request plus the loader it renders)
 * are safe.
 */
export function usePageLoadingMarker(active = true) {
  useEffect(() => {
    if (!active) return

    activeLoaders += 1
    emit()
    return () => {
      activeLoaders -= 1
      emit()
    }
  }, [active])
}
