import { createContext, useContext, useState, type ReactNode } from 'react'

type AppView = 'landing' | 'cv'

type AppViewApi = {
  view: AppView
  openCv: () => void
  goHome: () => void
}

const AppViewContext = createContext<AppViewApi | null>(null)

export function AppViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<AppView>('landing')
  const value: AppViewApi = {
    view,
    openCv: () => setView('cv'),
    goHome: () => setView('landing'),
  }
  return <AppViewContext.Provider value={value}>{children}</AppViewContext.Provider>
}

export function useAppView() {
  const value = useContext(AppViewContext)
  if (!value) {
    throw new Error('useAppView must be used inside AppViewProvider')
  }
  return value
}
