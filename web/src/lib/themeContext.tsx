/* eslint-disable react-refresh/only-export-components -- module exports provider + hook */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { applyTheme, setStoredTheme, type ThemePreference } from './theme'
import { startThemeTransition } from './themeTransition'
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
      toggleTheme: () => {
        const next: ThemePreference = theme === 'dark' ? 'light' : 'dark'
        startThemeTransition(() => {
          // Both halves have to land inside the callback for the snapshot to be complete: the
          // class drives every `dark:` variant, and the React state drives the toggle's own
          // icon and label. `applyTheme` is idempotent, so the effect re-running is harmless.
          applyTheme(next)
          flushSync(() => setTheme(next))
        })
      },
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
