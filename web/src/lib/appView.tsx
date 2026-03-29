/* eslint-disable react-refresh/only-export-components -- module exports provider + hook */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

type AppView = 'landing' | 'cv'

type AppViewApi = {
  view: AppView
  openCv: () => void
  goHome: () => void
}

const AppViewContext = createContext<AppViewApi | null>(null)

export function AppViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>('landing')
  const openCv = useCallback(() => setView('cv'), [])
  const goHome = useCallback(() => setView('landing'), [])
  const value = useMemo<AppViewApi>(() => ({ view, openCv, goHome }), [view, openCv, goHome])
  return <AppViewContext.Provider value={value}>{children}</AppViewContext.Provider>
}

export function useAppView() {
  const value = useContext(AppViewContext)
  if (!value) {
    throw new Error('useAppView must be used inside AppViewProvider')
  }
  return value
}
