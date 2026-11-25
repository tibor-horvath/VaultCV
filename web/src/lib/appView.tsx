/* eslint-disable react-refresh/only-export-components -- module exports provider + hook */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type AppView = 'landing' | 'cv'

/** Why the CV view sent the visitor back to the landing page; the access card explains it. */
export type LockReason = 'expired' | 'invalid'

type AppViewApi = {
  view: AppView
  /** Set by `goHome(reason)`, cleared by the next `openCv()`. */
  lockReason: LockReason | null
  openCv: () => void
  goHome: (reason?: LockReason) => void
}

const AppViewContext = createContext<AppViewApi | null>(null)

export function AppViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>('landing')
  const [lockReason, setLockReason] = useState<LockReason | null>(null)
  const openCv = useCallback(() => {
    setLockReason(null)
    setView('cv')
  }, [])
  const goHome = useCallback((reason?: LockReason) => {
    setLockReason(reason ?? null)
    setView('landing')
  }, [])
  const value = useMemo<AppViewApi>(
    () => ({ view, lockReason, openCv, goHome }),
    [view, lockReason, openCv, goHome],
  )
  return <AppViewContext.Provider value={value}>{children}</AppViewContext.Provider>
}

export function useAppView() {
  const value = useContext(AppViewContext)
  if (!value) {
    throw new Error('useAppView must be used inside AppViewProvider')
  }
  return value
}
