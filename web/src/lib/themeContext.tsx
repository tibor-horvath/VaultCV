/* eslint-disable react-refresh/only-export-components -- module exports provider + hook */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyTheme, setStoredTheme, type ThemePreference } from './theme'
import { resolveInitialThemeForMode } from './themePreference'

type ThemeApi = {
  theme: ThemePreference
  setTheme: (theme: ThemePreference) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeApi | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemePreference>(() => {
    const isMock = import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_CV === '1'
    return resolveInitialThemeForMode(isMock)
  })

  useEffect(() => {
    applyTheme(theme)
    setStoredTheme(theme)
  }, [theme])

  const value = useMemo<ThemeApi>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider')
  }
  return value
}
